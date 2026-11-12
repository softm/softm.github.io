// Gagyebu PC/Android ledger protocol (v1): encrypted server-side, no receipts/SMS.
const MAX_BYTES=3*1024*1024,CHUNK=120000;
const encoder=new TextEncoder(),decoder=new TextDecoder();
function fail(message,status=400){const err=Error(message);err.status=status;throw err;}
function b64(bytes){let s='';for(let i=0;i<bytes.length;i+=16000)s+=String.fromCharCode(...bytes.subarray(i,i+16000));return btoa(s);}
function bytes(text){return Uint8Array.from(atob(text),c=>c.charCodeAt(0));}
async function cipher(env,uid,usage){
 const secret=env.GAGYEBU_LEDGER_KEY_V1;
 if(!secret)fail('ledger-key-not-configured',503);
 let master;try{master=bytes(secret);}catch{fail('ledger-key-invalid',503);}
 if(master.length!==32)fail('ledger-key-invalid',503);
 const base=await crypto.subtle.importKey('raw',master,'HKDF',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:encoder.encode(uid),info:encoder.encode('gagyebu-ledger-v1')},base,{name:'AES-GCM',length:256},false,usage);
}
function validateEntryIds(rows){
 if(!Array.isArray(rows)||rows.length>100000)return false;
 const seen=new Set();
 for(const row of rows){
  if(!row||typeof row.id!=='string'||row.id.length>180||seen.has(row.id))return false;
  seen.add(row.id);
 }
 return true;
}
export function validateLedger(v){
 if(!v||v.version!==1||!v.settings||typeof v.settings!=='object'||Array.isArray(v.settings)||!v.budgets||typeof v.budgets!=='object'||Array.isArray(v.budgets))fail('invalid-ledger');
 for(const k of ['accounts','categories','transactions','events'])if(!validateEntryIds(v[k]))fail('invalid-ledger');
 for(const item of v.transactions){
  if((item.status==='pending'&&String(item.source||'').startsWith('android-'))||
    ['sourceText','sourceImportKey','attachment','attachmentPath','attachmentUploadId'].some(k=>Object.hasOwn(item,k)))fail('device-private-data');
 }
 return v;
}
async function purgeUncommitted(db,uid,revision){
 await db.prepare('DELETE FROM gagyebu_ledger_chunks WHERE user_id=? AND revision=?').bind(uid,revision).run();
 await db.prepare('DELETE FROM gagyebu_ledger_versions WHERE user_id=? AND revision=?').bind(uid,revision).run();
}
export async function ledgerExchange(env,uid,body){
 if(body.uid!==uid)fail('wrong-user',403);
 if(body.op!=='read'&&body.op!=='write')fail('invalid-operation');
 if(!env.GAGYEBU_LEDGER_KEY_V1)fail('ledger-key-not-configured',503);
 const db=env.DB;
 const head=await db.prepare('SELECT revision,iv,chunk_count FROM gagyebu_ledger_heads WHERE user_id=?').bind(uid).first();
 const revision=head?.revision||null;
 if(body.op==='read'){
  if(!head||body.known===revision)return {revision,epoch:null};
  const all=await db.prepare('SELECT part,data FROM gagyebu_ledger_chunks WHERE user_id=? AND revision=? ORDER BY part').bind(uid,revision).all();
  const parts=all.results||[];
  if(parts.length!==head.chunk_count||parts.some((p,i)=>p.part!==i))fail('ledger-incomplete',503);
  const combined=parts.map(p=>p.data).join('');
  let plain;try{
    const key=await cipher(env,uid,['decrypt']);
    plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(head.iv),additionalData:encoder.encode(uid)},key,bytes(combined));
  }catch{fail('ledger-decryption-failed',503);}
  let ledger;try{ledger=JSON.parse(decoder.decode(plain));validateLedger(ledger);}catch{fail('invalid-stored-ledger',503);}
  return {revision,epoch:null,ledger};
 }
 if(typeof body.expected!=='string'&&body.expected!==null)fail('invalid-revision');
 if(body.expected!==revision||body.epoch!=null)return {conflict:true,revision};
 const ledger=validateLedger(body.ledger);
 const plain=encoder.encode(JSON.stringify(ledger));
 if(plain.byteLength>MAX_BYTES)fail('ledger-too-large',413);
 const key=await cipher(env,uid,['encrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(uid)},key,plain));
 const encoded=b64(encrypted);
 const parts=[];
 for(let offset=0;offset<encoded.length;offset+=CHUNK)parts.push(encoded.slice(offset,offset+CHUNK));
 const next=crypto.randomUUID();
 try{
  await db.prepare('INSERT INTO gagyebu_ledger_versions(user_id,revision,created_at) VALUES(?,?,?)')
    .bind(uid,next,Math.floor(Date.now()/1000)).run();
  for(let i=0;i<parts.length;i+=20){
   await db.batch(parts.slice(i,i+20).map((data,j)=>db.prepare(
     'INSERT INTO gagyebu_ledger_chunks(user_id,revision,part,data) VALUES(?,?,?,?)')
     .bind(uid,next,i+j,data)));
  }
  let result;
  if(!head){
   result=await db.prepare('INSERT INTO gagyebu_ledger_heads(user_id,revision,iv,chunk_count,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO NOTHING')
     .bind(uid,next,b64(iv),parts.length,Math.floor(Date.now()/1000)).run();
  }else{
   result=await db.prepare('UPDATE gagyebu_ledger_heads SET revision=?,iv=?,chunk_count=?,updated_at=? WHERE user_id=? AND revision=?')
     .bind(next,b64(iv),parts.length,Math.floor(Date.now()/1000),uid,revision).run();
  }
  if(result.meta?.changes!==1){await purgeUncommitted(db,uid,next);return {conflict:true,revision};}
  return {revision:next,epoch:null};
 }catch(err){
  await purgeUncommitted(db,uid,next).catch(()=>{});
  throw err;
 }
}

export async function cleanupOldLedgerVersions(db,cutoff){
 // Keep the current head and at least 2 hours of previous immutable revisions
 // so a concurrent reader cannot lose its snapshot during a head change.
 await db.prepare(`DELETE FROM gagyebu_ledger_chunks
  WHERE EXISTS(
   SELECT 1 FROM gagyebu_ledger_versions v
   WHERE v.user_id=gagyebu_ledger_chunks.user_id
    AND v.revision=gagyebu_ledger_chunks.revision
    AND v.created_at<?
    AND NOT EXISTS (SELECT 1 FROM gagyebu_ledger_heads h
      WHERE h.user_id=v.user_id AND h.revision=v.revision)
  )`).bind(cutoff).run();
 await db.prepare(`DELETE FROM gagyebu_ledger_versions
  WHERE created_at<?
   AND NOT EXISTS(SELECT 1 FROM gagyebu_ledger_heads h
     WHERE h.user_id=gagyebu_ledger_versions.user_id
       AND h.revision=gagyebu_ledger_versions.revision)`).bind(cutoff).run();
}
