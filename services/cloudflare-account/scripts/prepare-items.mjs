#!/usr/bin/env node
// Offline only: convert already encrypted Firestore item export to D1 INSERT statements.
import {readFileSync,writeFileSync} from 'node:fs';
const args=process.argv.slice(2),get=name=>args[args.indexOf(name)+1];
const input=get('--input'),output=get('--output'),emit=args.includes('--emit');
if(!input?.endsWith('.json')||!output?.endsWith('.sql')){console.error('Usage: node scripts/prepare-items.mjs --input items.secret.json --output migration-items.sql [--emit]');process.exit(2)}
const source=JSON.parse(readFileSync(input,'utf8'));
if(!Array.isArray(source.items))throw Error('Expected {items:[...]}');
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
const found=new Set(),statements=['PRAGMA foreign_keys=ON;'];
for(const row of source.items){
  if(!row||typeof row.uid!=='string'||!/^[A-Za-z0-9_-]{6,128}$/.test(row.uid)||typeof row.site!=='string'||!/^[a-z0-9_-]{1,80}$/.test(row.site)||typeof row.itemId!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(row.itemId))throw Error('invalid item identity');
  if(!Number.isSafeInteger(row.revision)||row.revision<1||typeof row.payload!=='string'||row.payload.length>180000)throw Error('invalid item version/payload');
  const p=JSON.parse(row.payload);
  if(p.v!==1||p.algorithm!=='AES-GCM'||p.iterations!==310000||!p.salt||!p.iv||!p.ct)throw Error('payload is not the supported encrypted envelope');
  const key=row.uid+'/'+row.site+'/'+row.itemId;if(found.has(key))throw Error('duplicate uid/site/item');found.add(key);
  statements.push('INSERT INTO items(user_id,site,item_id,revision,payload,updated_at) VALUES ('+
    [quote(row.uid),quote(row.site),quote(row.itemId),row.revision,quote(row.payload),Math.floor(Date.now()/1000)].join(',')+');');
}
console.log('Validated encrypted item records:',found.size,'. No server writes.');
if(emit){writeFileSync(output,statements.join('\n')+'\n',{mode:0o600,flag:'wx'});console.log('Private SQL prepared. Test on a staging database before import.');}
else console.log('Dry-run only. Add --emit after review.');
