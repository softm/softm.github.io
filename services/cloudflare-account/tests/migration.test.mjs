import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const accounts=fileURLToPath(new URL('../scripts/prepare-migration.mjs',import.meta.url));
const items=fileURLToPath(new URL('../scripts/prepare-items.mjs',import.meta.url));
const testDir=fn=>{const dir=mkdtempSync(join(tmpdir(),'sh-account-'));try{fn(dir)}finally{rmSync(dir,{recursive:true,force:true})}};
test('legacy import keeps exact Firebase UID and stores hashed provider identity only',()=>{
  testDir(dir=>{
    const src=join(dir,'legacy.secret.json'),out=join(dir,'migration-private.sql');
    writeFileSync(src,JSON.stringify({users:[{uid:'firebase_UID_001',displayName:'Demo',consentVersion:'20261029-1',identities:[{provider:'google',subject:'sensitive-google-subject'}]}]}));
    const preview=spawnSync(process.execPath,[accounts,'--input',src,'--output',out],{encoding:'utf8'});
    assert.equal(preview.status,0,preview.stderr);assert.equal(existsSync(out),false);
    const run=spawnSync(process.execPath,[accounts,'--input',src,'--output',out,'--emit'],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const sql=readFileSync(out,'utf8');
    assert.match(sql,/firebase_UID_001/);assert.doesNotMatch(sql,/sensitive-google-subject/);
    assert.match(sql,new RegExp(createHash('sha256').update('google:sensitive-google-subject').digest('hex')));
  });
});
test('duplicate provider identities fail without writing SQL',()=>{
  testDir(dir=>{
    const src=join(dir,'duplicate.secret.json'),out=join(dir,'migration-private.sql');
    const same=[{provider:'kakao',subject:'same-identity'}];
    writeFileSync(src,JSON.stringify({users:[{uid:'firebase_UID_001',identities:same},{uid:'firebase_UID_002',identities:same}]}));
    const run=spawnSync(process.execPath,[accounts,'--input',src,'--output',out,'--emit'],{encoding:'utf8'});
    assert.notEqual(run.status,0);assert.equal(existsSync(out),false);
  });
});
test('item migration only accepts encrypted data and preserves UID/site/item/revision',()=>{
  testDir(dir=>{
    const src=join(dir,'items.secret.json'),out=join(dir,'migration-items.sql');
    const encrypted=JSON.stringify({v:1,algorithm:'AES-GCM',iterations:310000,salt:'AQEBAQEBAQEBAQEBAQEBAQ==',iv:'AQEBAQEBAQEBAQEB',ct:'AQ=='});
    writeFileSync(src,JSON.stringify({items:[{uid:'firebase_UID_001',site:'weatherhannun',itemId:'favorite-locations',revision:3,payload:encrypted}]}));
    const run=spawnSync(process.execPath,[items,'--input',src,'--output',out,'--emit'],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const sql=readFileSync(out,'utf8');
    assert.match(sql,/firebase_UID_001/);assert.match(sql,/weatherhannun/);assert.match(sql,/favorite-locations/);
    assert.match(sql,/,3,'/);
    const bad=join(dir,'bad.secret.json'),badout=join(dir,'bad.sql');
    writeFileSync(bad,JSON.stringify({items:[{uid:'firebase_UID_001',site:'weatherhannun',itemId:'favorite-locations',revision:3,payload:JSON.stringify({note:'plaintext'})}]}));
    const fail=spawnSync(process.execPath,[items,'--input',bad,'--output',badout,'--emit'],{encoding:'utf8'});
    assert.notEqual(fail.status,0);assert.equal(existsSync(badout),false);
  });
});
