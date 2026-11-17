import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('juyuhannun favorites are isolated in a dedicated encrypted D1',async()=>{
 const [accountWorker,client,worker,schema,config]=await Promise.all([
  read('cloudflare-account/src/index.mjs'),read('cloudflare-account/src/client.mjs'),
  read('juyuhannun-api/src/index.mjs'),read('juyuhannun-api/schema.sql'),read('juyuhannun-api/wrangler.jsonc')
 ]);
 assert.match(accountWorker,/\/api\/apps\/juyuhannun\/session/);
 assert.match(client,/exchangeJuyuFavorites/);
 assert.match(worker,/JUYU_FAVORITES_KEY_V1/);
 assert.match(worker,/AES-GCM/);
 assert.match(worker,/https:\/\/account\.internal\/api\/apps\/juyuhannun\/session/);
 assert.match(schema,/CREATE TABLE IF NOT EXISTS favorite_stations/);
 assert.doesNotMatch(schema,/CREATE TABLE IF NOT EXISTS (?:users|identities|app_sessions)/);
 assert.match(config,/"database_name": "juyuhannun-db"/);
});
