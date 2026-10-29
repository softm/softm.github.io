import test from 'node:test';
import assert from 'node:assert/strict';
import {safeProfileImage,accountPresentation} from '../../../shared/platform/v1/account-menu.mjs';
test('only safe HTTPS images, with legacy Kakao upgrade',()=>{
 for(const v of [null,undefined,{},'','javascript:alert(1)','data:image/svg+xml,test','//evil.test/a','http://evil.test/a','https://a:b@example.com/a'])assert.equal(safeProfileImage(v),'');
 assert.equal(safeProfileImage('http://k.kakaocdn.net/a.png'),'https://k.kakaocdn.net/a.png');
 assert.equal(safeProfileImage('https://lh3.googleusercontent.com/a'),'https://lh3.googleusercontent.com/a');
 assert.equal(safeProfileImage('http://kakaocdn.net.evil.test/a'),'');
});
test('guest and anonymous sessions never present as members',()=>{
 for(const u of [null,{}, {uid:'anonymous',isAnonymous:true,photoURL:'https://example.com/a'}]){const v=accountPresentation(u);assert.equal(v.signedIn,false);assert.equal(v.photoURL,'');}
});
test('uses actual Firebase/provider image and safe fallback',()=>{
 const v=accountPresentation({uid:'u',displayName:'검사 회원',photoURL:'https://example.com/profile.png',providerData:[{providerId:'google.com'}]});
 assert.equal(v.photoURL,'https://example.com/profile.png');assert.equal(v.initial,'검');assert.equal(v.subtitle,'Google · 로그인됨');
 const fallback=accountPresentation({uid:'u',providerData:[{providerId:'google.com',displayName:'테스트',photoURL:'https://example.com/provider.png'}]});
 assert.equal(fallback.displayName,'테스트');assert.equal(fallback.photoURL,'https://example.com/provider.png');
 assert.equal(accountPresentation({uid:'u',displayName:'   '}).displayName,'내 계정');
 assert.equal(accountPresentation({uid:'u',photoURL:'javascript:alert(1)'}).photoURL,'');
});
