import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createCloudflareAccountClient} from '../src/client.mjs';
import {clientScript} from '../src/ui.mjs';

test('weather Android launches browser, exchanges a PKCE-bound code and never opens a WebView popup',async()=>{
 const original={window:globalThis.window,location:globalThis.location,
  sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch,crypto:globalThis.crypto};
 const mem=new Map();let captured=null,exchange=null;
 try{
  globalThis.crypto=webcrypto;
  globalThis.location={origin:'https://softm.github.io'};
  globalThis.sessionStorage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
  const window=new EventTarget();
  window.open=()=>{throw Error('WebView OAuth popup must never open');};
  window.WeatherHannunAndroid={
   startCloudflareLogin(href){
    captured=new URL(href);
    assert.equal(captured.searchParams.get('site'),'weatherhannun');
    assert.equal(captured.searchParams.get('origin'),'https://softm.github.io');
    const request=captured.searchParams.get('request');
    queueMicrotask(()=>window.dispatchEvent(new CustomEvent('weatherhannun:auth-return',
      {detail:{request,code:'C'.repeat(43)}})));
    return true;
   },
   takeCloudflareLoginResult(){return '';}
  };
  globalThis.window=window;
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://softm-hannun-account.softm.workers.dev/api/connect/exchange');
   exchange=JSON.parse(options.body);
   return new Response(JSON.stringify({accessToken:'T'.repeat(43),uid:'weather_test',
    expiresIn:3600,displayName:'테스트',providers:['google']}),{status:200});
  };
  const client=createCloudflareAccountClient({baseUrl:'https://softm-hannun-account.softm.workers.dev',siteId:'weatherhannun'});
  const user=await client.login();
  assert.equal(user.uid,'weather_test');
  assert.equal(client.currentUser.uid,'weather_test');
  assert.equal(exchange.origin,'https://softm.github.io');
  assert.equal(exchange.site,'weatherhannun');
  assert.equal(exchange.code,'C'.repeat(43));
  assert.match(exchange.verifier,/^[A-Za-z0-9_-]{43}$/);
  assert.equal(captured.searchParams.get('challenge')?.length,43);
  assert.equal(mem.size,1);
 }finally{Object.assign(globalThis,original);}
});
test('native handoff requires fixed weather site and does not change PC opener flow',()=>{
 assert.match(clientScript,/intent\.site==='weatherhannun'/);
 assert.match(clientScript,/account\/android\/weatherhannun\//);
 assert.match(clientScript,/!window\.opener/);
 assert.match(clientScript,/window\.opener\.postMessage/);
 const returnJs=readFileSync(new URL('../../../account/android/weatherhannun/return.mjs',import.meta.url),'utf8');
 assert.match(returnJs,/weatherhannun:\/\/auth\/callback/);
 assert.match(returnJs,/history\.replaceState/);
});
