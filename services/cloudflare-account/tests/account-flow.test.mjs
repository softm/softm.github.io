import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {clientScript} from '../src/ui.mjs';

function harness({consented=true}={}){
 const dom=new Map();
 const element=id=>{
   if(!dom.has(id))dom.set(id,{
     hidden:true,textContent:'',checked:false,disabled:false,src:'',
     handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},
     replaceChildren(){},append(){},setAttribute(){}
   });
   return dom.get(id);
 };
 const sent=[];const calls=[];
 let consentVersion=consented?'2026-11-11':null;
 const response=(body,status=200)=>({ok:status<400,status,json:async()=>body});
 const fetch=async (url,init={})=>{
   calls.push({url,method:init.method||'GET'});
   if(url==='/api/connect/info')return response({site:'gagyebu',name:'가계부',origin:'https://softm.github.io'});
   if(url==='/health')return response({ok:true,registrationLocked:false,providers:{google:true,kakao:false,naver:false}});
   if(url==='/api/me')return response({user:{id:'u-test',name:'Tester',avatar:'',providers:['google'],consentVersion},naverPublic:false,deletionEnabled:false});
   if(url==='/api/consent'){consentVersion='2026-11-11';return response({ok:true});}
   if(url==='/api/connect/authorize')return response({code:'one-time-code',request:'request-123',origin:'https://softm.github.io'});
   return response({error:'not-found'},404);
 };
 const doc={querySelector:id=>element(id),querySelectorAll:()=>[]};
 const opener={closed:false,postMessage:(msg,origin)=>sent.push({msg,origin})};
 const window={opener,close(){},};
 const location={pathname:'/connect',search:'',assign(){}};
 const context={document:doc,window,location,fetch,console,Image:class{},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},URLSearchParams};
 vm.runInNewContext(clientScript,context,{timeout:1500});
 const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
 return {element,flush,sent,calls};
}

test('existing member auto-handoffs once to registered origin without displaying profile or approval button',async()=>{
 const x=harness();
 await x.flush();
 assert.equal(x.element('#profile').hidden,true);
 assert.equal(x.element('#terms').hidden,true);
 assert.equal(x.element('#connect').hidden,false);
 assert.equal(x.element('#connect-button').hidden,true);
 assert.equal(x.sent.length,1);
 assert.equal(x.sent[0].origin,'https://softm.github.io');
 assert.equal(x.sent[0].msg.type,'softm:authorization');
 assert.equal(x.sent[0].msg.requestId,'request-123');
 assert.equal(x.calls.filter(c=>c.url==='/api/connect/authorize').length,1);
});

test('new user sees consent first, then completes connection automatically',async()=>{
 const x=harness({consented:false});
 await x.flush();
 assert.equal(x.element('#terms').hidden,false);
 assert.equal(x.element('#connect').hidden,true);
 assert.equal(x.element('#profile').hidden,true);
 assert.equal(x.sent.length,0);
 x.element('#t1').checked=true;x.element('#t2').checked=true;
 await x.element('#accept').handlers.click();
 await x.flush();
 assert.equal(x.element('#terms').hidden,true);
 assert.equal(x.element('#connect').hidden,false);
 assert.equal(x.element('#profile').hidden,true);
 assert.equal(x.sent.length,1);
 assert.equal(x.calls.filter(c=>c.url==='/api/connect/authorize').length,1);
});

test('login connection does not silently handoff when browser opener is missing',async()=>{
 const src=clientScript;
 assert.match(src,/if\(!window\.opener\|\|window\.opener\.closed\)/);
 assert.match(src,/\$\('#connect-button'\)\.hidden=false/);
 assert.match(src,/autoConnecting\|\|connectionSent/);
});
