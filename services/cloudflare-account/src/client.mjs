// Opt-in pilot SDK. DOES NOT replace the existing Firebase SDK or Android bridge.
import {seal,unseal} from '../../../shared/platform/v1/crypto.mjs';
const PROOF=/^[A-Za-z0-9_-]{43}$/;
function random(){const b=new Uint8Array(32);crypto.getRandomValues(b);return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function digest(v){const b=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)));return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
export function createCloudflareAccountClient({baseUrl,siteId}){
  if(typeof baseUrl!=='string'||!/^https:\/\//.test(baseUrl)||typeof siteId!=='string'||!/^[a-z0-9_-]+$/.test(siteId))throw Error('잘못된 계정 설정입니다.');
  const base=new URL(baseUrl);if(base.pathname!=='/'||base.search||base.hash)throw Error('Worker 원본 URL만 사용해 주세요.');
  // Session-scoped, 1h maximum; never persist tokens to permanent localStorage.
  const sessionKey='softm-cloudflare:'+siteId+':'+base.hostname;
  let auth=null;
  try{
    const saved=JSON.parse(sessionStorage.getItem(sessionKey)||'null');
    if(saved&&typeof saved.uid==='string'&&typeof saved.token==='string'&&PROOF.test(saved.token)&&saved.expiresAt>Date.now())auth=saved;
    else sessionStorage.removeItem(sessionKey);
  }catch{try{sessionStorage.removeItem(sessionKey);}catch{}}
  async function api(path,method,body){
    if(!auth)throw Error('로그인해 주세요.');
    const response=await fetch(base.origin+path,{method,headers:{Authorization:'Bearer '+auth.token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    const data=await response.json();
    if(!response.ok){const e=Error(data.message||data.error||'계정 서버에 연결하지 못했습니다.');e.code=data.error;e.status=response.status;throw e;}
    return data;
  }
  async function login(){
    // Must open synchronously in the button's click event to avoid popup blockers.
    const popup=window.open('about:blank','_blank','popup,width=480,height=780');
    if(!popup)throw Error('로그인 팝업을 허용해 주세요.');
    try{
      const verifier=random(),challenge=await digest(verifier),request=random();
      if(!PROOF.test(verifier)||!PROOF.test(challenge)||!PROOF.test(request))throw Error('보안 난수 생성 오류');
      const url=new URL('/connect',base);
      url.searchParams.set('site',siteId);
      url.searchParams.set('origin',location.origin);
      url.searchParams.set('challenge',challenge);
      url.searchParams.set('request',request);
      return await new Promise((resolve,reject)=>{
        let timer,watch,settled=false;
        const clean=()=>{window.removeEventListener('message',receive);clearTimeout(timer);clearInterval(watch);};
        const stop=err=>{if(settled)return;settled=true;clean();popup.close();reject(err);};
        const receive=async event=>{
          if(event.source!==popup||event.origin!==base.origin||event.data?.type!=='softm:authorization'||event.data?.requestId!==request)return;
          clean();
          try{
            const response=await fetch(base.origin+'/api/connect/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({site:siteId,origin:location.origin,code:event.data.code,verifier})});
            const value=await response.json();if(!response.ok)throw Error(value.message||'앱 로그인을 완료하지 못했습니다.');
            auth={token:value.accessToken,uid:value.uid,expiresAt:Date.now()+value.expiresIn*1000};
            try{sessionStorage.setItem(sessionKey,JSON.stringify(auth));}catch{}
            settled=true;popup.close();resolve({uid:auth.uid});
          }catch(e){stop(e);}
        };
        window.addEventListener('message',receive);
        timer=setTimeout(()=>stop(Error('로그인 시간이 만료됐습니다.')),300000);
        watch=setInterval(()=>{if(popup.closed)stop(Error('로그인 창이 닫혔습니다.'));},700);
        popup.location.assign(url.href);
      });
    }catch(e){popup.close();throw e;}
  }
  function uid(){if(!auth||auth.expiresAt<=Date.now())throw Error('로그인을 다시 해 주세요.');return auth.uid;}
  async function get(itemId,{password}={}){
    const id=encodeURIComponent(itemId),u=uid();
    let result;
    try{result=await api('/api/apps/'+siteId+'/items/'+id,'GET');}
    catch(e){if(e.code==='item-not-found')return null;throw e;}
    return {id:itemId,revision:result.revision,value:await unseal(JSON.parse(result.payload),password,u+'/'+siteId+'/'+itemId)};
  }
  async function put(itemId,value,{password,expectedRevision=0}={}){
    const u=uid(),payload=JSON.stringify(await seal(value,password,u+'/'+siteId+'/'+itemId));
    return (await api('/api/apps/'+siteId+'/items/'+encodeURIComponent(itemId),'PUT',{payload,expectedRevision})).revision;
  }
  async function list({pageSize=30,cursor=null}={}){
    uid();
    if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100)throw Error('잘못된 목록 크기입니다.');
    const params=new URLSearchParams({limit:String(pageSize)});
    if(cursor)params.set('cursor',cursor);
    return api('/api/apps/'+siteId+'/items?'+params,'GET');
  }
  async function remove(itemId,{expectedRevision}={}){
    uid();return api('/api/apps/'+siteId+'/items/'+encodeURIComponent(itemId),'DELETE',{expectedRevision});
  }
  async function exchangeLedger(payload){
    if(siteId!=='gagyebu')throw Error('가계부 전용 API입니다.');
    if(!payload||payload.uid!==uid())throw Error('계정이 변경됐습니다. 다시 로그인해 주세요.');
    return api('/api/apps/gagyebu/ledger','POST',payload);
  }
  async function logout(){
    try{if(auth&&auth.expiresAt>Date.now())await api('/api/apps/'+siteId+'/logout','POST',{});}
    finally{auth=null;try{sessionStorage.removeItem(sessionKey);}catch{}}
  }
  return {login,get,put,list,remove,logout,exchangeLedger,get currentUser(){return auth&&auth.expiresAt>Date.now()?{uid:auth.uid}:null;}};
}
