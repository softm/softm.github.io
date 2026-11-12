import test from 'node:test';
import assert from 'node:assert/strict';
import {random} from '../src/crypto.mjs';
import worker from '../src/index.mjs';
import {clientScript} from '../src/ui.mjs';

function environment(){
 return {DB:{prepare(){return {bind(){return {run:async()=>({meta:{changes:1}})}}};}},PUBLIC_BASE_URL:'https://softm-hannun-account.softm.workers.dev'};
}
test('Android gagyebu PKCE browser flow permits only the fixed native asset origin',async()=>{
 const query=new URLSearchParams({site:'gagyebu',origin:'https://appassets.androidplatform.net',challenge:random(),request:random()});
 const url='https://softm-hannun-account.softm.workers.dev/connect?';
 const good=await worker.fetch(new Request(url+query),environment());
 assert.equal(good.status,303);
 assert.equal(good.headers.get('location'),'/connect');
 query.set('origin','https://appassets.attacker.example');
 const bad=await worker.fetch(new Request(url+query),environment());
 assert.equal(bad.status,403);
 query.set('origin','https://appassets.androidplatform.net');
 query.set('site','calc');
 const wrongSite=await worker.fetch(new Request(url+query),environment());
 assert.equal(wrongSite.status,403);
});
test('native handoff is never a dynamic caller-controlled redirect',()=>{
 assert.match(clientScript,/intent\.origin==='https:\/\/appassets\.androidplatform\.net'/);
 assert.match(clientScript,/intent\.site==='gagyebu'/);
 assert.match(clientScript,/https:\/\/softm\.github\.io\/account\/android\/gagyebu\//);
 assert.match(clientScript,/returnUrl\.hash=new URLSearchParams/);
 assert.match(clientScript,/location\.replace\(returnUrl\.href\)/);
 assert.match(clientScript,/window\.opener\.postMessage/);
});
