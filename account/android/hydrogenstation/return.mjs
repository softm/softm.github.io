const params=new URLSearchParams(location.hash.slice(1));
const proof=v=>/^[A-Za-z0-9_-]{43}$/.test(v||'');
const request=params.get('request'),code=params.get('code'),link=document.getElementById('return');
if(proof(request)&&proof(code)){
 const target=new URL('hydrogenstation://auth/callback');
 target.hash=new URLSearchParams({request,code}).toString();
 link.href=target.href;link.hidden=false;
 document.getElementById('message').textContent='로그인이 승인되었습니다. 아래 버튼을 눌러 수소한눈 앱으로 돌아가세요.';
}
history.replaceState(null,'',location.pathname);
