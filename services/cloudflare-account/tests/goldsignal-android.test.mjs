import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCloudflareAccountClient} from '../src/client.mjs';
import {clientScript} from '../src/ui.mjs';

test('GoldSignal Android launches system browser and exchanges a PKCE-bound one-time code',async()=>{
 const original={window:globalThis.window,location:globalThis.location,
  sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 const mem=new Map();let captured=null,exchange=null;
 try{
  globalThis.location={origin:'https://goldsignal.designboard.net'};
  globalThis.sessionStorage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
  const window=new EventTarget();
  window.open=()=>{throw Error('WebView OAuth popup must never open');};
  window.GoldSignalAndroid={
   startCloudflareLogin(href){
    captured=new URL(href);
    assert.equal(captured.searchParams.get('site'),'goldsignal');
    assert.equal(captured.searchParams.get('origin'),'https://goldsignal.designboard.net');
    const request=captured.searchParams.get('request');
    queueMicrotask(()=>window.dispatchEvent(new CustomEvent('goldsignal:auth-return',
      {detail:{request,code:'G'.repeat(43)}})));
    return true;
   },
   takeCloudflareLoginResult(){return '';}
  };
  globalThis.window=window;
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://softm-hannun-account.softm.workers.dev/api/connect/exchange');
   exchange=JSON.parse(options.body);
   return new Response(JSON.stringify({accessToken:'T'.repeat(43),uid:'goldsignal_test',
    expiresIn:3600,displayName:'테스트',providers:['google']}),{status:200});
  };
  const client=createCloudflareAccountClient({baseUrl:'https://softm-hannun-account.softm.workers.dev',siteId:'goldsignal'});
  const user=await client.login();
  assert.equal(user.uid,'goldsignal_test');
  assert.equal(client.currentUser.uid,'goldsignal_test');
  assert.equal(exchange.origin,'https://goldsignal.designboard.net');
  assert.equal(exchange.site,'goldsignal');
  assert.equal(exchange.code,'G'.repeat(43));
  assert.match(exchange.verifier,/^[A-Za-z0-9_-]{43}$/);
  assert.equal(captured.searchParams.get('challenge')?.length,43);
  assert.equal(mem.size,1);
 }finally{for(const [name,value] of Object.entries(original)){
  if(value===undefined)delete globalThis[name];else globalThis[name]=value;
 }}
});

test('GoldSignal native handoff returns only the one-time code to the app',()=>{
 assert.match(clientScript,/intent\.site==='goldsignal'/);
 assert.match(clientScript,/intent\.origin==='https:\/\/goldsignal\.designboard\.net'/);
 assert.match(clientScript,/account\/android\/goldsignal\//);
 assert.match(clientScript,/window\.opener\.postMessage/);
 const returnJs=readFileSync(new URL('../../../account/android/goldsignal/return.mjs',import.meta.url),'utf8');
 assert.match(returnJs,/goldsignal:\/\/auth\/callback/);
 assert.match(returnJs,/history\.replaceState/);
 assert.doesNotMatch(returnJs,/accessToken|bearer/i);
});
