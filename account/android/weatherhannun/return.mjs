// OAuth code is short-lived, site-bound and PKCE-bound; never include a bearer token.
const params=new URLSearchParams(location.hash.slice(1));
const proof=v=>/^[A-Za-z0-9_-]{43}$/.test(v||'');
const request=params.get('request'),code=params.get('code');
const valid=proof(request)&&proof(code);
const link=document.getElementById('return');
if(valid){
 const target=new URL('weatherhannun://auth/callback');
 target.hash=new URLSearchParams({request,code}).toString();
 link.href=target.href;
 link.hidden=false;
 document.getElementById('message').textContent='로그인이 승인되었습니다. 아래 버튼을 눌러 날씨한눈 앱으로 돌아가세요.';
}
history.replaceState(null,'',location.pathname);
