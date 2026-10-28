import {hash,validProof,fail} from './security.mjs';
export const WITHDRAW_CONFIRMATION='회원탈퇴';
export async function assertAccountActive(db,uid){if((await db.collection('_suiteDeletions').doc(uid).get()).exists)fail('account-withdrawn',403);}
export async function requestWithdrawal({db,uid,body,timestamp,expires}){
  if(body.uid!==uid||body.confirmation!==WITHDRAW_CONFIRMATION||body.acknowledged!==true||!validProof(body.receipt))fail('withdrawal-confirmation-required',400);
  const ref=db.collection('_suiteDeletions').doc(uid),receiptHash=hash(body.receipt);
  await db.runTransaction(async tx=>{const old=await tx.get(ref);
    if(old.exists){if(old.data().receiptHash!==receiptHash)fail('withdrawal-in-progress',409);return;}
    tx.create(ref,{state:'pending',receiptHash,requestedAt:timestamp(),receiptExpiresAt:expires(86400000)});
  });
  return {accepted:true,state:'pending'};
}
export async function withdrawalStatus({db,uid,receipt,now=Date.now()}){
  if(typeof uid!=='string'||!uid||uid.length>128||uid.includes('/')||!validProof(receipt))fail('withdrawal-receipt-invalid',404);
  const snap=await db.collection('_suiteDeletions').doc(uid).get(),job=snap.data();
  if(!job||job.receiptHash!==hash(receipt)||job.receiptExpiresAt.toMillis()<now)fail('withdrawal-receipt-invalid',404);
  return {state:job.state==='complete'?'complete':job.state==='retrying'?'retrying':'processing'};
}
async function deleteMatches(db,collection,field,uid){
  for(;;){const page=await db.collection(collection).where(field,'==',uid).limit(200).get();if(page.empty)return;const batch=db.batch();for(const doc of page.docs)batch.delete(doc.ref);await batch.commit();}
}
async function authIfExists(work){try{await work();}catch(error){if(error.code!=='auth/user-not-found')throw error;}}
export async function processWithdrawal({db,auth,uid,timestamp,expires}){
  // The trusted event path is the only target. No client-supplied recursive path is used.
  if(typeof uid!=='string'||!uid||uid.includes('/'))throw Error('invalid-withdrawal-target');
  const ref=db.collection('_suiteDeletions').doc(uid),job=await ref.get();
  if(!job.exists||job.data().state==='complete')return;
  try{
    await ref.update({state:'processing'});
    await authIfExists(()=>auth.updateUser(uid,{disabled:true}));
    await authIfExists(()=>auth.revokeRefreshTokens(uid));
    // Delete issued login tickets before clearing provider mappings and all descendants.
    for(const [collection,field]of [['_suiteCodes','uid'],['_suiteOAuth','uid'],['_suiteOAuth','linkUid']])await deleteMatches(db,collection,field,uid);
    await db.recursiveDelete(db.collection('users').doc(uid));
    await db.collection('_suiteMemberships').doc(uid).delete();
    await deleteMatches(db,'_suiteIdentities','uid',uid);
    await authIfExists(()=>auth.deleteUser(uid));
    // A short-lived tombstone blocks old ID tokens; no record payload/profile is retained.
    await ref.update({state:'complete',completedAt:timestamp(),purgeAfter:expires(172800000)});
  }catch(error){await db.runTransaction(async tx=>{const current=await tx.get(ref);if(current.exists&&current.data().state!=='complete')tx.update(ref,{state:'retrying'});}).catch(()=>{});throw Error('withdrawal-retry-required');}
}
