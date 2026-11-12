import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('gagyebu ledger is bound to dedicated D1 only',()=>{
 const config=JSON.parse(read('wrangler.jsonc'));
 assert.equal(config.d1_databases.find(x=>x.binding==='DB').database_name,'softm-hannun-account');
 assert.equal(config.d1_databases.find(x=>x.binding==='LEDGER_DB').database_name,'gagyebu-db');
 const worker=read('src/index.mjs');
 assert.match(worker,/ledgerExchange\(\{\.\.\.env,DB:env\.LEDGER_DB\},uid,payload\)/);
 assert.match(worker,/cleanupOldLedgerVersions\(env\.LEDGER_DB,t-7200\)/);
 assert.doesNotMatch(worker,/cleanupOldLedgerVersions\(env\.DB/);
});
test('account schema never recreates gagyebu tables',()=>{
 const schema=read('schema.sql'),account=read('account-schema.sql'),dedicated=read('gagyebu-db-schema.sql');
 for(const table of ['gagyebu_ledger_heads','gagyebu_ledger_chunks','gagyebu_ledger_versions']){
  assert.doesNotMatch(schema,new RegExp('CREATE TABLE IF NOT EXISTS '+table));
  assert.doesNotMatch(account,new RegExp('CREATE TABLE IF NOT EXISTS '+table));
  assert.match(dedicated,new RegExp('CREATE TABLE IF NOT EXISTS '+table));
 }
 assert.doesNotMatch(dedicated,/REFERENCES users\(/);
});
