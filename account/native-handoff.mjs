const proof = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);

// The return address comes only from our registry, never from a request URL.
export function nativeReturnUrl(registry, target) {
  const site = registry?.sites?.[target.siteId], native = site?.android;
  if (target.transport !== 'android' || !native || !site.origins.includes(target.origin)
      || target.origin !== native.origin || !proof(target.challenge) || !proof(target.requestId)) return null;
  try {
    const url = new URL(native.returnUrl), hub = new URL(registry.hub);
    if (url.protocol !== 'https:' || url.origin !== hub.origin || url.username || url.password
        || url.search || url.hash || !url.pathname.startsWith('/account/android/')) return null;
    return url;
  } catch { return null; }
}

export function nativeReplyUrl(registry, target, response) {
  const url = nativeReturnUrl(registry, target);
  if (!url || !(proof(response.code) || response.error === 'cancelled')) throw Error('잘못된 앱 연결 요청입니다.');
  url.hash = new URLSearchParams({request:target.requestId,
    ...(response.error === 'cancelled' ? {error:'cancelled'} : {code:response.code})}).toString();
  return url.href;
}
