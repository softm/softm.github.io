import {PROOF, ITEM_ID, CONSENT_VERSION, now, random, sha256, challenge, equal, cookies, cookie, json, error, sameOrigin, readJSON} from './crypto.mjs';
import {providerConfig, authorizeUrlWithPkce, exchangeProfile} from './oauth.mjs';
import {page, clientScript} from './ui.mjs';

const DEFAULT_SITES={
  weatherhannun:{name:'날씨한눈',origins:['https://softm.github.io']},
  juyuhannun:{name:'주유한눈',origins:['https://softm.github.io']},
  evchargingstation:{name:'충전한눈',origins:['https://softm.github.io']},
  hydrogenstation:{name:'수소충전한눈',origins:['https://softm.github.io']},
  foodhannun:{name:'음식한눈',origins:['https://softm.github.io']},
  matjiphannun:{name:'맛집한눈',origins:['https://softm.github.io']},
  goldsignal:{name:'금시그널',origins:['https://goldsignal.designboard.net','https://softm.github.io']},
  calc:{name:'계산기',origins:['https://softm.github.io']},
  policyfundfinder:{name:'지원한눈',origins:['https://policyfundfinder.designboard.net','https://softm.github.io']},
  auctionhannun:{name:'경매한눈',origins:['https://auctionhannun.designboard.net','https://softm.github.io']},
  homecare:{name:'돌봄한눈',origins:['https://homecare.designboard.net','https://softm.github.io']},
  bizhannun:{name:'사업자한눈',origins:['https://softm.github.io']},
  norn:{name:'노른',origins:['https://norn.designboard.net','https://softm.github.io']},
  seolgyehaeyo:{name:'설계해요',origins:['https://seolgyehaeyo.softm.chatgpt.site','https://softm.github.io']},
  wirohaeyo:{name:'위로해요',origins:['https://softm.github.io']},
  gagyebu:{name:'가계부',origins:['https://softm.github.io']}
};
function sites(env){
  if(!env.SITE_ORIGINS_JSON)return DEFAULT_SITES;
  try{
    const value=JSON.parse(env.SITE_ORIGINS_JSON);
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error();
    const result={};
    for(const [id,v] of Object.entries(value)){
      if(!ITEM_ID.test(id)||!v||typeof v.name!=='string'||!Array.isArray(v.origins)||!v.origins.length)throw Error();
      const origins=v.origins.map(x=>{const url=new URL(x);if(url.protocol!=='https:'||url.origin!==x)throw Error();return x;});
      result[id]={name:v.name.slice(0,60),origins};
    }
    return result;
  }catch{error('invalid-site-configuration',503);}
}
function validSite(env,site,origin){const registry=sites(env);if(typeof site!=='string'||!ITEM_ID.test(site)||!Object.hasOwn(registry,site)||typeof origin!=='string')error('site-origin-not-allowed',403);const entry=registry[site];if(!entry.origins.includes(origin))error('site-origin-not-allowed',403);return entry;}
function publicBase(request,env){
  const value=env.PUBLIC_BASE_URL;
  if(typeof value!=='string'||value.includes('<')||value.includes('your-subdomain'))error('public-url-not-configured',503);
  const base=new URL(value);
  const requestOrigin=new URL(request.url).origin;
  if(base.origin!==requestOrigin||base.pathname!=='/'||base.search||base.hash)error('public-url-mismatch',503);
  if(base.protocol!=='https:' && !(base.protocol==='http:'&&base.hostname==='localhost'))error('public-url-not-https',503);
  return base.origin;
}
function setHeaders(res){
  const head=new Headers(res.headers);head.set('Cache-Control','no-store');head.set('X-Content-Type-Options','nosniff');head.set('Referrer-Policy','no-referrer');
  return new Response(res.body,{status:res.status,headers:head});
}
function html(){
  return new Response(page(),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src https: data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'"}});
}
function redirect(path,headers={}){return new Response(null,{status:303,headers:{Location:path,'Cache-Control':'no-store',...headers}});}
async function identityHash(provider,subject){return sha256(provider+':'+subject);}
async function session(request,env){
  const token=cookies(request)['__Host-sh_session'];
  if(!token||!PROOF.test(token))return null;
  return env.DB.prepare('SELECT u.id,u.display_name,u.avatar_url,u.consent_version,s.authenticated_at FROM web_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.disabled_at IS NULL')
    .bind(await sha256(token),now()).first();
}
async function requireSession(request,env){const u=await session(request,env);if(!u)error('login-required',401);return u;}
function cookieClear(name){return cookie(name,'',0);}
async function context(request,env){
  const token=cookies(request)['__Host-sh_connect'];if(!token||!PROOF.test(token))error('connect-request-required',401);
  const row=await env.DB.prepare('SELECT site,origin,challenge,request_id FROM connect_intents WHERE token_hash=? AND expires_at>?')
    .bind(await sha256(token),now()).first();
  if(!row)error('connect-request-expired',401);
  validSite(env,row.site,row.origin);return row;
}
function providerIds(env){return ['google','kakao','naver'].filter(p=>p!=='naver'||env.NAVER_PUBLIC_ENABLED==='true');}
async function startOAuth(request,env,provider){
  const cfg=providerConfig(provider,env);void cfg;
  const url=new URL(request.url);const mode=url.searchParams.get('mode')==='link'?'link':'login';
  let linkUser=null;
  if(mode==='link'){
    linkUser=await requireSession(request,env);
    if(now()-linkUser.authenticated_at>300)error('recent-login-required',401);
  }
  const state=random(),nonce=random(),verifier=random(),callback=publicBase(request,env)+'/auth/callback/'+provider;
  await env.DB.prepare('INSERT INTO oauth_attempts(state_hash,provider,mode,link_uid,nonce,verifier,expires_at) VALUES(?,?,?,?,?,?,?)')
    .bind(await sha256(state),provider,mode,linkUser?.id||null,nonce,verifier,now()+300).run();
  const location=(await authorizeUrlWithPkce(provider,env,{state,nonce,verifier,redirectUri:callback})).href;
  return redirect(location,{'Set-Cookie':cookie('oauth',state,300)});
}
async function finishOAuth(request,env,provider){
  providerConfig(provider,env);
  const u=new URL(request.url),state=u.searchParams.get('state'),code=u.searchParams.get('code');
  const saved=cookies(request)['__Host-sh_oauth'];
  if(!state||!saved||!PROOF.test(state)||!equal(state,saved))error('oauth-state-invalid',401);
  const row=await env.DB.prepare('DELETE FROM oauth_attempts WHERE state_hash=? AND provider=? AND expires_at>? RETURNING provider,mode,link_uid,nonce,verifier')
    .bind(await sha256(state),provider,now()).first();
  if(!row||!code||code.length>2048||u.searchParams.get('error'))error('oauth-cancelled-or-expired',401);
  const profile=await exchangeProfile(provider,env,{code,state,verifier:row.verifier,nonce:row.nonce,redirectUri:publicBase(request,env)+'/auth/callback/'+provider});
  const digest=await identityHash(provider,profile.subject);
  const existing=await env.DB.prepare('SELECT user_id FROM identities WHERE subject_hash=?').bind(digest).first();
  let uid;
  if(row.mode==='link'){
    const current=await env.DB.prepare('SELECT id FROM users WHERE id=? AND disabled_at IS NULL').bind(row.link_uid).first();
    if(!current)error('link-session-expired',401);
    if(existing&&existing.user_id!==current.id)error('provider-already-linked',409);
    if(!existing)await env.DB.prepare('INSERT INTO identities(subject_hash,user_id,provider,created_at) VALUES(?,?,?,?)').bind(digest,current.id,provider,now()).run();
    uid=current.id;
  }else if(existing){
    uid=existing.user_id;
  }else{
    // Optional test-user allowlist permits staging sign-in without opening
    // registration for existing Firebase users that have not been migrated.
    let testIdentityAllowed=false;
    if(env.ALLOWED_TEST_IDENTITY_HASHES_JSON){
      let allowed;try{allowed=JSON.parse(env.ALLOWED_TEST_IDENTITY_HASHES_JSON);}catch{error('invalid-test-identity-allowlist',503);}
      if(!Array.isArray(allowed)||allowed.some(x=>typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x)))error('invalid-test-identity-allowlist',503);
      testIdentityAllowed=allowed.includes(digest);
    }
    if(env.ALLOW_NEW_REGISTRATIONS!=='true'&&!testIdentityAllowed)error('migration-registration-locked',503);
    uid='sh_'+crypto.randomUUID().replace(/-/g,'');
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users(id,display_name,avatar_url,created_at) VALUES(?,?,?,?)').bind(uid,profile.name,profile.photo,now()),
      env.DB.prepare('INSERT INTO identities(subject_hash,user_id,provider,created_at) VALUES(?,?,?,?)').bind(digest,uid,provider,now())
    ]);
  }
  const user=await env.DB.prepare('SELECT id,display_name,avatar_url FROM users WHERE id=? AND disabled_at IS NULL').bind(uid).first();
  if(!user)error('account-disabled',403);
  if(profile.name||profile.photo){
    await env.DB.prepare("UPDATE users SET display_name=CASE WHEN ?='' THEN display_name ELSE ? END, avatar_url=CASE WHEN ?='' THEN avatar_url ELSE ? END WHERE id=?")
      .bind(profile.name,profile.name,profile.photo,profile.photo,uid).run();
  }
  const sessionToken=random();
  await env.DB.prepare('INSERT INTO web_sessions(token_hash,user_id,authenticated_at,expires_at) VALUES(?,?,?,?)')
    .bind(await sha256(sessionToken),uid,now(),now()+604800).run();
  const destination=cookies(request)['__Host-sh_connect']?'/connect':'/account';
  const headers=new Headers({Location:destination,'Cache-Control':'no-store'});
  headers.append('Set-Cookie',cookie('oauth','',0));headers.append('Set-Cookie',cookie('session',sessionToken,604800));
  return new Response(null,{status:303,headers});
}
async function me(request,env){
  const user=await session(request,env);
  if(!user)return json({user:null,naverPublic:env.NAVER_PUBLIC_ENABLED==='true',deletionEnabled:false});
  const providers=await env.DB.prepare('SELECT provider FROM identities WHERE user_id=? ORDER BY provider').bind(user.id).all();
  return json({user:{id:user.id,name:user.display_name||'',avatar:user.avatar_url||'',consentVersion:user.consent_version||null,providers:(providers.results||[]).map(x=>x.provider)},
    naverPublic:env.NAVER_PUBLIC_ENABLED==='true',deletionEnabled:false});
}
async function accountAPI(request,env,path){
  if(path==='/api/me'&&request.method==='GET')return me(request,env);
  if(path==='/api/connect/info'&&request.method==='GET'){
    const ctx=await context(request,env);
    return json({site:ctx.site,origin:ctx.origin,name:validSite(env,ctx.site,ctx.origin).name});
  }
  if(request.method!=='POST')error('method-not-allowed',405);
  sameOrigin(request);
  if(path==='/api/logout'){
    const token=cookies(request)['__Host-sh_session'];
    if(token&&PROOF.test(token))await env.DB.prepare('DELETE FROM web_sessions WHERE token_hash=?').bind(await sha256(token)).run();
    return json({ok:true},200,{'Set-Cookie':cookieClear('session')});
  }
  const user=await requireSession(request,env);
  if(path==='/api/consent'){
    const body=await readJSON(request,3000);
    if(body.version!==CONSENT_VERSION||body.accepted!==true)error('consent-required');
    await env.DB.prepare('UPDATE users SET consent_version=?,consent_at=? WHERE id=? AND disabled_at IS NULL').bind(CONSENT_VERSION,now(),user.id).run();
    return json({ok:true,version:CONSENT_VERSION});
  }
  if(path==='/api/connect/authorize'){
    if(user.consent_version!==CONSENT_VERSION)error('consent-required',403);
    const ctx=await context(request,env),code=random();
    await env.DB.prepare('INSERT INTO auth_codes(code_hash,user_id,site,origin,challenge,request_id,used,expires_at) VALUES(?,?,?,?,?,?,0,?)')
      .bind(await sha256(code),user.id,ctx.site,ctx.origin,ctx.challenge,ctx.request_id,now()+60).run();
    return json({code,site:ctx.site,origin:ctx.origin,request:ctx.request_id});
  }
  if(path==='/api/account/delete'){
    // Never delete only D1 while the corresponding Firebase account, ledger,
    // backups and inherited services may still exist. This endpoint is locked
    // until a verified cross-system deletion job is implemented.
    error('migration-not-complete',503);
  }
  error('not-found',404);
}
async function registerConnect(request,env){
  const u=new URL(request.url);
  const site=u.searchParams.get('site'),origin=u.searchParams.get('origin');
  const proof=u.searchParams.get('challenge'),requestId=u.searchParams.get('request');
  validSite(env,site,origin);
  if(!PROOF.test(proof||'')||!PROOF.test(requestId||''))error('invalid-connect-request',400);
  const token=random();
  await env.DB.prepare('INSERT INTO connect_intents(token_hash,site,origin,challenge,request_id,expires_at) VALUES(?,?,?,?,?,?)')
    .bind(await sha256(token),site,origin,proof,requestId,now()+300).run();
  return redirect('/connect',{'Set-Cookie':cookie('connect',token,300)});
}
async function exchangeConnect(request,env){
  const origin=request.headers.get('Origin'),body=await readJSON(request,3000);
  if(!origin||body.origin!==origin||!PROOF.test(body.code||'')||!PROOF.test(body.verifier||''))error('invalid-exchange',403);
  validSite(env,body.site,origin);
  const hash=await sha256(body.code);
  const code=await env.DB.prepare('SELECT user_id,site,origin,challenge FROM auth_codes WHERE code_hash=? AND used=0 AND expires_at>?')
    .bind(hash,now()).first();
  if(!code||code.site!==body.site||code.origin!==origin||!equal(await challenge(body.verifier),code.challenge))error('invalid-or-expired-code',401);
  // Consume exactly once AFTER checking the proof and the target.
  const consumed=await env.DB.prepare('UPDATE auth_codes SET used=1 WHERE code_hash=? AND used=0 AND expires_at>?')
    .bind(hash,now()).run();
  if(consumed.meta?.changes!==1)error('invalid-or-expired-code',401);
  const token=random();
  await env.DB.prepare('INSERT INTO app_sessions(token_hash,user_id,site,expires_at) VALUES(?,?,?,?)')
    .bind(await sha256(token),code.user_id,code.site,now()+3600).run();
  return json({accessToken:token,tokenType:'Bearer',expiresIn:3600,uid:code.user_id});
}
async function requireApp(request,env,site){
  const origin=request.headers.get('Origin');
  validSite(env,site,origin);
  const match=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/);
  if(!match)error('login-required',401);
  const session=await env.DB.prepare('SELECT s.user_id FROM app_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.site=? AND s.expires_at>? AND u.disabled_at IS NULL')
    .bind(await sha256(match[1]),site,now()).first();
  if(!session)error('session-expired',401);return session.user_id;
}
function validatePayload(data){
  if(typeof data.payload!=='string'||data.payload.length>180000)error('invalid-encrypted-payload');
  let p;try{p=JSON.parse(data.payload)}catch{error('invalid-encrypted-payload');}
  if(!p||p.v!==1||p.algorithm!=='AES-GCM'||p.iterations!==310000||typeof p.ct!=='string'||typeof p.iv!=='string'||typeof p.salt!=='string')error('invalid-encrypted-payload');
}
async function revokeApp(request,env,url){
  const m=url.pathname.match(/^\/api\/apps\/([a-z0-9_-]+)\/logout$/);
  if(!m||request.method!=='POST')error('not-found',404);
  const site=m[1];await requireApp(request,env,site);
  const token=request.headers.get('Authorization').slice(7);
  await env.DB.prepare('DELETE FROM app_sessions WHERE token_hash=? AND site=?').bind(await sha256(token),site).run();
  return json({ok:true});
}
async function itemsAPI(request,env,url){
  const m=url.pathname.match(/^\/api\/apps\/([a-z0-9_-]+)\/items\/([A-Za-z0-9_-]{1,80})$/);
  if(!m)error('not-found',404);
  const site=m[1],itemId=m[2],uid=await requireApp(request,env,site);
  if(request.method==='GET'){
    const row=await env.DB.prepare('SELECT revision,payload FROM items WHERE user_id=? AND site=? AND item_id=?').bind(uid,site,itemId).first();
    if(!row)error('item-not-found',404);return json({id:itemId,revision:row.revision,payload:row.payload});
  }
  if(request.method==='PUT'){
    const data=await readJSON(request,200000);
    if(!Number.isSafeInteger(data.expectedRevision)||data.expectedRevision<0)error('invalid-revision');
    validatePayload(data);
    let result;
    if(data.expectedRevision===0){
      result=await env.DB.prepare('INSERT INTO items(user_id,site,item_id,revision,payload,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT DO NOTHING')
        .bind(uid,site,itemId,1,data.payload,now()).run();
    }else{
      result=await env.DB.prepare('UPDATE items SET revision=revision+1,payload=?,updated_at=? WHERE user_id=? AND site=? AND item_id=? AND revision=?')
        .bind(data.payload,now(),uid,site,itemId,data.expectedRevision).run();
    }
    if(result.meta?.changes!==1)error('revision-conflict',409);
    return json({revision:data.expectedRevision+1});
  }
  if(request.method==='DELETE'){
    const data=await readJSON(request,2000);
    if(!Number.isSafeInteger(data.expectedRevision)||data.expectedRevision<1)error('invalid-revision');
    const result=await env.DB.prepare('DELETE FROM items WHERE user_id=? AND site=? AND item_id=? AND revision=?')
      .bind(uid,site,itemId,data.expectedRevision).run();
    if(result.meta?.changes!==1)error('revision-conflict',409);
    return json({deleted:true});
  }
  error('method-not-allowed',405);
}
function cors(request,env,response){
  const origin=request.headers.get('Origin');if(!origin)return response;
  const allowed=Object.values(sites(env)).some(v=>v.origins.includes(origin));
  if(!allowed)return response;
  const headers=new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin',origin);
  headers.set('Vary','Origin');
  headers.set('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers','Authorization,Content-Type');
  headers.set('Access-Control-Max-Age','600');
  return new Response(response.body,{status:response.status,headers});
}
async function route(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(!env.DB)error('database-not-configured',503);
  if(path==='/health'){
    if(request.method!=='GET')error('method-not-allowed',405);
    await env.DB.prepare('SELECT id FROM users LIMIT 1').first();
    return json({ok:true,service:'softm-hannun-account',version:1,naverPublic:env.NAVER_PUBLIC_ENABLED==='true'});
  }
  if(path==='/client.js')return new Response(clientScript,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  if(path==='/account'||path==='/connect'&&!url.searchParams.has('site'))return html();
  if(path==='/connect'&&request.method==='GET')return registerConnect(request,env);
  if(path.startsWith('/auth/callback/')&&request.method==='GET'){
    const provider=path.split('/')[3];return finishOAuth(request,env,provider);
  }
  if(path.startsWith('/auth/')&&request.method==='GET')return startOAuth(request,env,path.split('/')[2]);
  if(path==='/api/connect/exchange'&&request.method==='POST')return exchangeConnect(request,env);
  if(path.startsWith('/api/apps/')&&path.endsWith('/logout'))return revokeApp(request,env,url);
  if(path.startsWith('/api/apps/'))return itemsAPI(request,env,url);
  if(path.startsWith('/api/'))return accountAPI(request,env,path);
  error('not-found',404);
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(request.method==='OPTIONS'){
      const origin=request.headers.get('Origin');
      if(!origin||!Object.values(sites(env)).some(v=>v.origins.includes(origin)))return json({error:'invalid-origin'},403);
      return cors(request,env,new Response(null,{status:204}));
    }
    let response;
    try{
      if(request.method!=='GET'&&request.method!=='POST'&&request.method!=='PUT'&&request.method!=='DELETE')error('method-not-allowed',405);
      response=await route(request,env);
    }catch(e){
      const status=e.status||500;
      const code=status===500?'internal-error':String(e.message||'unavailable');
      // No provider token, personal data, state, code, or session token in logs or response.
      if(url.pathname.startsWith('/auth/callback/')){
        response=redirect('/account?error=login');
      }else response=json({error:code,message:status===500?'일시적으로 연결할 수 없습니다.':{
        'login-required':'로그인이 필요합니다.',
        'recent-login-required':'같은 계정으로 다시 로그인한 뒤 연결해 주세요.',
        'migration-registration-locked':'기존 계정 이전 검증 중입니다. 신규 가입은 아직 사용할 수 없습니다.',
        'provider-not-public':'네이버 일반 로그인 승인 대기 중입니다.',
        'consent-required':'이용약관 동의가 필요합니다.',
        'migration-not-complete':'이전 검증 중이므로 탈퇴 기능을 잠시 사용할 수 없습니다.'
      }[code]||'요청을 처리하지 못했습니다. 다시 시도해 주세요.'},status);
    }
    return cors(request,env,setHeaders(response));
  },
  async scheduled(event,env){
    const t=now();
    for(const table of ['oauth_attempts','connect_intents','auth_codes','app_sessions','web_sessions']){
      await env.DB.prepare('DELETE FROM '+table+' WHERE expires_at<?').bind(t).run();
    }
  }
};
