import {fail} from './security.mjs';

const safeErrors=new Set(['invalid_request','invalid_client','invalid_grant','unauthorized_client','unsupported_grant_type','server_error','temporarily_unavailable','access_denied']);
const safeProviders=new Set(['kakao','naver']);

// Only fixed diagnostics leave this function. Never log the request, raw body,
// error_description, credentials, authorization code or provider token.
export async function exchangeProviderToken(provider,settings,{code,state,redirectUri},{fetchImpl=fetch,log=console.error}={}){
  const diagnostic=(reason,httpStatus=0)=>log('suite-provider-failure',{
    provider:safeProviders.has(provider)?provider:'unknown',stage:'token',
    code:safeErrors.has(reason)?reason:'unknown',httpStatus
  });
  const params=new URLSearchParams({grant_type:'authorization_code',client_id:settings.client(),client_secret:settings.secret(),redirect_uri:redirectUri,code,state});
  let response;
  try{
    response=await fetchImpl(settings.token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params.toString(),signal:AbortSignal.timeout(12000)});
  }catch{
    diagnostic('temporarily_unavailable');fail('provider-request-failed',502);
  }
  let body;
  try{body=await response.json();}catch{
    diagnostic('unknown',response.status);fail('provider-request-failed',502);
  }
  if(!response.ok||typeof body?.access_token!=='string'||!body.access_token||body.error){
    diagnostic(body?.error,response.status);fail('provider-login-failed',401);
  }
  return body.access_token;
}

export function oauthFailureUrl(hub,state,error){
  const redirect=new URL(hub);
  const reason=error?.message==='provider-cancelled'?'cancelled':error?.message==='provider-already-linked'?'already-linked':'unavailable';
  redirect.hash=new URLSearchParams({oauth:state,'oauth-error':reason}).toString();
  return redirect.href;
}
