import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import worker from '../src/index.mjs';
import {PROOF,ITEM_ID,CONSENT_VERSION,random,challenge,sha256,equal,cookies,cookie} from '../src/crypto.mjs';
import {providerConfig,authorizeUrlWithPkce} from '../src/oauth.mjs';
import {page,clientScript} from '../src/ui.mjs';
test('cryptographic state and legacy provider hash contract',async()=>{
  const verifier=random();assert.match(verifier,PROOF);
  assert.match(await challenge(verifier),PROOF);
  const testValue='kakao:12345';
  assert.equal(await sha256(testValue),createHash('sha256').update(testValue).digest('hex'));
  assert.equal(equal(await challenge(verifier),await challenge(verifier)),true);
  assert.equal(equal(await challenge(verifier),await challenge(random())),false);
});
test('cookie is __Host HttpOnly Secure SameSite=Lax',()=>{
  assert.match(cookie('session','value',300),/__Host-sh_session=value; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=300/);
  assert.equal(cookies(new Request('https://example.com',{headers:{Cookie:'a=1; __Host-sh_session=abc'}}))['__Host-sh_session'],'abc');
});
test('site connect can redirect directly to a requested configured SNS only',async()=>{
  const token=random(),proof=random(),requestId=random();
  const env={
    DB:{prepare:()=>({bind:()=>({run:async()=>({meta:{changes:1}})})})},
    PUBLIC_BASE_URL:'https://worker.example',
    GOOGLE_CLIENT_ID:'mock-id',GOOGLE_CLIENT_SECRET:'mock-secret',
    NAVER_PUBLIC_ENABLED:'false'
  };
  const query=new URLSearchParams({site:'gagyebu',origin:'https://softm.github.io',challenge:proof,request:requestId,provider:'google'});
  const res=await worker.fetch(new Request('https://worker.example/connect?'+query),env);
  assert.equal(res.status,303);
  assert.equal(res.headers.get('location'),'/auth/google');
  assert.match(res.headers.get('set-cookie')||'',/__Host-sh_connect=/);
  query.set('provider','naver');
  const blocked=await worker.fetch(new Request('https://worker.example/connect?'+query),env);
  assert.equal(blocked.status,503);
  query.set('provider','other');
  const unknown=await worker.fetch(new Request('https://worker.example/connect?'+query),env);
  assert.equal(unknown.status,404);
});
test('provider validation and Google OAuth PKCE',async()=>{
  const env={GOOGLE_CLIENT_ID:'test-id',GOOGLE_CLIENT_SECRET:'test-secret',NAVER_PUBLIC_ENABLED:'false'};
  assert.equal(providerConfig('google',env).clientId,'test-id');
  assert.throws(()=>providerConfig('naver',env),/provider-not-public/);
  assert.throws(()=>providerConfig('invalid',env),/unsupported-provider/);
  const state=random(),nonce=random(),verifier=random();
  const url=await authorizeUrlWithPkce('google',env,{state,nonce,verifier,redirectUri:'https://example.com/auth/callback/google'});
  assert.equal(url.searchParams.get('state'),state);
  assert.equal(url.searchParams.get('nonce'),nonce);
  assert.equal(url.searchParams.get('code_challenge'),await challenge(verifier));
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert.equal(url.searchParams.get('redirect_uri'),'https://example.com/auth/callback/google');
});
test('first signup and registered member use exclusive screens',()=>{
  const html=page();
  assert.match(html,/id="login" hidden/);
  assert.match(html,/id="profile" hidden/);
  assert.match(html,/id="terms" hidden/);
  assert.match(html,/회원가입 완료/);
  assert.match(clientScript,/const member=!!user&&user\.consentVersion==='2026-11-11'/);
  assert.match(clientScript,/\$\('#profile'\)\.hidden=!member/);
  assert.match(clientScript,/\$\('#terms'\)\.hidden=!user\|\|member/);
  assert.match(clientScript,/if\(!member\)\{/);
  assert.match(clientScript,/await refresh\(\);status\('가입이 완료됐습니다\.'/);
});
test('minimal UI contains consent, account linking, no vault editor',()=>{
  const html=page();
  assert.match(html,/회원탈퇴/);assert.match(html,/카카오/);
  assert.doesNotMatch(html,/보관소 암호/);
  assert.match(clientScript,/postMessage/);assert.match(clientScript,/connect\/authorize/);
});
const env={DB:{prepare:()=>({first:async()=>null,bind:()=>({first:async()=>null})})},NAVER_PUBLIC_ENABLED:'false'};
test('health is public and omits secrets',async()=>{
  const res=await worker.fetch(new Request('https://worker.example/health'),env);
  const data=await res.json();assert.equal(res.status,200);assert.equal(data.ok,true);assert.equal(data.naverPublic,false);
  assert.doesNotMatch(JSON.stringify(data),/SECRET|TOKEN|API_KEY/);
});
test('no user GET me works without Origin header',async()=>{
  const res=await worker.fetch(new Request('https://worker.example/api/me'),env);
  assert.equal(res.status,200);
  assert.equal((await res.json()).user,null);
});
test('CORS rejects unregistered origins and cross-site changes',async()=>{
  const preflight=await worker.fetch(new Request('https://worker.example/api/connect/exchange',{method:'OPTIONS',headers:{Origin:'https://evil.example'}}),env);
  assert.equal(preflight.status,403);
  const logout=await worker.fetch(new Request('https://worker.example/api/logout',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'}),env);
  assert.equal(logout.status,403);
});
test('auction session endpoint requires a site-scoped bearer and allowed origin',async()=>{
  const origin='https://auctionhannun.designboard.net';
  const unauth=await worker.fetch(new Request('https://worker.example/api/apps/auctionhannun/session',{headers:{Origin:origin}}),env);
  assert.equal(unauth.status,401);
  const foreign=await worker.fetch(new Request('https://worker.example/api/apps/auctionhannun/session',{headers:{Origin:'https://evil.example'}}),env);
  assert.equal(foreign.status,403);
  const request=new Request('https://worker.example/api/apps/auctionhannun/session',{headers:{Origin:origin,Authorization:'Bearer '+random()}});
  const mockEnv={DB:{prepare:()=>({bind:()=>({first:async()=>({user_id:'sh_mock'})})})}};
  const response=await worker.fetch(request,mockEnv);
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{uid:'sh_mock',site:'auctionhannun'});
});
test('new registration and deletion default to locked',()=>{
  assert.equal(CONSENT_VERSION,'2026-11-11');
  assert.ok(ITEM_ID.test('favorite-locations'));
  assert.ok(!ITEM_ID.test('../secret'));
});
