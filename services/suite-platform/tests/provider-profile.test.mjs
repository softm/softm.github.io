import test from 'node:test';import assert from 'node:assert/strict';
import {providerProfile,syncProviderProfile} from '../functions/provider-profile.mjs';
test('Kakao reads allowed fields and upgrades its legacy CDN',()=>{
 assert.deepEqual(providerProfile('kakao',{kakao_account:{profile:{nickname:' 내 이름 ',profile_image_url:'http://k.kakaocdn.net/profile.png'}}}),{displayName:'내 이름',photoURL:'https://k.kakaocdn.net/profile.png'});
 assert.deepEqual(providerProfile('kakao',{properties:{nickname:'이름',thumbnail_image:'https://k.kakaocdn.net/a'}}),{displayName:'이름',photoURL:'https://k.kakaocdn.net/a'});
});
test('Naver reads its profile and never returns email, tokens or ID',()=>{
 assert.deepEqual(providerProfile('naver',{response:{nickname:'별명',profile_image:'https://phinf.pstatic.net/a',email:'private@example.test',id:'private-id',access_token:'secret'}}),{displayName:'별명',photoURL:'https://phinf.pstatic.net/a'});
});
test('Missing consent and unsafe image values are harmless',()=>{
 assert.deepEqual(providerProfile('kakao',{}),{displayName:'',photoURL:''});
 for(const profile_image of ['javascript:alert(1)','data:image/svg+xml,test','http://evil.test/a','https://user:pass@evil.test/a','http://kakaocdn.net.evil.test/a'])assert.equal(providerProfile('naver',{response:{profile_image}}).photoURL,'');
 assert.equal(providerProfile('naver',{response:{name:'a\u0000b'}}).displayName,'ab');
 assert.equal(providerProfile('naver',{response:{name:'x'.repeat(200)}}).displayName.length,128);
});
test('Updates only the authenticated UID and clears stale images',async()=>{
 const calls=[];const auth={getUser:async uid=>{assert.equal(uid,'known-uid');return{displayName:'old',photoURL:'https://example.test/old'};},updateUser:async(...args)=>calls.push(args)};
 await syncProviderProfile(auth,'known-uid','naver',{response:{nickname:'new'}});
 assert.deepEqual(calls,[['known-uid',{displayName:'new',photoURL:null}]]);
});
test('Linking preserves the existing canonical profile',async()=>{
 const auth={getUser:async()=>({displayName:'Google name',photoURL:'https://example.test/google'}),updateUser:async()=>assert.fail('must not overwrite')};
 assert.deepEqual(await syncProviderProfile(auth,'known-uid','kakao',{kakao_account:{profile:{nickname:'Kakao name',profile_image_url:'https://example.test/kakao'}}},{linking:true}),[]);
});
test('Linking fills missing fields only',async()=>{
 const calls=[];const auth={getUser:async()=>({displayName:'existing'}),updateUser:async(...args)=>calls.push(args)};
 await syncProviderProfile(auth,'known-uid','naver',{response:{nickname:'new',profile_image:'https://phinf.pstatic.net/a'}},{linking:true});
 assert.deepEqual(calls,[['known-uid',{photoURL:'https://phinf.pstatic.net/a'}]]);
});
