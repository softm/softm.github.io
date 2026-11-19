import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCloudflareAccountClient} from '../src/client.mjs';
import {clientScript} from '../src/ui.mjs';

test('matjiphannun Android receives a PKCE-bound one-time code via external browser',async()=>{
 const original={window:globalThis.window,location:globalThis.location,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 const mem=new Map();let captured=null,exchange=null;
 try{
  globalThis.location={origin:'https://appassets.androidplatform.net'};
  globalThis.sessionStorage={getItem:key=>mem.get(key)??null,setItem:(key,value)=>mem.set(key,value),removeItem:key=>mem.delete(key)};
  const host=new EventTarget();
  host.open=()=>{throw Error('Embedded OAuth popup is forbidden in Android');};
  host.MatjipHannunAndroid={
   startCloudflareLogin(url){
    captured=new URL(url);
    assert.equal(captured.searchParams.get('site'),'matjiphannun');
    assert.equal(captured.searchParams.get('origin'),'https://appassets.androidplatform.net');
    const request=captured.searchParams.get('request');
    queueMicrotask(()=>host.dispatchEvent(new CustomEvent('matjiphannun:auth-return',{detail:{request,code:'C'.repeat(43)}})));
    return true;
   },
   takeCloudflareLoginResult(){return '';}
  };
  globalThis.window=host;
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://softm-hannun-account.softm.workers.dev/api/connect/exchange');
   exchange=JSON.parse(options.body);
   return new Response(JSON.stringify({accessToken:'T'.repeat(43),uid:'matjip_test',expiresIn:3600,displayName:'맛집한눈 테스트',providers:['google']}),{status:200});
  };
  const client=createCloudflareAccountClient({baseUrl:'https://softm-hannun-account.softm.workers.dev',siteId:'matjiphannun'});
  const next=await client.login();
  assert.equal(next.uid,'matjip_test');
  assert.equal(exchange.site,'matjiphannun');
  assert.equal(exchange.origin,'https://appassets.androidplatform.net');
  assert.equal(exchange.code,'C'.repeat(43));
  assert.match(exchange.verifier,/^[A-Za-z0-9_-]{43}$/);
 }finally{
  for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
 }
});

test('native return route is matjiphannun-only and never leaks tokens into history',()=>{
 assert.match(clientScript,/intent\.site==='matjiphannun'/);
 assert.match(clientScript,/account\/android\/matjiphannun\//);
 const source=readFileSync(new URL('../../../account/android/matjiphannun/return.mjs',import.meta.url),'utf8');
 assert.match(source,/matjiphannun:\/\/auth\/callback/);
 assert.match(source,/history\.replaceState/);
 assert.doesNotMatch(source,/accessToken|Authorization/);
});
