import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createCloudflareAccountClient} from '../src/client.mjs';

test('Cloudflare login uses supplied site-menu popup and retains a display-only profile',async()=>{
  const seen={opened:0,urls:[],requests:[],listeners:new Map()};
  const previous={window:globalThis.window,location:globalThis.location,sessionStorage:globalThis.sessionStorage,crypto:globalThis.crypto,fetch:globalThis.fetch};
  const originalCrypto=Object.getOwnPropertyDescriptor(globalThis,'crypto');
  const stored=new Map();
  const popup={closed:false,close(){this.closed=true;},location:{assign(url){
    seen.urls.push(url);
    const requestId=new URL(url).searchParams.get('request');
    queueMicrotask(()=>seen.listeners.get('message')?.({
      origin:'https://softm-hannun-account.softm.workers.dev',
      source:popup,data:{type:'softm:authorization',requestId,code:'A'.repeat(43)}
    }));
  }}};
  try{
    Object.assign(globalThis,{
      location:{origin:'https://softm.github.io'},
      sessionStorage:{getItem:key=>stored.get(key)||null,setItem:(key,val)=>stored.set(key,val),removeItem:key=>stored.delete(key)},
      window:{
        open(){seen.opened++;return popup;},
        addEventListener:(type,fn)=>seen.listeners.set(type,fn),
        removeEventListener:type=>seen.listeners.delete(type)
      },
      fetch:async(url,opts)=>{
        seen.requests.push({url:String(url),opts});
        return {ok:true,json:async()=>({accessToken:'T'.repeat(43),uid:'cloudflare-test-uid',
          expiresIn:3600,displayName:'테스트 회원',photoURL:'https://example.com/profile.png',providers:['google']})};
      }
    });
    Object.defineProperty(globalThis,'crypto',{value:webcrypto,writable:true,configurable:true});
    const client=createCloudflareAccountClient({
      baseUrl:'https://softm-hannun-account.softm.workers.dev',siteId:'weatherhannun'
    });
    const result=await client.login({popup,mode:'login'});
    assert.equal(seen.opened,0,'a supplied popup must not trigger a second window');
    assert.equal(seen.urls.length,1);
    const target=new URL(seen.urls[0]);
    assert.equal(target.pathname,'/connect');
    assert.equal(target.searchParams.get('site'),'weatherhannun');
    assert.equal(target.searchParams.get('origin'),'https://softm.github.io');
    assert.equal(seen.requests.length,1);
    assert.equal(seen.requests[0].url,'https://softm-hannun-account.softm.workers.dev/api/connect/exchange');
    assert.equal(result.uid,'cloudflare-test-uid');
    assert.equal(client.currentUser.displayName,'테스트 회원');
    assert.equal(client.currentUser.providerData[0].providerId,'google.com');
    assert.equal(popup.closed,true);
    assert.equal(stored.size,1);
    assert.doesNotMatch(JSON.stringify([...stored]),/AIza|firebase/i);
  }finally{
    if(originalCrypto)Object.defineProperty(globalThis,'crypto',originalCrypto);
    else delete globalThis.crypto;
    for(const [name,value] of Object.entries(previous)){
      if(name==='crypto')continue;
      if(value===undefined)delete globalThis[name];
      else globalThis[name]=value;
    }
  }
});
