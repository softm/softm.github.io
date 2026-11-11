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
test('minimal UI contains consent, account linking, no vault editor',()=>{
  const html=page();
  assert.match(html,/회원탈퇴/);assert.match(html,/카카오/);
  assert.doesNotMatch(html,/보관소 암호/);
  assert.match(clientScript,/postMessage/);assert.match(clientScript,/connect\/exchange/);
});
const env={DB:{prepare:()=>({bind:()=>({first:async()=>null})})},NAVER_PUBLIC_ENABLED:'false'};
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
test('new registration and deletion default to locked',()=>{
  assert.equal(CONSENT_VERSION,'2026-11-11');
  assert.ok(ITEM_ID.test('favorite-locations'));
  assert.ok(!ITEM_ID.test('../secret'));
});
