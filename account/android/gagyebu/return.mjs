const params = new URLSearchParams(location.hash.slice(1));
const proof = value => /^[A-Za-z0-9_-]{43}$/.test(value || '');
const link = document.getElementById('return');
if (proof(params.get('request')) && (proof(params.get('code')) || params.get('error') === 'cancelled')) {
  const url = new URL('softm.android.gagyebu://auth/callback');
  url.hash = new URLSearchParams({request:params.get('request'),
    ...(params.get('error') === 'cancelled' ? {error:'cancelled'} : {code:params.get('code')})});
  link.href = url.href;
  document.getElementById('message').textContent = '앱이 자동으로 열리지 않으면 아래 버튼을 눌러 주세요.';
}
// The short-lived authorization code is never left in browser history.
history.replaceState(null, '', location.pathname);
// Enable the button only after the authorization response is attached.
link.hidden = false;
