import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('account Worker cannot access gagyebu ledger or D1',()=>{
 const config=JSON.parse(read('wrangler.jsonc'));
 assert.equal(config.d1_databases.find(x=>x.binding==='DB').database_name,'softm-hannun-account');
 assert.equal(config.d1_databases.length,1);
 assert.equal(config.d1_databases.find(x=>x.binding==='LEDGER_DB'),undefined);
 const worker=read('src/index.mjs');
 assert.doesNotMatch(worker,/ledgerExchange|cleanupOldLedgerVersions|GAGYEBU_LEDGER_KEY_V1/);
 assert.match(worker,/\/api\/apps\/gagyebu\/session/);
 const dedicatedConfig=JSON.parse(read('../gagyebu-api/wrangler.jsonc'));
 assert.equal(dedicatedConfig.d1_databases.find(x=>x.binding==='DB').database_name,'gagyebu-db');
 const dedicatedWorker=read('../gagyebu-api/src/index.mjs');
 assert.match(dedicatedWorker,/ledgerExchange\(env,uid,body\)/);
 assert.match(dedicatedWorker,/cleanupOldLedgerVersions\(env.DB/);
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
