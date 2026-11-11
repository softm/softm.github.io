export function page(){
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>한눈과 해요 · 내 계정</title>
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",system-ui,sans-serif;color:#192638;background:#f5f7fb}*{box-sizing:border-box}body{margin:0}main{max-width:480px;margin:28px auto;padding:20px}.logo{font-size:14px;font-weight:800;color:#53627a;letter-spacing:.02em}.heading{margin:20px 0 6px;font-size:29px;line-height:1.24}p{color:#627184;line-height:1.65}.card{margin:18px 0;padding:22px;border:1px solid #e4e9f0;border-radius:18px;background:#fff;box-shadow:0 9px 28px #1b2a4810}.btn{display:block;width:100%;cursor:pointer;border:1px solid #dce2eb;border-radius:12px;background:#fff;padding:13px;margin:10px 0;font:600 15px inherit;text-align:left;color:#192638}.btn:focus-visible{outline:3px solid #4b7ed9}.btn:disabled{opacity:.5;cursor:not-allowed}.btn.primary{background:#1d344e;color:#fff;text-align:center}.btn.subtle{border:0;background:#f3f6f9;text-align:center}.btn.danger{color:#b33636}.muted{font-size:13px}.user{display:flex;align-items:center;gap:12px}.avatar{height:46px;width:46px;object-fit:cover;border-radius:100%;background:#e5eaf1}.circle{height:46px;width:46px;border-radius:50%;background:#e5eaf1;display:grid;place-items:center;font-weight:700}.username{font-weight:750}.provider-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:10px 0}.tag{padding:4px 7px;background:#eaf5ed;border-radius:7px;font-size:12px;color:#246639}.notice{padding:10px 12px;border-radius:10px;background:#fff5e9;color:#8f520c}.small-link{font-size:13px;color:#586878}label{display:block;margin:11px 0;color:#435369;font-size:13px}label input{margin-right:7px}#status{min-height:20px;font-size:13px}footer{margin:25px 0;color:#8792a2;font-size:12px;text-align:center}
</style></head><body><main><div class="logo">한눈과 해요 · SOFTM ACCOUNT</div><h1 class="heading">내 계정, 간편하게.</h1><p>Google·카카오·네이버로 로그인하고 여러 한눈 서비스를 하나의 계정으로 이용하세요.</p>
<section class="card" id="login"><h2>간편 로그인</h2><button class="btn" data-provider="google">Google로 계속하기</button><button class="btn" data-provider="kakao">카카오로 계속하기</button><button class="btn" data-provider="naver">네이버로 계속하기</button><p class="muted">로그인은 신원 확인에만 사용하며 SNS 게시글은 읽지 않습니다.</p></section>
<section class="card" id="profile" hidden><div class="user"><div id="avatar" class="circle">나</div><div><div id="name" class="username"></div><div class="muted">로그인됨</div></div></div>
<h3>연결된 로그인 수단</h3><div id="providers"></div>
<p class="muted">다른 SNS를 연결하면 다음부터 같은 계정으로 로그인할 수 있습니다. 이메일이 같다고 자동으로 합치지는 않습니다.</p>
<button id="logout" class="btn subtle">로그아웃</button><button id="withdraw" class="btn danger" disabled title="기존 Firebase 계정 이전 검증 후 활성화">회원탈퇴 (이전 준비 중)</button></section>
<section class="card" id="terms" hidden><h2>첫 회원가입</h2><p>공통 계정을 사용하기 위해 필수 약관을 확인해 주세요.</p><label><input id="t1" type="checkbox"> <a href="https://softm.github.io/account/terms.html" target="_blank" rel="noopener">이용약관</a>에 동의합니다.</label><label><input id="t2" type="checkbox"> <a href="https://softm.github.io/account/privacy.html" target="_blank" rel="noopener">개인정보 처리 안내</a>를 확인했습니다.</label><button id="accept" class="btn primary">동의하고 가입 완료</button></section>
<section class="card" id="connect" hidden><h2>서비스 연결</h2><p id="connect-name"></p><button id="connect-button" class="btn primary">이 계정으로 연결하기</button><button id="cancel" class="btn subtle">연결 취소</button><p class="muted">로그인만으로 기기 데이터를 업로드하지 않습니다.</p></section>
<p id="status" role="status" aria-live="polite"></p><footer>회원 기록은 계정에, 앱 데이터 관리는 각 서비스에</footer></main><script src="/client.js" defer></script></body></html>`;
}
export const clientScript=String.raw`
const $=x=>document.querySelector(x),SITE=location.pathname==='/connect';let user=null,intent=null,busy=false;
function status(s){$('#status').textContent=s;}
async function call(path,method='GET',body){
 const r=await fetch(path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 let data={};try{data=await r.json();}catch{}if(!r.ok)throw Error(data.message||data.error||'요청을 완료하지 못했습니다.');return data;
}
function action(el,fn){el.addEventListener('click',async()=>{if(busy)return;busy=true;status('처리 중입니다…');try{await fn();}catch(e){status(e.message)}finally{busy=false;}});}
async function refresh(){
 const result=await call('/api/me');user=result.user;
 $('#login').hidden=!!user;$('#profile').hidden=!user;
 $('#terms').hidden=!user||!!user.consentVersion;
 $('#connect').hidden=!SITE||!intent||!user||!user.consentVersion;
 if(!user)return;
 $('#name').textContent=user.name||'나의 한눈 계정';
 const ava=$('#avatar');ava.replaceChildren();
 if(user.avatar){const img=new Image();img.className='avatar';img.referrerPolicy='no-referrer';img.src=user.avatar;img.alt='프로필';ava.append(img);}else ava.textContent=(user.name||'나')[0];
 const root=$('#providers');root.replaceChildren();
 for(const provider of ['google','kakao','naver']){
  const row=document.createElement('div');row.className='provider-row';const label=document.createElement('span');label.textContent={google:'Google',kakao:'카카오',naver:'네이버'}[provider];row.append(label);
  if(user.providers.includes(provider)){const span=document.createElement('span');span.textContent='연결됨';span.className='tag';row.append(span);}
  else{const b=document.createElement('button');b.className='btn';b.style.width='auto';b.style.margin='0';b.textContent='연결';b.disabled=provider==='naver'&&!result.naverPublic;b.addEventListener('click',()=>location.assign('/auth/'+provider+'?mode=link'));row.append(b);}
  root.append(row);
 }
 $('#withdraw').disabled=!result.deletionEnabled;
 $('#withdraw').textContent=result.deletionEnabled?'회원탈퇴':'회원탈퇴 (이전 준비 중)';
}
async function init(){
 if(SITE){try{intent=await call('/api/connect/info');$('#connect-name').textContent=intent.name+'에 로그인합니다.';}catch(e){status(e.message);}}
 for(const b of document.querySelectorAll('[data-provider]')){if(b.dataset.provider==='naver'&&!((await call('/health')).naverPublic)){b.disabled=true;b.textContent='네이버 · 승인 대기';}else b.addEventListener('click',()=>location.assign('/auth/'+b.dataset.provider));}
 action($('#logout'),async()=>{await call('/api/logout','POST',{});await refresh();status('로그아웃했습니다.');});
 action($('#accept'),async()=>{if(!$('#t1').checked||!$('#t2').checked)throw Error('필수 약관 두 항목을 확인해 주세요.');await call('/api/consent','POST',{version:'2026-11-11',accepted:true});await refresh();status('가입이 완료됐습니다.');});
 action($('#withdraw'),async()=>{if(!confirm('회원탈퇴하면 복구할 수 없습니다. 계속하시겠습니까?'))return;const v=prompt('확인을 위해 회원탈퇴를 입력해 주세요.');if(v!=='회원탈퇴')return;await call('/api/account/delete','POST',{confirmation:v});await refresh();status('탈퇴가 완료됐습니다.');});
 action($('#connect-button'),async()=>{if(!window.opener||window.opener.closed)throw Error('원래 앱에서 연결 창을 다시 열어 주세요.');const v=await call('/api/connect/authorize','POST',{});window.opener.postMessage({type:'softm:authorization',requestId:v.request,code:v.code},v.origin);status('앱에 연결 요청을 전달했습니다.');setTimeout(()=>window.close(),600);});
 $('#cancel').addEventListener('click',()=>window.close());
 await refresh();
 const reason=new URLSearchParams(location.search).get('error');if(reason)status('SNS 연결을 마치지 못했습니다. 다시 시도해 주세요.');
}
init().catch(e=>status(e.message));
`;
