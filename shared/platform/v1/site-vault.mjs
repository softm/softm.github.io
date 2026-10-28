import {createLocalStateAdapter} from './local-state.mjs';
import {createVaultSession} from './vault-session.mjs';

export function mountSiteVault({siteId,name,keys=[],label='개인 메모',target='header',adapter:appAdapter,sdkLoader=()=>import('./sdk.mjs'),cryptoLoader=()=>import('./crypto.mjs')}={}) {
  if(document.querySelector('softm-site-vault[data-site="'+siteId+'"]'))return null;
  const noteKey='softm-site-note-v1:'+siteId;
  let storage;try{storage=window.localStorage;}catch{}
  const local=createLocalStateAdapter({siteId,keys:[...keys,noteKey],storage});
  const adapter=appAdapter?{
    scope:()=>appAdapter.scope?.(),
    async read(){return {version:1,siteId,local:local.read(),app:await appAdapter.read()};},
    validate(value){if(value?.version!==1||value.siteId!==siteId)throw Error('이 사이트의 저장본이 아닙니다.');return {version:1,siteId,local:local.validate(value.local),app:appAdapter.validate(value.app)};},
    async write(value){const next=this.validate(value);await appAdapter.write(next.app);local.write(next.local);}
  }:local;
  const host=document.createElement('softm-site-vault');host.dataset.site=siteId;host.style.cssText='display:inline-flex;flex:0 0 auto;vertical-align:middle;max-width:100%';
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML='<style>'+
    ':host{font:14px/1.6 system-ui,sans-serif;color:#202c28}*{box-sizing:border-box}button,input,textarea,select{font:inherit}button{cursor:pointer;border:1px solid #b8ccc1;background:#fff;color:#234b39;border-radius:10px;padding:10px 14px;min-height:44px}button:disabled{opacity:.5;cursor:wait}button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #428b6a;outline-offset:3px}.launch{padding:8px 10px;white-space:nowrap;font-size:13px;box-shadow:none}.primary{background:#255c44;color:white;border-color:#255c44}.danger{color:#933c32}dialog{color:#202c28;background:#fafcf9;border:1px solid #dce5dd;border-radius:20px;padding:24px;width:min(520px,calc(100vw - 24px));max-height:calc(100dvh - 32px);overflow:auto;margin:auto;box-shadow:0 24px 100px #122c3333}dialog::backdrop{background:#10271c66}h2{font-size:22px;margin:0}h3{font-size:16px;margin:24px 0 6px}p{margin:8px 0 14px;overflow-wrap:anywhere}.head{display:flex;gap:16px;justify-content:space-between;align-items:center}.head button{padding:8px 12px}label{display:block;font-weight:600;margin-top:14px}input[type=password],textarea,select{display:block;width:100%;max-width:100%;border:1px solid #b9cbbf;border-radius:10px;background:#fff;color:#202c28;padding:12px;margin:6px 0}textarea{min-height:110px;resize:vertical}small{font-size:12px;color:#52665a;display:block}.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.actions button{flex:1 1 130px}.auto{display:flex;align-items:flex-start;gap:10px;font-weight:400}.auto input{width:20px;height:20px;flex-shrink:0}.status{padding:12px;background:#edf3eb;border-radius:10px;min-height:48px}.account{font-size:13px}a{color:#255c44}select[hidden],button[hidden]{display:none}hr{border:0;border-top:1px solid #dde5de;margin:20px 0}[hidden]{display:none!important}@media(max-width:380px){dialog{padding:16px}.launch{font-size:12px;padding:6px 8px}}'+
    '</style><button type="button" class="launch" aria-haspopup="dialog">내 보관소</button><dialog aria-labelledby="title">'+
    '<div class="head"><h2 id="title"></h2><button type="button" id="close" aria-label="보관소 닫기">닫기</button></div>'+
    '<p id="scope"></p><p class="account" id="account">공통 계정에 연결하면 다른 기기에서도 이어갈 수 있습니다.</p>'+
    '<div class="actions"><button type="button" class="primary" id="connect">Google · 카카오 로그인</button><button type="button" id="logout" hidden>이 사이트 로그아웃</button></div>'+
    '<label for="note">이 사이트의 개인 메모</label><textarea id="note" maxlength="30000" placeholder="기억할 내용을 적어 두세요."></textarea><small id="note-status">기기 저장소에 보관합니다. 아래 저장 버튼을 눌러야 원격 보관소로 전송합니다.</small>'+
    '<h3>암호화 보관소</h3><label for="password">보관소 암호 · 10자 이상</label><input id="password" type="password" minlength="10" maxlength="256" autocomplete="off" placeholder="로그인 비밀번호와 별도의 암호">'+
    '<small>암호는 서버에 보내거나 기기에 저장하지 않습니다. 암호를 잊으면 저장본을 복호화할 수 없습니다.</small>'+
    '<div class="actions"><button type="button" id="inspect">저장본 확인</button><button type="button" id="save">현재 자료 저장</button></div>'+
    '<label for="history">복원할 저장본 · 최근 5개</label><select id="history"><option value="">최신 저장본</option></select>'+
    '<div class="actions"><button type="button" id="restore">선택한 자료 복원</button><button type="button" id="reload" hidden>복원한 사이트 새로 열기</button></div>'+
    '<label class="auto"><input id="auto" type="checkbox"><span>이 창에서 변경한 자료 자동 저장<small>먼저 저장 또는 복원을 마친 뒤 사용합니다. 창을 닫거나 계정이 바뀌면 꺼집니다.</small></span></label>'+
    '<p id="status" class="status" role="status" aria-live="polite">로그인 후 암호를 입력하고 저장본을 확인해 주세요.</p>'+
    '<div class="actions"><button type="button" id="lock">암호 지우고 잠그기</button><button type="button" class="danger" id="erase">원격 저장본 삭제</button></div>'+
    '<p><small>네이버 로그인은 서비스 승인 대기 중입니다. SNS 게시글·사진은 수집하지 않습니다. <a href="https://softm.github.io/account/privacy.html" target="_blank" rel="noopener noreferrer">공통 계정 개인정보 안내</a></small></p>'+
    '</dialog>';
  const $=id=>shadow.getElementById(id),dialog=shadow.querySelector('dialog'),launcher=shadow.querySelector('.launch');
  $('title').textContent=name+' 보관소';$('scope').textContent='저장 범위: '+label+' · 다른 사이트의 기록과 분리합니다.';
  let client,session,unsubscribe,uid=null,loading=false,autoTimer=null,destroyed=false;
  const status=m=>{$('status').textContent=m;};
  function stopAuto(){clearInterval(autoTimer);autoTimer=null;$('auto').checked=false;}
  function lock(){stopAuto();$('password').value='';session?.reset();$('history').replaceChildren(new Option('최신 저장본',''));status('암호를 지웠습니다. 다시 사용하려면 저장본을 확인해 주세요.');}
  function showNote(){try{$('note').value=storage?.getItem(noteKey)||'';}catch{$('note-status').textContent='기기 저장소를 사용할 수 없습니다.';}}
  function history(rows=[]){$('history').replaceChildren(...(rows.length?rows.map(b=>new Option(new Date(b.savedAt).toLocaleString('ko-KR'),b.id)):[new Option('최신 저장본','')]));}
  async function run(work){
    if(loading)return;loading=true;
    shadow.querySelectorAll('button:not(#close)').forEach(b=>b.disabled=true);
    try{await work();}catch(error){stopAuto();status(error?.name==='OperationError'?'암호 또는 저장본을 확인해 주세요. 기기 자료는 변경하지 않았습니다.':error.message||'연결을 완료하지 못했습니다. 다시 시도해 주세요.');}
    finally{loading=false;shadow.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  function requireSession(){if(!client?.currentUser||!session)throw Error('먼저 공통 계정에 로그인해 주세요.');return session;}
  async function connect(){
    if(loading)return;
    status('로그인 창에서 계정을 선택해 주세요. 연결이 끝나면 이 사이트로 돌아옵니다.');
    const popup=window.open('about:blank','_blank','popup,width=520,height=760');
    if(!popup){status('로그인 팝업을 허용한 뒤 다시 눌러 주세요.');return;}
    await run(async()=>{
      try{
        const sdk=await sdkLoader();client ||= await sdk.createSiteClient({siteId});
        if(!unsubscribe)unsubscribe=client.onUser(user=>{
          const next=user?.uid||null;
          if(uid!==next){uid=next;lock();if(loading)status('계정 연결을 확인하고 있습니다. 완료되면 로그인 창이 닫힙니다.');}
          $('account').textContent=user?'이 사이트의 공통 계정에 로그인했습니다.':'공통 계정에 로그인해 주세요.';
          $('logout').hidden=!user;$('connect').textContent=user?'로그인 계정 바꾸기':'Google · 카카오 로그인';
        });
        await client.login({popup});
        const c=await cryptoLoader();
        session?.reset();session=createVaultSession({siteId,client,adapter,seal:c.seal,unseal:c.unseal,onStatus:status});
        uid=client.currentUser.uid;$('logout').hidden=false;
        status('로그인했습니다. 보관소 암호를 입력하고 저장본을 확인해 주세요.');
      }catch(error){popup.close();throw error;}
    });
  }
  launcher.addEventListener('click',()=>{showNote();dialog.showModal();});
  $('close').onclick=()=>dialog.close();
  $('connect').onclick=connect;
  $('note').addEventListener('input',()=>{
    try{storage.setItem(noteKey,$('note').value);$('note-status').textContent='이 기기에 저장했습니다. 원격 보관은 저장 버튼 또는 켜 둔 자동 저장으로 진행합니다.';}
    catch{$('note-status').textContent='기기에 저장하지 못했습니다. 내용을 복사해 보관하고 저장 공간을 확인해 주세요.';stopAuto();}
  });
  $('password').addEventListener('input',()=>{stopAuto();session?.reset();});
  $('inspect').onclick=()=>run(async()=>{const info=await requireSession().inspect($('password').value);history(info.backups);});
  $('save').onclick=()=>run(async()=>{
    const s=requireSession();let replace=false;
    if(!s.ready&&s.backups.length){replace=window.confirm('원격 저장본을 현재 이 사이트의 자료로 교체 저장할까요? 최근 저장본은 최대 5개 보관합니다.');if(!replace)return;}
    const result=await s.save($('password').value,{replace});history(result.backups);
  });
  $('restore').onclick=()=>run(async()=>{
    stopAuto();const result=await requireSession().restore($('password').value,{backupId:$('history').value||undefined,confirm:async()=>window.confirm('선택한 저장본을 이 사이트에 복원할까요? 현재 기기 자료가 바뀔 수 있습니다. 필요한 현재 자료는 먼저 저장해 주세요.')});
    if(result.restored){showNote();history(result.backups);$('reload').hidden=false;}
  });
  $('reload').onclick=()=>{lock();location.reload();};
  $('erase').onclick=()=>run(async()=>{stopAuto();await requireSession().erase($('password').value,{confirm:async()=>window.confirm('공통 보관소에 저장한 이 사이트의 최근 저장본을 삭제할까요? 이 기기 자료와 기존 별도 계정 자료는 유지됩니다.')});history();});
  $('auto').onchange=()=>{
    const enabled=$('auto').checked;stopAuto();if(!enabled)return;
    try{const s=requireSession();if(!s.ready)throw Error('먼저 저장 또는 복원을 마친 뒤 자동 저장을 켜 주세요.');
      $('auto').checked=true;status('이 창에서 15초마다 변경 여부를 확인하고 암호화 저장합니다.');
      autoTimer=setInterval(()=>{if(!loading&&!session?.busy&&document.visibilityState!=='hidden')run(async()=>{const result=await s.save($('password').value,{automatic:true});if(result.backups)history(result.backups);});},15000);
    }catch(error){status(error.message);}
  };
  $('lock').onclick=lock;
  $('logout').onclick=()=>run(async()=>{lock();await client?.logout();session=null;uid=null;status('이 사이트의 공통 계정에서 로그아웃했습니다.');});
  const pagehide=()=>lock();window.addEventListener('pagehide',pagehide);
  const place=()=>{
    if(destroyed)return;
    let anchor=document.querySelector(target);
    if(!anchor)anchor=document.querySelector('header,nav,main')||document.body;
    if(host.parentElement!==anchor)anchor.append(host);
  };
  place();const observer=new MutationObserver(()=>{place();});observer.observe(document.body,{childList:true,subtree:true});
  return {element:host,open(){showNote();if(!dialog.open)dialog.showModal();},destroy(){destroyed=true;stopAuto();session?.reset();unsubscribe?.();observer.disconnect();window.removeEventListener('pagehide',pagehide);$('password').value='';host.remove();}};
}

