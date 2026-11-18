import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCloudflareAccountClient} from '../src/client.mjs';
import {clientScript} from '../src/ui.mjs';

test('tojihannun Android exchanges a PKCE-bound one-time code',async()=>{
 const original={window:globalThis.window,location:globalThis.location,sessionStorage:globalThis.sessionStorage,fetch:globalThis.fetch};
 const mem=new Map();let captured=null,exchange=null;
 try{
  globalThis.location={origin:'https://tojihannun.designboard.net'};
  globalThis.sessionStorage={getItem:key=>mem.get(key)??null,setItem:(key,value)=>mem.set(key,value),removeItem:key=>mem.delete(key)};
  const host=new EventTarget();
  host.open=()=>{throw Error('Android에서 WebView OAuth 팝업을 열면 안 됩니다.');};
  host.TojihannunAndroid={
   startCloudflareLogin(url){
    captured=new URL(url);
    assert.equal(captured.searchParams.get('site'),'tojihannun');
    assert.equal(captured.searchParams.get('origin'),'https://tojihannun.designboard.net');
    const request=captured.searchParams.get('request');
    queueMicrotask(()=>host.dispatchEvent(new CustomEvent('tojihannun:auth-return',{detail:{request,code:'C'.repeat(43)}})));
    return true;
   },
   takeCloudflareLoginResult(){return '';}
  };
  globalThis.window=host;
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://softm-hannun-account.softm.workers.dev/api/connect/exchange');
   exchange=JSON.parse(options.body);
   return new Response(JSON.stringify({accessToken:'T'.repeat(43),uid:'toji_test',expiresIn:3600,displayName:'토지한눈 테스트',providers:['google']}),{status:200});
  };
  const client=createCloudflareAccountClient({baseUrl:'https://softm-hannun-account.softm.workers.dev',siteId:'tojihannun'});
  const next=await client.login();
  assert.equal(next.uid,'toji_test');
  assert.equal(exchange.site,'tojihannun');
  assert.equal(exchange.origin,'https://tojihannun.designboard.net');
  assert.equal(exchange.code,'C'.repeat(43));
  assert.match(exchange.verifier,/^[A-Za-z0-9_-]{43}$/);
  assert.equal(mem.size,1);
 }finally{
  for(const [key,value] of Object.entries(original)){
   if(value===undefined)delete globalThis[key];else globalThis[key]=value;
  }
 }
});

test('tojihannun native handoff contains no bearer token',()=>{
 assert.match(clientScript,/intent\.site==='tojihannun'/);
 assert.match(clientScript,/account\/android\/tojihannun\//);
 const source=readFileSync(new URL('../../../account/android/tojihannun/return.mjs',import.meta.url),'utf8');
 assert.match(source,/tojihannun:\/\/auth\/callback/);
 assert.match(source,/history\.replaceState/);
 assert.doesNotMatch(source,/accessToken|Authorization/);
});
