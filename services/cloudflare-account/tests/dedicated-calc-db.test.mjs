import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('calc history is isolated in calc-db behind account identity validation',()=>{
 const accountConfig=JSON.parse(read('wrangler.jsonc'));
 assert.equal(accountConfig.d1_databases.length,1);
 assert.equal(accountConfig.d1_databases[0].database_name,'softm-hannun-account');
 const accountWorker=read('src/index.mjs');
 assert.match(accountWorker,/\/api\/apps\/calc\/session/);
 assert.doesNotMatch(accountWorker,/CALC_HISTORY_KEY_V1|CREATE TABLE IF NOT EXISTS calc_history/);
 const config=JSON.parse(read('../calc-api/wrangler.jsonc'));
 assert.equal(config.d1_databases[0].database_name,'calc-db');
 assert.equal(config.services[0].service,'softm-hannun-account');
 const worker=read('../calc-api/src/index.mjs');
 assert.match(worker,/CALC_HISTORY_KEY_V1/);
 assert.match(worker,/\/api\/apps\/calc\/history/);
 assert.match(worker,/AES-GCM/);
});

test('calc-db schema is user scoped and contains no account profile table',()=>{
 const schema=read('../calc-api/schema.sql');
 assert.match(schema,/CREATE TABLE IF NOT EXISTS calc_history/);
 assert.match(schema,/user_id TEXT PRIMARY KEY/);
 assert.doesNotMatch(schema,/CREATE TABLE IF NOT EXISTS (?:users|identities|app_sessions)/);
});
