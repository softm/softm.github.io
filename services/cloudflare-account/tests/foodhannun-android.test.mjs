import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCloudflareAccountClient} from '../src/client.mjs';
import {clientScript} from '../src/ui.mjs';

test('foodhannun Android receives a PKCE-bound one-time code via external browser',async()=>{
 const original={window:globalThis.window,location:globalThis.location,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 const mem=new Map();let captured=null,exchange=null;
 try{
  globalThis.location={origin:'https://softm.github.io'};
  globalThis.sessionStorage={getItem:key=>mem.get(key)??null,setItem:(key,value)=>mem.set(key,value),removeItem:key=>mem.delete(key)};
  const host=new EventTarget();
  host.open=()=>{throw Error('Embedded OAuth popup is forbidden in Android');};
  host.FoodHannunAndroid={
   startCloudflareLogin(url){
    captured=new URL(url);
    assert.equal(captured.searchParams.get('site'),'foodhannun');
    assert.equal(captured.searchParams.get('origin'),'https://softm.github.io');
    const request=captured.searchParams.get('request');
    queueMicrotask(()=>host.dispatchEvent(new CustomEvent('foodhannun:auth-return',{detail:{request,code:'C'.repeat(43)}})));
    return true;
   },
   takeCloudflareLoginResult(){return '';}
  };
  globalThis.window=host;
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://softm-hannun-account.softm.workers.dev/api/connect/exchange');
   exchange=JSON.parse(options.body);
   return new Response(JSON.stringify({accessToken:'T'.repeat(43),uid:'food_test',expiresIn:3600,displayName:'음식한눈 테스트',
     providers:['google']}),{status:200});
  };
  const client=createCloudflareAccountClient({baseUrl:'https://softm-hannun-account.softm.workers.dev',siteId:'foodhannun'});
  const next=await client.login();
  assert.equal(next.uid,'food_test');
  assert.equal(client.currentUser.uid,'food_test');
  assert.equal(exchange.site,'foodhannun');
  assert.equal(exchange.origin,'https://softm.github.io');
  assert.equal(exchange.code,'C'.repeat(43));
  assert.match(exchange.verifier,/^[A-Za-z0-9_-]{43}$/);
  assert.equal(mem.size,1);
 }finally{
  for(const [key,value] of Object.entries(original)){
    if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }
});

test('native return route is foodhannun-only and never leaks tokens into history',()=>{
 assert.match(clientScript,/intent\.site==='foodhannun'/);
 assert.match(clientScript,/account\/android\/foodhannun\//);
 assert.match(clientScript,/window\.opener\.postMessage/);
 const source=readFileSync(new URL('../../../account/android/foodhannun/return.mjs',import.meta.url),'utf8');
 assert.match(source,/foodhannun:\/\/auth\/callback/);
 assert.match(source,/history\.replaceState/);
 assert.doesNotMatch(source,/accessToken|Authorization/);
});
