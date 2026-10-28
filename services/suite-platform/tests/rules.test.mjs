import assert from 'node:assert/strict';
import {test,before,after,beforeEach} from 'node:test';import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,updateDoc,getDoc,getDocs,collection,query,orderBy,limit,deleteDoc,serverTimestamp,Timestamp} from 'firebase/firestore';
let env;const path='users/alice/sites/wirohaeyo';
const ctx=(uid='alice',site='wirohaeyo')=>env.authenticatedContext(uid,{suite_site:site,firebase:{sign_in_provider:'custom'}}).firestore();
const site=()=>({uid:'alice',siteId:'wirohaeyo',version:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
const item=()=>({...site(),encoding:'encrypted',payload:'ciphertext',revision:1});
const backup=()=>({...site(),format:'encrypted-json',checksum:'a'.repeat(64),totalChars:20,chunkCount:1,state:'uploading'});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-softm-suite',firestore:{host:'127.0.0.1',port:8088,rules:readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});});
beforeEach(async()=>{await env.clearFirestore();});after(async()=>{await env.cleanup();});
test('unauthenticated and anonymous users cannot list or read private data',async()=>{for(const db of [env.unauthenticatedContext().firestore(),env.authenticatedContext('alice',{firebase:{sign_in_provider:'anonymous'}}).firestore()]){await assertFails(getDoc(doc(db,path)));await assertFails(getDocs(collection(db,'users')));}});
test('owner creates own site; other user and other site cannot read/write payload',async()=>{const db=ctx();await assertSucceeds(setDoc(doc(db,path),site()));await assertSucceeds(setDoc(doc(db,path+'/items/a'),item()));for(const db2 of [ctx('bob'),ctx('alice','calc')]){await assertFails(getDoc(doc(db2,path+'/items/a')));await assertFails(setDoc(doc(db2,path+'/items/b'),item()));await assertFails(deleteDoc(doc(db2,path+'/items/a')));}});
test('hub can list membership metadata but not site content',async()=>{const db=ctx();await setDoc(doc(db,path),site());await setDoc(doc(db,path+'/items/a'),item());const hub=env.authenticatedContext('alice',{firebase:{sign_in_provider:'google.com'}}).firestore();await assertSucceeds(getDocs(collection(hub,'users/alice/sites')));await assertFails(getDoc(doc(hub,path+'/items/a')));});
test('orphan writes, ownership hijack and role escalation rejected',async()=>{const db=ctx();await assertFails(setDoc(doc(db,path+'/items/a'),item()));await assertFails(setDoc(doc(db,path),{...site(),uid:'bob'}));await assertFails(setDoc(doc(db,path),{...site(),role:'admin'}));await assertFails(setDoc(doc(db,'_suiteCodes/attack'),{uid:'alice'}));await setDoc(doc(db,path),site());await assertFails(setDoc(doc(db,path+'/items/a'),{...item(),siteId:'calc'}));});
test('all creates and updates enforce schema, lengths, timestamps and revisions',async()=>{const db=ctx(),ref=doc(db,path+'/items/a');await setDoc(doc(db,path),site());await assertFails(setDoc(ref,{...item(),payload:'x'.repeat(180001)}));await setDoc(ref,item());for(const update of [{uid:'bob'},{siteId:'calc'},{payload:123},{payload:'x'.repeat(180001)},{role:'admin'},{createdAt:Timestamp.fromMillis(1)},{revision:-1}])await assertFails(updateDoc(ref,{...update,updatedAt:serverTimestamp()}));await assertFails(setDoc(ref,{uid:'alice',updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(ref,{payload:'new-ciphertext',revision:2,updatedAt:serverTimestamp()}));await assertSucceeds(getDocs(query(collection(db,path+'/items'),orderBy('updatedAt','desc'),limit(30))));});
test('backup publishing is one-way; chunks immutable and scoped; corruption is detected client-side',async()=>{const db=ctx(),ref=doc(db,path+'/backups/a'),chunk=doc(db,path+'/backups/a/chunks/0');await setDoc(doc(db,path),site());await assertFails(setDoc(ref,{...backup(),state:'complete'}));await setDoc(ref,backup());const payload={uid:'alice',siteId:'wirohaeyo',index:0,payload:'encrypted'};await assertSucceeds(setDoc(chunk,payload));await assertFails(setDoc(doc(db,path+'/backups/a/chunks/1'),{...payload,index:1}));await assertFails(updateDoc(chunk,{payload:'changed'}));await assertFails(updateDoc(ref,{checksum:'b'.repeat(64),state:'complete',updatedAt:serverTimestamp()}));await assertSucceeds(updateDoc(ref,{state:'complete',updatedAt:serverTimestamp()}));await assertFails(updateDoc(ref,{state:'uploading',updatedAt:serverTimestamp()}));await assertFails(getDoc(doc(ctx('bob'),path+'/backups/a/chunks/0')));await assertSucceeds(getDocs(query(collection(db,path+'/backups'),orderBy('createdAt','desc'),limit(20))));await assertFails(deleteDoc(doc(db,path)));});


test('withdrawal marker blocks old owner tokens for every private operation and is server-only',async()=>{
 const db=ctx(),ref=doc(db,path+'/items/a');await setDoc(doc(db,path),site());await setDoc(ref,item());
 await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),'_suiteDeletions/alice'),{state:'pending'}));
 await assertFails(getDoc(ref));await assertFails(getDocs(collection(db,path+'/items')));await assertFails(getDocs(collection(db,'users/alice/sites')));
 await assertFails(setDoc(doc(db,path+'/items/b'),item()));await assertFails(updateDoc(ref,{payload:'new',revision:2,updatedAt:serverTimestamp()}));await assertFails(deleteDoc(ref));
 await assertFails(setDoc(doc(db,'users/alice'),{uid:'alice',displayName:'a',version:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
 await assertFails(getDoc(doc(db,'_suiteDeletions/alice')));await assertFails(deleteDoc(doc(db,'_suiteDeletions/alice')));await assertFails(setDoc(doc(db,'_suiteDeletions/bob'),{state:'complete'}));
 const bob=ctx('bob','calc');await assertSucceeds(setDoc(doc(bob,'users/bob/sites/calc'),{uid:'bob',siteId:'calc',version:1,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
});

test('real recursive worker removes only the synthetic member and all backup descendants; retry resumes safely',async()=>{
 const {createRequire}=await import('node:module'),require=createRequire(new URL('../functions/package.json',import.meta.url));
 const {initializeApp,getApps}=require('firebase-admin/app'),{getFirestore,Timestamp:AdminTimestamp}=require('firebase-admin/firestore');
 const adminApp=getApps().find(app=>app.name==='withdrawal-test')||initializeApp({projectId:'demo-softm-suite'},'withdrawal-test'),db=getFirestore(adminApp);
 const {requestWithdrawal,withdrawalStatus,processWithdrawal,assertAccountActive}=await import('../functions/withdrawal.mjs');
 const uid='withdraw-fixture',receipt='r'.repeat(43),time=()=>AdminTimestamp.now(),expires=ms=>AdminTimestamp.fromMillis(Date.now()+ms);
 const seed=db.batch();for(const [path,value]of [
  ['users/'+uid,{uid}],['users/'+uid+'/sites/goldsignal/items/a',{payload:'synthetic'}],
  ['users/'+uid+'/sites/goldsignal/backups/b/chunks/0',{payload:'synthetic-cipher'}],
  ['_suiteMemberships/'+uid,{uid}],['_suiteIdentities/test-withdraw',{uid}],['_suiteCodes/test-withdraw',{uid}],
  ['_suiteOAuth/test-withdraw',{uid}],['_suiteOAuth/test-link',{linkUid:uid}],['users/untouched',{uid:'untouched'}],['_suiteIdentities/untouched',{uid:'untouched'}]
 ])seed.set(db.doc(path),value);await seed.commit();
 const args={db,uid,body:{uid,receipt,acknowledged:true,confirmation:'회원탈퇴'},timestamp:time,expires};
 await requestWithdrawal(args);await requestWithdrawal(args);
 await assert.rejects(assertAccountActive(db,uid),{message:'account-withdrawn'});
 await assert.rejects(withdrawalStatus({db,uid,receipt:'s'.repeat(43)}),{message:'withdrawal-receipt-invalid'});
 assert.equal((await withdrawalStatus({db,uid,receipt})).state,'processing');
 assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST,'Authentication emulator is mandatory; never use production auth');
 const {getAuth}=require('firebase-admin/auth'),realAuth=getAuth(adminApp);
 try{await realAuth.deleteUser(uid);}catch(error){if(error.code!=='auth/user-not-found')throw error;}
 await realAuth.createUser({uid});
 const calls=[];let failDelete=true;const auth={updateUser:async(id,value)=>{assert.equal(id,uid);assert.deepEqual(value,{disabled:true});calls.push('disable');await realAuth.updateUser(id,value);},revokeRefreshTokens:async id=>{assert.equal(id,uid);calls.push('revoke');await realAuth.revokeRefreshTokens(id);},deleteUser:async id=>{assert.equal(id,uid);calls.push('delete');if(failDelete)throw Error('synthetic transient failure');await realAuth.deleteUser(id);}};
 await assert.rejects(processWithdrawal({db,auth,uid,timestamp:time,expires}),{message:'withdrawal-retry-required'});
 assert.equal((await withdrawalStatus({db,uid,receipt})).state,'retrying');assert.equal((await realAuth.getUser(uid)).disabled,true);
 failDelete=false;await processWithdrawal({db,auth,uid,timestamp:time,expires});
 assert.equal((await withdrawalStatus({db,uid,receipt})).state,'complete');
 for(const path of ['users/'+uid,'users/'+uid+'/sites/goldsignal/items/a','users/'+uid+'/sites/goldsignal/backups/b/chunks/0','_suiteMemberships/'+uid,'_suiteIdentities/test-withdraw','_suiteCodes/test-withdraw','_suiteOAuth/test-withdraw','_suiteOAuth/test-link'])assert.equal((await db.doc(path).get()).exists,false,path);
 assert.equal((await db.doc('users/untouched').get()).exists,true);assert.equal((await db.doc('_suiteIdentities/untouched').get()).exists,true);
 await assert.rejects(realAuth.getUser(uid),{code:'auth/user-not-found'});
 const count=calls.length;await processWithdrawal({db,auth,uid,timestamp:time,expires});assert.equal(calls.length,count);
 assert.ok((await db.doc('_suiteDeletions/'+uid).get()).data().purgeAfter.toMillis()>Date.now());
});
