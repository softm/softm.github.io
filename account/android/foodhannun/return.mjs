// A single-use PKCE-bound code returns to FoodHannun, never a bearer token.
const params=new URLSearchParams(location.hash.slice(1));
const valid=value=>/^[A-Za-z0-9_-]{43}$/.test(value||'');
const request=params.get('request'),code=params.get('code');
const link=document.getElementById('return');
if(valid(request)&&valid(code)){
  const target=new URL('foodhannun://auth/callback');
  target.hash=new URLSearchParams({request,code}).toString();
  link.href=target.href;
  link.hidden=false;
  document.getElementById('message').textContent='인증이 완료되었습니다. 아래 버튼을 눌러 음식한눈 앱으로 돌아가세요.';
}
history.replaceState(null,'',location.pathname);
