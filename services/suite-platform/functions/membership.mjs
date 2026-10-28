export const MEMBERSHIP_VERSION='20261029-1';
export async function registerMembership({db,uid,displayName='',version,accepted,timestamp}) {
  if(version!==MEMBERSHIP_VERSION||accepted!==true){const error=Error('membership-consent-required');error.status=400;throw error;}
  await db.runTransaction(async tx=>{
    const member=db.collection('_suiteMemberships').doc(uid),user=db.collection('users').doc(uid);
    const [existing,userDoc,deletion]=await Promise.all([tx.get(member),tx.get(user),tx.get(db.collection('_suiteDeletions').doc(uid))]);
    if(deletion.exists){const error=Error('account-withdrawn');error.status=403;throw error;}
    if(!existing.exists)tx.create(member,{uid,version:MEMBERSHIP_VERSION,termsAccepted:true,privacyAcknowledged:true,acceptedAt:timestamp()});
    if(!userDoc.exists)tx.create(user,{uid,displayName:displayName.slice(0,80),version:1,createdAt:timestamp(),updatedAt:timestamp()});
  });
  return {registered:true,version:MEMBERSHIP_VERSION};
}

