// Run only against local Auth and Firestore emulators; never use an operator account.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const req=createRequire(new URL('../functions/package.json',import.meta.url));
assert.equal(process.env.GCLOUD_PROJECT,'demo-softm-suite');
for(const key of ['FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST'])assert.match(process.env[key]||'',/^(localhost|127\.0\.0\.1):\d+$/);
const {suiteAuth}=await import('../functions/index.mjs');
const db=req('firebase-admin/firestore').getFirestore('suite-v1'),app=req('express')();
app.use(req('express').json());app.use(suiteAuth);const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
try{
 const email='vault-'+Date.now()+'@example.test',password='test-only-abcdef';
 const signin=async method=>{const res=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:'+method+'?key=test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});assert.equal(res.status,200);return res.json();};
 const {idToken,localId:uid}=await signin('signUp');
 const root=db.doc('users/'+uid+'/sites/gagyebu'),chunk=root.collection('backups').doc('test').collection('chunks').doc('one'),other=db.doc('users/'+uid+'/sites/weatherhannun'),another=db.doc('users/another/sites/gagyebu');
 await Promise.all([root,chunk,other,another].map(r=>r.set({fixture:true})));
 const remove=async(expectedUid,confirm)=>fetch('http://127.0.0.1:'+server.address().port+'/gagyebu/vault/delete',{method:'POST',headers:{Origin:'https://softm.github.io',Authorization:'Bearer '+idToken,'Content-Type':'application/json'},body:JSON.stringify({expectedUid,confirm})});
 assert.equal((await remove('another','내 보관소 삭제')).status,403);
 assert.equal((await remove(uid,'')).status,403);assert((await chunk.get()).exists);
 const deleted=await remove(uid,'내 보관소 삭제');assert.equal(deleted.status,200);assert.deepEqual(await deleted.json(),{deleted:true});
 assert.equal((await signin('signInWithPassword')).localId,uid);
 assert(!(await root.get()).exists&&!(await chunk.get()).exists);assert((await other.get()).exists&&(await another.get()).exists);
 console.log('PASS: verified identity and confirmation; nested backup deleted, re-login did not restore it, other site and user retained.');
}finally{server.close();await db.terminate();}
