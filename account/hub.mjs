import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithCustomToken,linkWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';
import {loadPlatformConfig,createSiteClient} from '../shared/platform/v1/sdk.mjs';
import {randomSecret,challengeFor} from '../shared/platform/v1/crypto.mjs';
import {readOAuthReturn} from './oauth-return.mjs';
import {runButtonAction} from './button-feedback.mjs?v=20261028-1';
const $=s=>document.querySelector(s),status=(message,state='info')=>{
  const element=$(connectionView?'#connection-status':'#status');if(element){element.textContent=message;element.dataset.state=state;}
};
let config,auth,registry,currentClient,selectedSite,revision=0,loadedId=null,authBusy=false,handoffSubmitted=false,memberUid=null,membershipPending=null,pendingAuthorize=false;
const query=new URLSearchParams(location.search);
let connectionView=query.has('site'),naverTest=query.get('naver-test')==='1';
function providerRestricted(provider){return config?.providerStatus?.[provider]==='setup-required'||config?.providerStatus?.[provider]==='review-required'&&!naverTest;}
function refreshProviderLabels(){
  const names={google:'Google',kakao:'카카오',naver:'네이버'};
  for(const button of document.querySelectorAll('[data-provider],[data-link]')){
    if(button.getAttribute('aria-busy')==='true')continue;
    const provider=button.dataset.provider||button.dataset.link,link=!!button.dataset.link;
    if(config.providerStatus?.[provider]==='review-required'){
      button.textContent=naverTest?(link?'네이버 테스트 연결':'네이버 테스트 로그인'):(link?'네이버 연결 · 승인 대기':'네이버 로그인 · 승인 대기');
      button.title=naverTest?'등록된 네이버 테스트 계정만 이용할 수 있습니다.':'네이버 서비스 승인 전에는 Google 또는 카카오로 로그인해 주세요.';
    }else if(config.providerStatus?.[provider]==='setup-required'){
      button.textContent=names[provider]+' 로그인 준비 중';button.title='로그인 설정을 점검 중입니다.';
    }else button.textContent=link?names[provider]+' 연결':connectionView?names[provider]+'로 로그인하고 연결':names[provider]+'로 계속하기';
  }
  $('#naver-note').hidden=!['review-required','setup-required'].includes(config.providerStatus?.naver);
  $('#naver-note').textContent=naverTest?'네이버 테스트 로그인은 등록된 테스트 계정으로만 이용할 수 있습니다.':'네이버 로그인은 서비스 승인 대기 중입니다. 지금은 Google 또는 카카오로 연결해 주세요.';
}
function refreshAuthButtons(){
  for(const button of document.querySelectorAll('[data-provider],[data-link]')){
    const provider=button.dataset.provider||button.dataset.link;
    button.disabled=authBusy||handoffSubmitted||!auth||!config?.enabled||!config.providers[provider]||providerRestricted(provider)||!!button.dataset.link&&!auth.currentUser;
  }
  $('#continue').disabled=authBusy||handoffSubmitted||!auth?.currentUser||!targetValid();
  $('#logout').disabled=authBusy||handoffSubmitted||!auth?.currentUser;$('#signup-submit').disabled=authBusy||handoffSubmitted||!auth?.currentUser;
}
function readTarget(){const query=new URLSearchParams(location.search);return {siteId:query.get('site'),origin:query.get('origin'),challenge:query.get('challenge'),requestId:query.get('request')};}
const target=readTarget();
async function post(path,body,withToken=false){const response=await fetch((path.startsWith('/oauth/')?config.socialApiBase:config.apiBase)+path,{method:'POST',headers:{'Content-Type':'application/json',...(withToken?{Authorization:'Bearer '+await auth.currentUser.getIdToken()}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const value=await response.json();if(!response.ok)throw Error(value.code==='recent-login-required'?'다른 SNS를 연결하려면 먼저 상단에서 같은 계정으로 다시 로그인해 주세요.':value.message||'연결하지 못했습니다.');return value;}
function targetValid(){const site=registry?.sites[target.siteId];try{return !!(site&&site.origins.includes(target.origin)&&/^[A-Za-z0-9_-]{43}$/.test(target.challenge||'')&&/^[A-Za-z0-9_-]{43}$/.test(target.requestId||'')&&window.opener&&!window.opener.closed);}catch{return false;}}
function renderConnection(){
  if(config)refreshProviderLabels();
  document.body.classList.toggle('connection-view',connectionView);
  if(!connectionView){$('#grant').hidden=true;$('#login-card').hidden=false;$('#login-title').textContent='공통 계정';return;}
  $('#login-card').before($('#grant'));$('#grant').hidden=false;
  const valid=targetValid(),site=registry.sites[target.siteId],user=auth?.currentUser;
  $('#grant-title').textContent=site?site.name+' 로그인':'사이트 연결';
  $('#grant-description').textContent=valid?site.name+'에 로그인합니다. 자료 동기화는 사이트 정책에 따릅니다.':'연결 요청이 만료됐거나 원래 사이트와 연결이 끊겼습니다. 원래 사이트에서 로그인 버튼을 다시 눌러 주세요.';
  $('#grant-origin').textContent=valid?target.origin:'';
  $('#grant-user').textContent=valid&&user?(user.displayName||'현재 계정')+' 계정으로 연결할 수 있습니다.':valid?'로그인하면 이 사이트 연결까지 이어집니다.':'';
  $('#continue').hidden=!valid||!user;$('#continue').textContent=site?'이 계정으로 '+site.name+' 연결':'이 계정으로 연결';
  $('#login-card').hidden=!valid;$('#login-title').textContent=user?'다른 계정으로 연결':'로그인 방법 선택';
  refreshAuthButtons();
}
async function providerLogin(provider,link=false){
  if(!auth||!config.providers[provider]||providerRestricted(provider))throw Error('이 로그인은 공개 승인 대기 중입니다. Google 또는 카카오로 로그인해 주세요.');
  if(provider==='google'){
    if(link)await linkWithPopup(auth.currentUser,new GoogleAuthProvider());else await signInWithPopup(auth,new GoogleAuthProvider());
    if(!link){if(targetValid())await authorize();else if(await ensureMembership())status('로그인했습니다.','success');}else status('현재 계정에 Google을 연결했습니다.','success');
    return;
  }
  if(link&&!auth.currentUser)throw Error('먼저 로그인해 주세요.');
  const verifier=randomSecret(),challenge=await challengeFor(verifier);
  const result=await post('/oauth/start',{provider,challenge,mode:link?'link':'login'},link);
  sessionStorage.setItem('softm-oauth',JSON.stringify({verifier,state:result.state,targetQuery:location.search,connectSite:!link&&targetValid()}));
  location.assign(result.url);
}
async function completeOAuth(){
  if(!new URLSearchParams(location.hash.slice(1)).has('oauth'))return;
  const fragment=location.hash,saved=sessionStorage.getItem('softm-oauth');authBusy=true;
  history.replaceState(null,'',location.pathname+location.search);sessionStorage.removeItem('softm-oauth');
  try{
    const result=readOAuthReturn(fragment,saved);
    history.replaceState(null,'',location.pathname+result.targetQuery);Object.assign(target,readTarget());
    const restored=new URLSearchParams(location.search);connectionView=restored.has('site');naverTest=restored.get('naver-test')==='1';renderConnection();
    if(result.errorMessage){status(result.errorMessage,'error');return;}
    status('로그인을 마무리하고 있어요.','busy');
    const session=await post('/oauth/exchange',{state:result.state,verifier:result.verifier});
    await signInWithCustomToken(auth,session.token);
    if(JSON.parse(saved).connectSite===true&&targetValid())await authorize();else if(await ensureMembership())status('로그인했습니다.','success');
  }catch(error){status(error.message||'로그인을 완료하지 못했습니다. 다시 시도해 주세요.','error');}
  finally{authBusy=false;refreshAuthButtons();}
}
async function ensureMembership(){
  const user=auth.currentUser;if(!user)return false;
  if(memberUid===user.uid)return true;
  if(!membershipPending)membershipPending=post('/membership/status',{},true).then(result=>{if(auth.currentUser?.uid!==user.uid)return false;if(result.registered){memberUid=user.uid;$('#signup-card').hidden=true;return true;}$('#signup-card').hidden=false;$('#grant').before($('#signup-card'));$('#signup-card').scrollIntoView({block:'start'});$('#signup-terms').checked=false;$('#signup-privacy').checked=false;$('#signup-status').textContent='안내를 확인하고 회원가입을 완료해 주세요.';status('SNS 인증이 완료됐습니다. 회원가입을 완료해 주세요.');return false;}).finally(()=>{membershipPending=null;});
  return membershipPending;
}
async function authorize(){
  if(handoffSubmitted)return;
  if(!targetValid()||!auth.currentUser)throw Error('연결 요청을 다시 시작해 주세요. 원래 사이트에서 로그인 버튼을 누르면 됩니다.');
  if(!await ensureMembership()){pendingAuthorize=true;return;}
  pendingAuthorize=false;const result=await post('/session/authorize',target,true);
  window.opener.postMessage({type:'softm:authorization',requestId:target.requestId,code:result.code},target.origin);
  handoffSubmitted=true;refreshAuthButtons();
  status(registry.sites[target.siteId].name+'에 연결하고 있습니다. 완료되면 이 창이 닫힙니다.','busy');
}
async function showLinkedProviders(user){
  const output=$('#linked-providers');output.textContent='연결된 로그인 수단을 확인하고 있어요.';
  try{const result=await post('/providers',{},true);if(auth.currentUser?.uid!==user.uid)return;const labels={'google.com':'Google',kakao:'카카오',naver:'네이버'};output.textContent='연결됨: '+result.providers.map(p=>labels[p]||p).join(' · ');}catch{output.textContent='로그인 수단 목록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.';}
}
function renderSites(){const root=$('#sites');root.replaceChildren();for(const [siteId,site]of Object.entries(registry.sites)){const card=document.createElement('article');card.className='site';const a=document.createElement('a');a.href=site.url;a.textContent=site.name;const note=document.createElement('small');note.textContent=site.integration==='adapter'?'위로해요 암호화 백업 제공':site.integration==='snapshot-adapter'?'사이트에서 암호화 저장·복원 제공':site.integration==='source-only'?'구현·검사 완료 · 운영 배포 남음':site.integration==='adapter-review'?'사이트 적용 검증 중':site.integration==='migration-required'?'기존 계정 이전 검토 필요':'사이트 연결 준비';const button=document.createElement('button');button.textContent='나의 보관소';button.addEventListener('click',()=>{currentClient=null;selectedSite=siteId;revision=0;loadedId=null;$('#vault').hidden=false;$('#vault-title').textContent=site.name+' 보관소';$('#vault-password').value='';$('#item-body').value='';$('#items').replaceChildren();vaultStatus('이 사이트의 보관소를 연결해 주세요.');$('#vault').scrollIntoView({behavior:'smooth'});});card.append(a,note,button);root.append(card);}}
function guarded(fn,output=status,{label,pending='처리하고 있어요.',authAction=false,success}={}){
  return event=>{
    if(event.currentTarget.disabled||authAction&&authBusy)return;
    const group=authAction?document.querySelectorAll('[data-provider],[data-link],#continue,#logout,#signup-submit'):document.querySelectorAll('#vault button,#sites button');
    if(authAction)authBusy=true;
    return runButtonAction(event.currentTarget,async()=>{await fn();if(success)output(success,'success');},{label,pending,output,group,settled:()=>{if(authAction){authBusy=false;refreshAuthButtons();}}});
  };
}
async function connectVault(){const popup=window.open('about:blank','_blank','popup,width=520,height=760');if(!popup)throw Error('팝업을 허용해 주세요.');try{currentClient ||= await createSiteClient({siteId:selectedSite,config});await currentClient.login({popup});vaultStatus('선택한 사이트의 보관소를 연결했습니다.','success');}catch(error){popup.close();throw error;}}
async function loadItems(){if(!currentClient)throw Error('사이트 보관소를 먼저 연결해 주세요.');const page=await currentClient.list();const root=$('#items');root.replaceChildren();for(const item of page.items.filter(item=>item.id!=='site-state-v1')){const button=document.createElement('button');button.textContent=item.id;button.addEventListener('click',guarded(async()=>{const entry=await currentClient.get(item.id,{password:$('#vault-password').value});$('#item-id').value=entry.id;$('#item-body').value=entry.value.body||'';revision=entry.revision;loadedId=entry.id;},vaultStatus,{label:'불러오는 중…',pending:'메모를 복호화하고 있어요.',success:'메모를 불러왔습니다.'}));root.append(button);}vaultStatus(page.items.length?'최근 '+page.items.length+'개 항목을 불러왔습니다.':'아직 보관된 메모가 없습니다.','success');}
const vaultStatus=(m,state='info')=>{$('#vault-status').textContent=m;$('#vault-status').dataset.state=state;};
async function initialize(){
  registry=await (await fetch('../shared/platform/v1/registry.json',{cache:'no-store'})).json();renderSites();config=await loadPlatformConfig();renderConnection();
  const providerNames={google:'Google',kakao:'카카오',naver:'네이버'};
  for(const button of document.querySelectorAll('[data-provider],[data-link]')){
    const provider=button.dataset.provider||button.dataset.link,link=!!button.dataset.link;
    button.disabled=true;
    if(!config.enabled||!config.providers[provider])button.title='운영 설정 중입니다.';
    button.addEventListener('click',guarded(()=>providerLogin(provider,link),status,{
      label:providerNames[provider]+(link?' 연결 중…':' 로그인 중…'),
      pending:providerNames[provider]+(link?' 계정 연결을 준비하고 있어요.':' 로그인을 준비하고 있어요.'),authAction:true
    }));
  }
  if(!config.enabled){$('#user').textContent='공통 계정 서비스 연결 준비 중';status('공통 모듈과 사이트별 보관소 화면이 준비되었습니다. 인증 서버 활성화 후 로그인할 수 있습니다.');return;}
  auth=getAuth(initializeApp(config.firebase,'softm-account-hub'));await auth.authStateReady();await completeOAuth();
  onAuthStateChanged(auth,user=>{$('#user').textContent=user?(user.displayName||'나의 공통 계정')+' · 로그인됨':'사용할 로그인 방법을 선택해 주세요.';$('#logout').hidden=!user;$('#link-section').hidden=!user||connectionView;renderConnection();refreshAuthButtons();if(user&&!connectionView){showLinkedProviders(user);ensureMembership().catch(error=>status(error.message,'error'));}else $('#linked-providers').textContent='';});
  $('#signup-submit').addEventListener('click',guarded(async()=>{
    if(!$('#signup-terms').checked||!$('#signup-privacy').checked)throw Error('필수 안내 두 항목을 확인해 주세요.');
    await post('/membership/register',{version:'20261029-1',accepted:true},true);memberUid=auth.currentUser.uid;$('#signup-card').hidden=true;
    if(targetValid()&&(pendingAuthorize||connectionView))await authorize();else status('회원가입을 완료했습니다.','success');
  },(message,state)=>{$('#signup-status').textContent=message;$('#signup-status').dataset.state=state;},{label:'가입 중…',pending:'회원가입을 완료하고 있어요.',authAction:true}));
  $('#logout').addEventListener('click',guarded(async()=>{await signOut(auth);memberUid=null;$('#signup-card').hidden=true;status('공통 계정에서 로그아웃했습니다. 다른 사이트에서 열린 세션은 해당 사이트에서 로그아웃해 주세요.','success');},status,{label:'로그아웃 중…',pending:'공통 계정에서 로그아웃하고 있어요.',authAction:true}));
  $('#continue').addEventListener('click',guarded(authorize,status,{label:'사이트 연결 중…',pending:'선택한 사이트에 계정을 연결하고 있어요.',authAction:true}));$('#cancel').addEventListener('click',()=>{if(targetValid())window.opener.postMessage({type:'softm:authorization',requestId:target.requestId,error:'cancelled'},target.origin);window.close();});
}
$('#vault-connect').addEventListener('click',guarded(connectVault,vaultStatus,{label:'연결 중…',pending:'보관소 로그인 창을 연결하고 있어요.'}));$('#vault-load').addEventListener('click',guarded(loadItems,vaultStatus,{label:'불러오는 중…',pending:'보관된 메모 목록을 불러오고 있어요.'}));
$('#item-save').addEventListener('click',guarded(async()=>{if(!currentClient)throw Error('사이트 보관소를 먼저 연결해 주세요.');const itemId=$('#item-id').value.trim();if(itemId==='site-state-v1')throw Error('사이트 자동 저장 항목은 해당 사이트의 내 보관소에서 관리해 주세요.');revision=await currentClient.put(itemId,{body:$('#item-body').value},{password:$('#vault-password').value,expectedRevision:loadedId===itemId?revision:0});loadedId=itemId;vaultStatus('암호화해 저장했습니다.','success');},vaultStatus,{label:'암호화 저장 중…',pending:'메모를 암호화해 저장하고 있어요.'}));
initialize().catch(error=>{status(error.message,'error');$('#user').textContent='연결을 확인해 주세요.';});



