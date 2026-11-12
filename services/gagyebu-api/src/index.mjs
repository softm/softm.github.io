import {ledgerExchange} from '../../cloudflare-account/src/gagyebu-ledger.mjs';
const ALLOWED=new Set(['https://softm.github.io','https://appassets.androidplatform.net']);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
function cors(request,response){
 const origin=request.headers.get('Origin');
 if(!origin||!ALLOWED.has(origin))return response;
 const headers=new Headers(response.headers);
 headers.set('Access-Control-Allow-Origin',origin);
 headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');
 headers.set('Access-Control-Allow-Headers','Authorization,Content-Type');
 headers.set('Vary','Origin');
 return new Response(response.body,{status:response.status,headers});
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  if(request.method==='OPTIONS')return ALLOWED.has(origin)?cors(request,new Response(null,{status:204})):json({error:'origin-not-allowed'},403);
  let response;
  try{
   if(url.pathname==='/health'&&request.method==='GET')response=json({ok:true,service:'gagyebu-api',configured:!!env.GAGYEBU_LEDGER_KEY_V1});
   else if(url.pathname==='/api/apps/gagyebu/ledger'&&request.method==='POST'){
    if(!ALLOWED.has(origin))throw Object.assign(Error('origin-not-allowed'),{status:403});
    if(!env.GAGYEBU_LEDGER_KEY_V1)throw Object.assign(Error('ledger-key-not-configured'),{status:503});
    const auth=await env.ACCOUNT.fetch(new Request('https://softm-hannun-account.softm.workers.dev/api/apps/gagyebu/session',{headers:{Origin:origin,Authorization:request.headers.get('Authorization')||''}}));
    if(!auth.ok)throw Object.assign(Error('session-invalid'),{status:auth.status===403?403:401});
    const {uid}=await auth.json();
    if(typeof uid!=='string'||!uid)throw Object.assign(Error('session-invalid'),{status:401});
    const raw=await request.text();
    if(raw.length>3400000)throw Object.assign(Error('payload-too-large'),{status:413});
    let body;try{body=JSON.parse(raw);}catch{throw Object.assign(Error('invalid-json'),{status:400});}
    response=json(await ledgerExchange(env,uid,body));
   }else response=json({error:'not-found'},404);
  }catch(e){const status=e.status||500;response=json({error:status===500?'internal-error':String(e.message||'unavailable')},status);}
  return cors(request,response);
 }
};
