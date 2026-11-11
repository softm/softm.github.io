#!/usr/bin/env node
// Offline importer: accepts a user-provided, trusted Firebase Auth / Firestore
// export projection. Never logs raw provider subjects or credentials.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2);
const at=name=>args[args.indexOf(name)+1];
const input=at('--input'),output=at('--output'),emit=args.includes('--emit');
if(!input||!output||!input.endsWith('.json')||!output.endsWith('.sql')){
  console.error('Usage: node scripts/prepare-migration.mjs --input legacy.secret.json --output migration-private.sql [--emit]');
  process.exit(2);
}
const data=JSON.parse(readFileSync(input,'utf8'));
if(!Array.isArray(data.users))throw Error('Expected {users:[...]}');
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const hash=value=>createHash('sha256').update(value).digest('hex');
const now=Math.floor(Date.now()/1000),uidSeen=new Set(),identitySeen=new Set();
const statements=['PRAGMA foreign_keys=ON;'];
let accounts=0,identities=0;
for(const u of data.users){
  if(typeof u.uid!=='string'||!/^[A-Za-z0-9_-]{6,128}$/.test(u.uid)||uidSeen.has(u.uid))throw Error('duplicate or invalid UID');
  uidSeen.add(u.uid);
  const display=typeof u.displayName==='string'?u.displayName.slice(0,100):'';
  const photo=typeof u.photoURL==='string'&&u.photoURL.startsWith('https://')?u.photoURL.slice(0,2048):'';
  const consent=typeof u.consentVersion==='string'?u.consentVersion.slice(0,40):null;
  const time=Number.isSafeInteger(u.consentAt)&&u.consentAt>=0?u.consentAt:null;
  statements.push('INSERT INTO users (id,display_name,avatar_url,consent_version,consent_at,created_at) VALUES ('+
    [quote(u.uid),quote(display),quote(photo),consent===null?'NULL':quote(consent),time===null?'NULL':time,now].join(',')+');');
  if(!Array.isArray(u.identities)||!u.identities.length)throw Error('identity missing');
  for(const identity of u.identities){
    if(!['google','kakao','naver'].includes(identity.provider))throw Error('unknown provider');
    let digest;
    if(typeof identity.subjectHash==='string'&&/^[a-f0-9]{64}$/.test(identity.subjectHash))digest=identity.subjectHash;
    else if(typeof identity.subject==='string'&&identity.subject&&identity.subject.length<=256)digest=hash(identity.provider+':'+identity.subject);
    else throw Error('identity subject/hash missing');
    if(identitySeen.has(digest))throw Error('duplicate provider identity mapping');
    identitySeen.add(digest);
    statements.push('INSERT INTO identities (subject_hash,user_id,provider,created_at) VALUES ('+
      [quote(digest),quote(u.uid),quote(identity.provider),now].join(',')+');');
    identities++;
  }
  accounts++;
}
console.log('Validated:',accounts,'users,',identities,'provider identities. No existing D1 account has been modified.');
if(emit){
  writeFileSync(output,statements.join('\n')+'\n',{mode:0o600,flag:'wx'});
  console.log('Prepared private SQL file (do not commit). Validate staging DB before any production import.');
}else console.log('Dry-run only. Add --emit to create the SQL file.');
