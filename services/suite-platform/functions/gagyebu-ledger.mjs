// Server-only encrypted snapshot; both documents live inside the site's deletion scope.
import {randomBytes,randomUUID,createCipheriv,createDecipheriv,hkdfSync} from 'node:crypto';
const MAX=3*1024*1024, BLOCK=600000;
export async function ledgerExchange(db,uid,body,master,authTime){
 const root=Buffer.from(master||'','base64');if(root.length!==32)throw Error('ledger-key-unavailable');
 const key=Buffer.from(hkdfSync('sha256',root,Buffer.from(uid),Buffer.from('gagyebu-ledger-v1'),32));
 const dir=db.collection('users').doc(uid).collection('sites').doc('gagyebu').collection('privateLedger');
 const head=dir.doc('head');
 return db.runTransaction(async tx=>{
  const barrier=(await tx.get(db.collection('users').doc(uid).collection('privateSync').doc('gagyebu'))).data();
  const epoch=barrier?.epoch||null;
  if(barrier?.locked)throw Object.assign(Error('deletion-in-progress'),{status:409});
  if(barrier&&authTime<=barrier.cutoff)return {expired:true,epoch};
  const old=(await tx.get(head)).data(),revision=old?.revision||null;
  if(body.op==='read'){
   if(!old||body.known===revision)return {revision,epoch};
   const blocks=await tx.getAll(...Array.from({length:old.blocks},(_,i)=>dir.doc('b'+i)));
   const dec=createDecipheriv('aes-256-gcm',key,Buffer.from(old.iv,'base64'));
   dec.setAAD(Buffer.from(uid));dec.setAuthTag(Buffer.from(old.tag,'base64'));
   return {revision,epoch,ledger:JSON.parse(Buffer.concat([dec.update(Buffer.concat(blocks.map(x=>Buffer.from(x.data().data,'base64')))),dec.final()]).toString())};
  }
  if(body.op!=='write'||body.expected!==revision||(body.epoch||null)!==epoch)return {conflict:true,revision};
  const v=body.ledger;
  if(v?.version!==1||!['accounts','categories','transactions','events'].every(k=>Array.isArray(v[k])&&v[k].every(r=>typeof r?.id==='string')&&new Set(v[k].map(r=>r.id)).size===v[k].length)||!v.settings||!v.budgets)throw Object.assign(Error('invalid-ledger'),{status:400});
  if(v.transactions.some(t=>(t.status==='pending'&&String(t.source||'').startsWith('android-'))||['sourceText','sourceImportKey','attachment','attachmentPath','attachmentUploadId'].some(k=>k in t)))throw Object.assign(Error('device-private-data'),{status:400});
  const plain=Buffer.from(JSON.stringify(v));if(plain.length>MAX)throw Object.assign(Error('ledger-too-large'),{status:413});
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(uid));
  const data=Buffer.concat([cipher.update(plain),cipher.final()]),blocks=Math.ceil(data.length/BLOCK),next=randomUUID();
  for(let i=0;i<blocks;i++)tx.set(dir.doc('b'+i),{data:data.subarray(i*BLOCK,(i+1)*BLOCK).toString('base64')});
  for(let i=blocks;i<(old?.blocks||0);i++)tx.delete(dir.doc('b'+i));
  tx.set(head,{revision:next,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),blocks});return {revision:next};
 });
}
