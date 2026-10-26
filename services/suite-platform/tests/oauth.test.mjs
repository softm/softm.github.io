import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exchangeProviderToken,oauthFailureUrl} from '../functions/provider.mjs';
import {readOAuthReturn} from '../../../account/oauth-return.mjs';

const settings={token:'https://nid.naver.com/oauth2.0/token',client:()=> 'fixture-client',secret:()=> 'fixture-secret'};
const request={code:'fixture-code',state:'A'.repeat(43),redirectUri:'https://example.test/callback'};
const saved=JSON.stringify({state:request.state,verifier:'B'.repeat(43),targetQuery:'?site=wirohaeyo&request=test'});

test('provider exchange encodes the secret and code in a POST body, without putting them in the URL',async()=>{
  const token=await exchangeProviderToken('naver',settings,request,{fetchImpl:async(url,options)=>{
    assert.equal(url,settings.token);assert.equal(options.method,'POST');
    const body=new URLSearchParams(options.body);
    assert.equal(body.get('grant_type'),'authorization_code');assert.equal(body.get('client_secret'),'fixture-secret');
    assert.equal(body.get('code'),request.code);assert.equal(body.get('state'),request.state);
    assert.ok(options.signal);return new Response(JSON.stringify({access_token:'fixture-token',refresh_token:'fixture-refresh'}));
  },log:()=>assert.fail('successful exchange should not log')});
  assert.equal(token,'fixture-token');
});

test('HTTP errors and HTTP 200 OAuth errors retain only an allowlisted diagnostic',async()=>{
  for(const status of [200,401]){
    const logs=[];
    await assert.rejects(exchangeProviderToken('naver',settings,request,{fetchImpl:async()=>new Response(JSON.stringify({error:'invalid_client',error_description:'fixture-secret fixture-code',access_token:'leaked-token'}),{status}),log:(...args)=>logs.push(args)}),/provider-login-failed/);
    assert.deepEqual(logs,[['suite-provider-failure',{provider:'naver',stage:'token',code:'invalid_client',httpStatus:status}]]);
  }
});

test('unexpected response, parse failure and network failure never echo provider data',async()=>{
  for(const fetchImpl of [async()=>new Response(JSON.stringify({error:'secret-as-error',error_description:'private'})),async()=>new Response('private html',{status:502}),async()=>{throw Error('secret request');}]){
    const logs=[];await assert.rejects(exchangeProviderToken('naver',settings,request,{fetchImpl,log:(...args)=>logs.push(args)}));
    assert.ok(!JSON.stringify(logs).match(/secret|private/));assert.equal(logs.length,1);
  }
});

test('failed OAuth returns to the fixed hub and restores the original site request',()=>{
  const url=new URL(oauthFailureUrl('https://example.test/account/',request.state,Error('provider-already-linked')));
  assert.equal(url.origin,'https://example.test');assert.equal(url.pathname,'/account/');
  const result=readOAuthReturn(url.hash,saved);
  assert.match(result.errorMessage,/다른 계정/);assert.equal(result.targetQuery,'?site=wirohaeyo&request=test');
  assert.ok(!url.href.includes('fixture-secret'));
});

test('cancelled and unknown errors are fixed messages; missing or mismatched state is rejected',()=>{
  assert.match(readOAuthReturn('#oauth='+request.state+'&oauth-error=cancelled',saved).errorMessage,/취소/);
  assert.ok(!readOAuthReturn('#oauth='+request.state+'&oauth-error=private',saved).errorMessage.includes('private'));
  assert.equal(readOAuthReturn('#oauth='+request.state+'&oauth-error=toString',saved).errorMessage,readOAuthReturn('#oauth='+request.state+'&oauth-error=unknown',saved).errorMessage);
  for(const value of [null,'{bad',JSON.stringify({state:'C'.repeat(43),verifier:'B'.repeat(43)})])assert.throws(()=>readOAuthReturn('#oauth='+request.state,value),/일치하지/);
  assert.equal(readOAuthReturn('',saved),null);
});
