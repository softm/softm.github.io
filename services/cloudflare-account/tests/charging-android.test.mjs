import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../../',import.meta.url);

for(const site of ['hydrogenstation','evchargingstation']){
  test(`${site} Android handoff keeps only PKCE proof in a fixed app link`,async()=>{
    const client=await readFile(new URL('services/cloudflare-account/src/client.mjs',root),'utf8');
    const ui=await readFile(new URL('services/cloudflare-account/src/ui.mjs',root),'utf8');
    const page=await readFile(new URL(`account/android/${site}/return.mjs`,root),'utf8');
    assert.match(client,new RegExp(`siteId==='${site}'`));
    assert.match(ui,new RegExp(`intent\\.site==='${site}'`));
    assert.match(ui,new RegExp(`account/android/${site}/`));
    assert.match(page,new RegExp(`${site.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}://auth/callback`));
    assert.match(page,/\^\[A-Za-z0-9_-\]\{43\}\$/);
    assert.doesNotMatch(page,/accessToken|bearer|localStorage/i);
  });
}
