import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth, setPersistence, browserLocalPersistence, signInWithCustomToken, signOut, onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {getFirestore, doc, collection, getDoc, getDocFromServer, getDocs, query, limit, orderBy, startAfter, runTransaction, writeBatch, serverTimestamp, deleteDoc} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';
import {randomSecret,challengeFor,sha256,seal,unseal} from './crypto.mjs';
const VALID_ID=/^[a-zA-Z0-9_-]{1,80}$/;
function id(value){if(!VALID_ID.test(value))throw Error('잘못된 보관소 항목 ID입니다.');return value;}
export async function loadPlatformConfig() {
  const response=await fetch(new URL('./config.json',import.meta.url),{cache:'no-store'});
  if(!response.ok)throw Error('공통 계정 설정을 불러오지 못했습니다.');
  return response.json();
}
async function api(config,path,body,token) {
  const res=await fetch(config.apiBase+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const result=await res.json();if(!res.ok)throw Error(result.message||'계정 연결을 완료하지 못했습니다.');return result;
}
export async function createSiteClient({siteId,config}) {
  id(siteId); config ||= await loadPlatformConfig();
  if(!config.enabled || !config.firebase?.apiKey || !config.firebase?.appId)throw Error('공통 계정 서비스 연결 준비 중입니다. 기기 내 기능은 계속 사용할 수 있습니다.');
  // Separate Auth persistence per site, including same-origin GitHub Pages paths.
  const app=initializeApp(config.firebase,'softm-site-'+siteId),auth=getAuth(app),db=getFirestore(app,config.databaseId);
  await setPersistence(auth,browserLocalPersistence); await auth.authStateReady();
  async function user(){await auth.authStateReady();if(!auth.currentUser)throw Error('먼저 공통 계정에 로그인해 주세요.');const claims=(await auth.currentUser.getIdTokenResult()).claims;if(claims.suite_site!==siteId)throw Error('사이트 인증 범위가 다릅니다. 다시 로그인해 주세요.');return auth.currentUser;}
  async function root(){const u=await user();return {uid:u.uid,path:['users',u.uid,'sites',siteId]};}
  async function ensureSite(){const {uid,path}=await root();await runTransaction(db,async tx=>{const ref=doc(db,...path),snap=await tx.get(ref);if(!snap.exists())tx.set(ref,{uid,siteId,version:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});});}
  async function login({popup:providedPopup,mode='login'}={}) {
    // Open synchronously, before crypto/network awaits, to preserve browser user gesture.
    const popup=providedPopup||window.open('about:blank','_blank','popup,width=520,height=760');
    if(!popup)throw Error('로그인 창을 열 수 없습니다. 팝업 허용 후 다시 눌러 주세요.');
    const verifier=randomSecret(),challenge=await challengeFor(verifier),requestId=randomSecret();
    const url=new URL(config.hubUrl);url.searchParams.set('mode',mode==='signup'?'signup':'login');url.searchParams.set('site',siteId);url.searchParams.set('origin',location.origin);url.searchParams.set('challenge',challenge);url.searchParams.set('request',requestId);
    return new Promise((resolve,reject)=>{
      let timer,closed; const cleanup=()=>{window.removeEventListener('message',receive);clearTimeout(timer);clearInterval(closed);popup.close();};
      const receive=async event=>{
        if(event.origin!==url.origin||event.source!==popup||event.data?.type!=='softm:authorization'||event.data.requestId!==requestId)return;
        if(event.data.error){cleanup();reject(Error('로그인을 취소했습니다.'));return;}
        window.removeEventListener('message',receive);clearInterval(closed);
        try{const result=await api(config,'/session/exchange',{code:event.data.code,verifier,siteId,origin:location.origin});await signInWithCustomToken(auth,result.token);await ensureSite();cleanup();resolve(auth.currentUser);}catch(error){cleanup();reject(error);}
      };
      window.addEventListener('message',receive);timer=setTimeout(()=>{cleanup();reject(Error('로그인 시간이 만료되었습니다.'));},300000);
      closed=setInterval(()=>{if(popup.closed){cleanup();reject(Error('로그인 창이 닫혔습니다.'));}},700);popup.location.href=url.href;
    });
  }
  async function put(itemId,value,{password,expectedRevision=0}={}) {
    const {uid,path}=await root();id(itemId);const payload=JSON.stringify(await seal(value,password,uid+'/'+siteId+'/'+itemId));
    if(payload.length>180000)throw Error('큰 자료는 백업 기능을 사용해 주세요.');await ensureSite();
    return runTransaction(db,async tx=>{const ref=doc(db,...path,'items',itemId),old=await tx.get(ref),revision=old.exists()?old.data().revision:0;
      if(revision!==expectedRevision)throw Error('다른 기기에서 변경한 자료입니다. 다시 불러온 후 저장해 주세요.');
      tx.set(ref,{uid,siteId,version:1,encoding:'encrypted',payload,revision:revision+1,createdAt:old.exists()?old.data().createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return revision+1;});
  }
  async function get(itemId,{password}={}){const {uid,path}=await root();id(itemId);const snap=await getDocFromServer(doc(db,...path,'items',itemId));if(!snap.exists())return null;const d=snap.data();return {id:snap.id,revision:d.revision,value:await unseal(JSON.parse(d.payload),password,uid+'/'+siteId+'/'+itemId)};}
  async function list({pageSize=30,cursor}={}){const {path}=await root();const clauses=[orderBy('updatedAt','desc'),limit(Math.max(1,Math.min(100,pageSize)))];if(cursor)clauses.push(startAfter(cursor));const snap=await getDocs(query(collection(db,...path,'items'),...clauses));return {items:snap.docs.map(d=>({id:d.id,revision:d.data().revision,updatedAt:d.data().updatedAt})),cursor:snap.docs.at(-1)};}
  async function remove(itemId,{expectedRevision}={}){const {path}=await root();const ref=doc(db,...path,'items',id(itemId));await runTransaction(db,async tx=>{const snap=await tx.get(ref);if(expectedRevision!==undefined&&(snap.exists()?snap.data().revision:0)!==expectedRevision)throw Error('다른 기기에서 변경한 자료입니다. 다시 확인해 주세요.');if(snap.exists())tx.delete(ref);});}
  async function uploadEncryptedBackup(encryptedJson,{format='encrypted-json'}={}){
    // Caller must supply an already encrypted export. Plain record objects are never accepted.
    if(typeof encryptedJson!=='string'||encryptedJson.length<2||new TextEncoder().encode(encryptedJson).length>80*1024*1024)throw Error('암호화 백업은 80MB 이하여야 합니다.');
    const b=JSON.parse(encryptedJson);
    if(format==='wirohaeyo-encrypted-backup'){
      if(b.format!==format||b.version!==1||!b.meta?.verifier?.ct||!Array.isArray(b.records)||!b.records.every(r=>r.blob?.ct&&r.blob?.iv&&!('body'in r)))throw Error('암호화된 위로해요 백업만 올릴 수 있습니다.');
    }else if(b?.v!==1||b.algorithm!=='AES-GCM'||typeof b.ct!=='string')throw Error('먼저 공통 암호화 모듈로 백업을 암호화해 주세요.');
    const {uid,path}=await root();await ensureSite();const backupId=crypto.randomUUID(),checksum=await sha256(encryptedJson),parts=[];
    // Strings split at UTF-16 boundaries are rejoined unchanged before parsing.
    for(let i=0;i<encryptedJson.length;i+=160000)parts.push(encryptedJson.slice(i,i+160000));
    if(parts.length>600)throw Error('백업 조각 수가 제한을 초과합니다.');
    const ref=doc(db,...path,'backups',backupId),meta={uid,siteId,version:1,format,checksum,totalChars:encryptedJson.length,chunkCount:parts.length,state:'uploading',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
    const begin=writeBatch(db);begin.set(ref,meta);await begin.commit();
    for(let first=0;first<parts.length;first+=100){await user();const batch=writeBatch(db);parts.slice(first,first+100).forEach((payload,i)=>batch.set(doc(ref,'chunks',String(first+i)),{uid,siteId,index:first+i,payload}));await batch.commit();}
    await user();const commit=writeBatch(db);commit.update(ref,{state:'complete',updatedAt:serverTimestamp()});await commit.commit();return {id:backupId,checksum,chunkCount:parts.length};
  }
  async function listBackups(){const {path}=await root();const snap=await getDocs(query(collection(db,...path,'backups'),orderBy('createdAt','desc'),limit(20)));return snap.docs.map(d=>({id:d.id,...d.data()}));}
  async function downloadBackup(backupId){const {path}=await root();const ref=doc(db,...path,'backups',id(backupId));const snap=await getDocFromServer(ref);if(!snap.exists()||snap.data().state!=='complete')throw Error('완료된 백업을 찾지 못했습니다.');const meta=snap.data();let text='';for(let i=0;i<meta.chunkCount;i++){const p=await getDocFromServer(doc(ref,'chunks',String(i)));if(!p.exists())throw Error('백업 일부가 누락되었습니다.');text+=p.data().payload;}if(text.length!==meta.totalChars||await sha256(text)!==meta.checksum)throw Error('백업 무결성 검증에 실패했습니다.');return text;}
  async function deleteBackup(backupId){const {path}=await root();const ref=doc(db,...path,'backups',id(backupId));const snap=await getDocFromServer(ref);if(!snap.exists())return;for(let first=0;first<snap.data().chunkCount;first+=100){const batch=writeBatch(db);for(let i=first;i<Math.min(first+100,snap.data().chunkCount);i++)batch.delete(doc(ref,'chunks',String(i)));await batch.commit();}await deleteDoc(ref);}
  return Object.freeze({siteId,login,logout:()=>signOut(auth),get currentUser(){return auth.currentUser;},onUser:fn=>onAuthStateChanged(auth,fn),put,get,list,remove,uploadEncryptedBackup,listBackups,downloadBackup,deleteBackup});
}

