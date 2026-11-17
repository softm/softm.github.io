const ALLOWED=new Set(['https://softm.github.io','https://appassets.androidplatform.net']);
const MAX_BODY=3_400_000,MAX_ITEMS=5_000,MAX_TOMBSTONES=5_000;
const encoder=new TextEncoder(),decoder=new TextDecoder();
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const b64=bytes=>{let raw='';for(let offset=0;offset<bytes.length;offset+=0x8000)raw+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const un64=value=>{const normalized=value.replace(/-/g,'+').replace(/_/g,'/');const raw=atob(normalized+'='.repeat((4-normalized.length%4)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0));};
function fail(message,status=400){throw Object.assign(Error(message),{status});}
function cors(request,response){
 const origin=request.headers.get('Origin');if(!origin||!ALLOWED.has(origin))return response;
 const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');headers.set('Access-Control-Allow-Headers','Authorization,Content-Type');headers.set('Vary','Origin');return new Response(response.body,{status:response.status,headers});
}
function validEntry(entry){
 return entry&&typeof entry==='object'&&/^[A-Za-z0-9-]{1,90}$/.test(entry.id)&&typeof entry.expression==='string'&&entry.expression.length<=2048&&typeof entry.value==='string'&&entry.value.length<=2048&&typeof entry.name==='string'&&entry.name.length<=80&&typeof entry.memo==='string'&&entry.memo.length<=500&&['DEG','RAD'].includes(entry.angleMode)&&['basic','office','scientific'].includes(entry.mode||'basic')&&Number.isFinite(Date.parse(entry.createdAt))&&Number.isFinite(Date.parse(entry.updatedAt));
}
function validateSnapshot(value){
 if(value?.version!==1||!Array.isArray(value.items)||value.items.length>MAX_ITEMS||!Array.isArray(value.tombstones)||value.tombstones.length>MAX_TOMBSTONES)fail('invalid-history');
 const ids=new Set();for(const entry of value.items){if(!validEntry(entry)||ids.has(entry.id))fail('invalid-history');ids.add(entry.id);}
 const deleted=new Set();for(const item of value.tombstones){if(!item||!/^[A-Za-z0-9-]{1,90}$/.test(item.id)||!Number.isFinite(Date.parse(item.updatedAt))||deleted.has(item.id))fail('invalid-history');deleted.add(item.id);}
 return value;
}
async function key(env,uid){
 const root=un64(env.CALC_HISTORY_KEY_V1||'');if(root.length!==32)fail('history-key-unavailable',503);
 const material=await crypto.subtle.importKey('raw',root,'HKDF',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode(uid),info:encoder.encode('calc-history-v1')},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encrypt(env,uid,value){const iv=crypto.getRandomValues(new Uint8Array(12));const data=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(uid)},await key(env,uid),encoder.encode(JSON.stringify(value)));return {iv:b64(iv),payload:b64(new Uint8Array(data))};}
async function decrypt(env,uid,row){try{const data=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(row.iv),additionalData:encoder.encode(uid)},await key(env,uid),un64(row.payload));return validateSnapshot(JSON.parse(decoder.decode(data)));}catch(error){if(error?.message==='history-key-unavailable')throw error;fail('history-decryption-failed',500);}}
async function authenticate(request,env,origin){
 // Service bindings route by binding, not by the public workers.dev host.
 // An internal placeholder host avoids Cloudflare treating this as a
 // same-zone public subrequest (1042).
 const response=await env.ACCOUNT.fetch(new Request('https://account.internal/api/apps/calc/session',{headers:{Origin:origin,Authorization:request.headers.get('Authorization')||''}}));
 if(!response.ok)fail('session-invalid',response.status===403?403:401);const value=await response.json();if(typeof value.uid!=='string'||!value.uid)fail('session-invalid',401);return value.uid;
}
async function readBody(request){const raw=await request.text();if(raw.length>MAX_BODY)fail('payload-too-large',413);try{return JSON.parse(raw);}catch{fail('invalid-json');}}
async function history(request,env,uid){
 if(request.method==='GET'){
  const row=await env.DB.prepare('SELECT revision,iv,payload,updated_at FROM calc_history WHERE user_id=?').bind(uid).first();
  if(!row)return json({revision:0,history:{version:1,items:[],tombstones:[]}});
  return json({revision:row.revision,updatedAt:row.updated_at,history:await decrypt(env,uid,row)});
 }
 if(request.method==='POST'){
  const body=await readBody(request);if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision<0)fail('invalid-revision');const snapshot=validateSnapshot(body.history);const sealed=await encrypt(env,uid,snapshot);let result;
  if(body.expectedRevision===0)result=await env.DB.prepare('INSERT INTO calc_history(user_id,revision,iv,payload,updated_at) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING').bind(uid,1,sealed.iv,sealed.payload,Date.now()).run();
  else result=await env.DB.prepare('UPDATE calc_history SET revision=revision+1,iv=?,payload=?,updated_at=? WHERE user_id=? AND revision=?').bind(sealed.iv,sealed.payload,Date.now(),uid,body.expectedRevision).run();
  if(result.meta?.changes!==1)return json({error:'revision-conflict'},409);return json({revision:body.expectedRevision+1});
 }
 if(request.method==='DELETE'){
  await env.DB.prepare('DELETE FROM calc_history WHERE user_id=?').bind(uid).run();return json({deleted:true});
 }
 fail('method-not-allowed',405);
}
export default {async fetch(request,env){
 const url=new URL(request.url),origin=request.headers.get('Origin');
 if(request.method==='OPTIONS')return ALLOWED.has(origin)?cors(request,new Response(null,{status:204})):json({error:'origin-not-allowed'},403);
 let response;try{
  if(url.pathname==='/health'&&request.method==='GET')response=json({ok:true,service:'calc-api',database:!!env.DB,configured:!!env.CALC_HISTORY_KEY_V1});
  else if(url.pathname==='/api/apps/calc/history'){
   if(!ALLOWED.has(origin))fail('origin-not-allowed',403);const uid=await authenticate(request,env,origin);response=await history(request,env,uid);
  }else response=json({error:'not-found'},404);
 }catch(error){const status=error.status||500;response=json({error:status===500?'internal-error':String(error.message||'unavailable')},status);}
 return cors(request,response);
}};
