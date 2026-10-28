import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithCustomToken,linkWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {loadPlatformConfig,createSiteClient} from '../shared/platform/v1/sdk.mjs';
import {randomSecret,challengeFor} from '../shared/platform/v1/crypto.mjs';
import {readOAuthReturn} from './oauth-return.mjs';
const $=s=>document.querySelector(s),status=message=>{$('#status').textContent=message;};
let config,auth,registry,currentClient,selectedSite,revision=0,loadedId=null;
function readTarget(){const query=new URLSearchParams(location.search);return {siteId:query.get('site'),origin:query.get('origin'),challenge:query.get('challenge'),requestId:query.get('request')};}
const target=readTarget();
async function post(path,body,withToken=false){const response=await fetch((path.startsWith('/oauth/')?config.socialApiBase:config.apiBase)+path,{method:'POST',headers:{'Content-Type':'application/json',...(withToken?{Authorization:'Bearer '+await auth.currentUser.getIdToken()}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const value=await response.json();if(!response.ok)throw Error(value.code==='recent-login-required'?'다른 SNS를 연결하려면 먼저 상단에서 같은 계정으로 다시 로그인해 주세요.':value.message||'연결하지 못했습니다.');return value;}
function targetValid(){const site=registry.sites[target.siteId];return site&&site.origins.includes(target.origin)&&/^[A-Za-z0-9_-]{43}$/.test(target.challenge||'')&&/^[A-Za-z0-9_-]{43}$/.test(target.requestId||'')&&window.opener;}
async function providerLogin(provider,link=false){
  if(!auth||!config.providers[provider])throw Error('이 로그인은 운영 설정 중입니다.');
  if(provider==='google'){if(link)await linkWithPopup(auth.currentUser,new GoogleAuthProvider());else await signInWithPopup(auth,new GoogleAuthProvider());status(link?'현재 계정에 Google을 연결했습니다.':'로그인했습니다.');return;}
  if(link&&!auth.currentUser)throw Error('먼저 로그인해 주세요.');
  const verifier=randomSecret(),challenge=await challengeFor(verifier);
  const result=await post('/oauth/start',{provider,challenge,mode:link?'link':'login'},link);
  sessionStorage.setItem('softm-oauth',JSON.stringify({verifier,state:result.state,targetQuery:location.search}));
  location.assign(result.url);
}
async function completeOAuth(){
  if(!new URLSearchParams(location.hash.slice(1)).has('oauth'))return;
  const fragment=location.hash,saved=sessionStorage.getItem('softm-oauth');
  history.replaceState(null,'',location.pathname+location.search);sessionStorage.removeItem('softm-oauth');
  try{
    const result=readOAuthReturn(fragment,saved);
    history.replaceState(null,'',location.pathname+result.targetQuery);Object.assign(target,readTarget());
    if(result.errorMessage){status(result.errorMessage);return;}
    const session=await post('/oauth/exchange',{state:result.state,verifier:result.verifier});
    await signInWithCustomToken(auth,session.token);status('로그인했습니다.');
  }catch(error){status(error.message||'로그인을 완료하지 못했습니다. 다시 시도해 주세요.');}
}
async function authorize(){if(!targetValid()||!auth.currentUser)throw Error('유효한 사이트 연결 요청이 필요합니다.');const result=await post('/session/authorize',target,true);window.opener.postMessage({type:'softm:authorization',requestId:target.requestId,code:result.code},target.origin);status('사이트에 연결했습니다. 이 창을 닫아도 됩니다.');}
async function showLinkedProviders(user){
  const output=$('#linked-providers');output.textContent='연결된 로그인 수단을 확인하고 있어요.';
  try{const result=await post('/providers',{},true);if(auth.currentUser?.uid!==user.uid)return;const labels={'google.com':'Google',kakao:'카카오',naver:'네이버'};output.textContent='연결됨: '+result.providers.map(p=>labels[p]||p).join(' · ');}catch{output.textContent='로그인 수단 목록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.';}
}
function renderSites(){const root=$('#sites');root.replaceChildren();for(const [siteId,site]of Object.entries(registry.sites)){const card=document.createElement('article');card.className='site';const a=document.createElement('a');a.href=site.url;a.textContent=site.name;const note=document.createElement('small');note.textContent=site.integration==='adapter'?'위로해요 암호화 백업 제공':site.integration==='snapshot-adapter'?'사이트에서 암호화 저장·복원 제공':site.integration==='source-only'?'구현·검사 완료 · 운영 배포 남음':site.integration==='adapter-review'?'사이트 적용 검증 중':site.integration==='migration-required'?'기존 계정 이전 검토 필요':'사이트 연결 준비';const button=document.createElement('button');button.textContent='나의 보관소';button.addEventListener('click',()=>{currentClient=null;selectedSite=siteId;revision=0;loadedId=null;$('#vault').hidden=false;$('#vault-title').textContent=site.name+' 보관소';$('#vault-password').value='';$('#item-body').value='';$('#items').replaceChildren();$('#vault-status').textContent='이 사이트의 보관소를 연결해 주세요.';$('#vault').scrollIntoView({behavior:'smooth'});});card.append(a,note,button);root.append(card);}}
function guarded(fn,output=status){return async()=>{try{await fn();}catch(error){output(error.message||'처리하지 못했습니다.');}};}
async function connectVault(){const popup=window.open('about:blank','_blank','popup,width=520,height=760');if(!popup)throw Error('팝업을 허용해 주세요.');try{currentClient ||= await createSiteClient({siteId:selectedSite,config});await currentClient.login({popup});$('#vault-status').textContent='선택한 사이트의 보관소를 연결했습니다.';}catch(error){popup.close();throw error;}}
async function loadItems(){if(!currentClient)throw Error('사이트 보관소를 먼저 연결해 주세요.');const page=await currentClient.list();const root=$('#items');root.replaceChildren();for(const item of page.items.filter(item=>item.id!=='site-state-v1')){const button=document.createElement('button');button.textContent=item.id;button.addEventListener('click',guarded(async()=>{const entry=await currentClient.get(item.id,{password:$('#vault-password').value});$('#item-id').value=entry.id;$('#item-body').value=entry.value.body||'';revision=entry.revision;loadedId=entry.id;},vaultStatus));root.append(button);}vaultStatus(page.items.length?'최근 '+page.items.length+'개 항목을 불러왔습니다.':'아직 보관된 메모가 없습니다.');}
const vaultStatus=m=>{$('#vault-status').textContent=m;};
async function initialize(){
  registry=await (await fetch('../shared/platform/v1/registry.json')).json();renderSites();config=await loadPlatformConfig();
  for(const button of document.querySelectorAll('[data-provider],[data-link]')){const provider=button.dataset.provider||button.dataset.link;button.disabled=!config.enabled||!config.providers[provider];if(button.disabled)button.title='운영 설정 중입니다.';if(config.providerStatus?.[provider]==='review-required'){button.textContent+=' (개발회원)';button.title='네이버 검수 전에는 등록된 개발회원만 로그인할 수 있습니다.';}if(config.providerStatus?.[provider]==='setup-required'){button.textContent+=' (연결 점검 중)';button.title='네이버 인증 설정 점검과 공개 검수가 남아 있습니다.';}button.addEventListener('click',guarded(()=>providerLogin(provider,!!button.dataset.link)));}
  if(!config.enabled){$('#user').textContent='공통 계정 서비스 연결 준비 중';status('공통 모듈과 사이트별 보관소 화면이 준비되었습니다. 인증 서버 활성화 후 로그인할 수 있습니다.');return;}
  auth=getAuth(initializeApp(config.firebase,'softm-account-hub'));await auth.authStateReady();await completeOAuth();
  onAuthStateChanged(auth,user=>{$('#user').textContent=user?(user.displayName||'나의 공통 계정')+' · 로그인됨':'사용할 로그인 방법을 선택해 주세요.';$('#logout').hidden=!user;$('#link-section').hidden=!user;$('#grant').hidden=!targetValid();$('#continue').disabled=!user;if(user)showLinkedProviders(user);else $('#linked-providers').textContent='';if(targetValid()){$('#grant-title').textContent=registry.sites[target.siteId].name+' 연결';$('#grant-description').textContent=target.origin+'에서 계정 연결을 요청했습니다.';}});
  $('#logout').addEventListener('click',guarded(async()=>{await signOut(auth);status('공통 계정에서 로그아웃했습니다. 다른 사이트에서 열린 세션은 해당 사이트에서 로그아웃해 주세요.');}));
  $('#continue').addEventListener('click',guarded(authorize));$('#cancel').addEventListener('click',()=>{if(targetValid())window.opener.postMessage({type:'softm:authorization',requestId:target.requestId,error:'cancelled'},target.origin);window.close();});
}
$('#vault-connect').addEventListener('click',guarded(connectVault,vaultStatus));$('#vault-load').addEventListener('click',guarded(loadItems,vaultStatus));
$('#item-save').addEventListener('click',guarded(async()=>{if(!currentClient)throw Error('사이트 보관소를 먼저 연결해 주세요.');const itemId=$('#item-id').value.trim();if(itemId==='site-state-v1')throw Error('사이트 자동 저장 항목은 해당 사이트의 내 보관소에서 관리해 주세요.');revision=await currentClient.put(itemId,{body:$('#item-body').value},{password:$('#vault-password').value,expectedRevision:loadedId===itemId?revision:0});loadedId=itemId;vaultStatus('암호화해 저장했습니다.');},vaultStatus));
initialize().catch(error=>{status(error.message);$('#user').textContent='연결을 확인해 주세요.';});
