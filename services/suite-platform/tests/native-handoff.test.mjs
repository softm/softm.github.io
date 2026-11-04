import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nativeReturnUrl,nativeReplyUrl} from '../../../account/native-handoff.mjs';
import {requireSite} from '../functions/security.mjs';
const registry=JSON.parse(readFileSync(new URL('../../../shared/platform/v1/registry.json',import.meta.url)));
const target={siteId:'gagyebu',origin:'https://appassets.androidplatform.net',transport:'android',requestId:'A'.repeat(43),challenge:'B'.repeat(43)};
test('native target uses a fixed registry return URL and binds the application origin',()=>{
 assert.equal(nativeReturnUrl(registry,target).href,'https://softm.github.io/account/android/gagyebu/');
 for(const change of [{siteId:'missing'},{origin:'https://evil.test'},{origin:'https://appassets.androidplatform.net.evil.test'},{transport:'web'},{requestId:'short'},{challenge:''}])assert.equal(nativeReturnUrl(registry,{...target,...change}),null);
 const forged={...target,returnUrl:'https://evil.test',redirect_uri:'https://evil.test'};
 assert.equal(nativeReturnUrl(registry,forged).origin,'https://softm.github.io');
});
test('replies carry only a short-lived code and request binding in the fragment',()=>{
 const u=new URL(nativeReplyUrl(registry,target,{code:'C'.repeat(43)}));
 assert.equal(u.search,'');assert.deepEqual([...new URLSearchParams(u.hash.slice(1)).keys()],['request','code']);
 assert.match(nativeReplyUrl(registry,target,{error:'cancelled'}),/error=cancelled/);
 assert.throws(()=>nativeReplyUrl(registry,target,{code:'bad'}));
});
test('server and browser registries agree; app origin cannot request another site token',()=>{
 const server=JSON.parse(readFileSync(new URL('../functions/registry.json',import.meta.url)));
 assert.deepEqual(server,registry);assert.equal(requireSite(server,'gagyebu',target.origin).name,'가계부');
 assert.throws(()=>requireSite(server,'weatherhannun',target.origin));
});
