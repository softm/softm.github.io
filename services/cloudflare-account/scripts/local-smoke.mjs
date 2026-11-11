#!/usr/bin/env node
// End-to-end integration against local Wrangler + D1. No live OAuth keys or user data.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {seal,unseal} from '../../../shared/platform/v1/crypto.mjs';
const dir=resolve(fileURLToPath(new URL('..',import.meta.url)));
const wrangler=join(dir,'node_modules','.bin','wrangler');
const host='http://127.0.0.1:8795',appOrigin='https://softm.github.io';
const uid='firebase_example_uid_001';
const token=randomBytes(32).toString('base64url');
const shahex=x=>createHash('sha256').update(x).digest('hex');
const sha64=x=>createHash('sha256').update(x).digest('base64url');
const proof=()=>randomBytes(32).toString('base64url');
let child,log='';
function cmd(args){return execFileSync(wrangler,args,{cwd:dir,encoding:'utf8',timeout:90000,stdio:['ignore','pipe','pipe']});}
function request(path,init={}){return fetch(host+path,{redirect:'manual',...init});}
async function result(path,init={}){const r=await request(path,init);let body;try{body=await r.json();}catch{body=null;}return {status:r.status,body,headers:r.headers};}
function check(res,status,label){assert.equal(res.status,status,label+': '+JSON.stringify(res.body));}
function appHeader(value){return {Origin:appOrigin,Authorization:'Bearer '+value};}
async function run(){
  console.log('Preparing local D1');
  cmd(['d1','execute','softm-hannun-account','--local','--file=schema.sql','--yes']);
  const t=Math.floor(Date.now()/1000);
  mkdirSync(join(dir,'.wrangler'),{recursive:true});
  const seed=join(dir,'.wrangler','smoke-seed.sql');
  writeFileSync(seed,"INSERT OR REPLACE INTO users(id,display_name,avatar_url,consent_version,consent_at,created_at) VALUES('"+uid+"','Test','','2026-11-11',"+t+","+t+");\n"+
    "INSERT OR REPLACE INTO web_sessions(token_hash,user_id,authenticated_at,expires_at) VALUES('"+shahex(token)+"','"+uid+"',"+t+","+(t+7200)+");\n",{mode:0o600});
  cmd(['d1','execute','softm-hannun-account','--local','--file='+seed,'--yes']);
  child=spawn(wrangler,['dev','--local','--ip','127.0.0.1','--port','8795','--var','PUBLIC_BASE_URL:'+host],{cwd:dir,stdio:['ignore','pipe','pipe']});
  child.stdout.on('data',x=>log+=x.toString());child.stderr.on('data',x=>log+=x.toString());
  let ready=false;
  for(let i=0;i<100;i++){
    if(child.exitCode!==null)throw Error('Wrangler stopped: '+log.slice(-1600));
    try{if((await request('/health')).ok){ready=true;break;}}catch{}
    await sleep(250);
  }
  if(!ready)throw Error('Worker startup timeout: '+log.slice(-2400));
  check(await result('/health'),200,'health');
  const account=await request('/account');assert.equal(account.status,200);assert.match(await account.text(),/내 계정, 간편하게/);
  let r=await result('/api/me');check(r,200,'anonymous');assert.equal(r.body.user,null);
  const sessionCookie='__Host-sh_session='+token;
  r=await result('/api/me',{headers:{Cookie:sessionCookie}});check(r,200,'current account');assert.equal(r.body.user.id,uid);
  const verifier=proof(),challenge=sha64(verifier),req=proof();
  const target=new URL('/connect',host);
  target.searchParams.set('site','weatherhannun');target.searchParams.set('origin',appOrigin);
  target.searchParams.set('challenge',challenge);target.searchParams.set('request',req);
  const begin=await request(target.pathname+target.search);
  assert.equal(begin.status,303);assert.equal(begin.headers.get('location'),'/connect');
  const match=(begin.headers.get('set-cookie')||'').match(/__Host-sh_connect=[A-Za-z0-9_-]{43}/);
  assert.ok(match,'connect cookie');const connectCookie=match[0];
  r=await result('/api/connect/info',{headers:{Cookie:connectCookie}});check(r,200,'connect target');assert.equal(r.body.site,'weatherhannun');
  r=await result('/api/connect/authorize',{method:'POST',headers:{Cookie:connectCookie+'; '+sessionCookie,Origin:host,'Content-Type':'application/json'},body:'{}'});
  check(r,200,'site authorization');assert.equal(r.body.request,req);
  const code=r.body.code;
  const exchange=(ver,providedCode=code)=>result('/api/connect/exchange',{method:'POST',headers:{Origin:appOrigin,'Content-Type':'application/json'},body:JSON.stringify({site:'weatherhannun',origin:appOrigin,code:providedCode,verifier:ver})});
  check(await exchange(proof()),401,'bad proof cannot burn code');
  r=await exchange(verifier);check(r,200,'exchange');assert.equal(r.body.uid,uid);assert.equal(r.body.expiresIn,3600);
  const access=r.body.accessToken;
  check(await exchange(verifier),401,'code replay blocked');
  check(await result('/api/apps/weatherhannun/items/favorite',{headers:appHeader(access)}),404,'missing encrypted item');
  const encrypted=JSON.stringify(await seal({message:'test only'},'sample-password-123',uid+'/weatherhannun/favorite'));
  const put=(revision)=>result('/api/apps/weatherhannun/items/favorite',{method:'PUT',headers:{...appHeader(access),'Content-Type':'application/json'},body:JSON.stringify({payload:encrypted,expectedRevision:revision})});
  r=await put(0);check(r,200,'write encrypted');assert.equal(r.body.revision,1);
  check(await put(0),409,'revision conflict');
  r=await result('/api/apps/weatherhannun/items/favorite',{headers:appHeader(access)});check(r,200,'read encrypted');
  assert.equal(r.body.payload,encrypted);
  const decrypted=await unseal(JSON.parse(r.body.payload),'sample-password-123',uid+'/weatherhannun/favorite');
  assert.equal(decrypted.message,'test only');
  check(await result('/api/apps/gagyebu/items/favorite',{headers:appHeader(access)}),401,'site-scoped bearer not valid for another app');
  check(await result('/api/apps/weatherhannun/items/favorite',{headers:{Origin:'https://evil.example',Authorization:'Bearer '+access}}),403,'origin isolation');
  check(await result('/api/account/delete',{method:'POST',headers:{Cookie:sessionCookie,Origin:host,'Content-Type':'application/json'},body:'{"confirmation":"회원탈퇴"}'}),503,'delete locked');
  check(await result('/api/apps/weatherhannun/logout',{method:'POST',headers:appHeader(access)}),200,'app logout');
  check(await result('/api/apps/weatherhannun/items/favorite',{headers:appHeader(access)}),401,'revoked app session');
  console.log('PASS local D1: health, login session, allowlisted origin, PKCE, replay, AES-GCM, revision lock, logout, cross-system delete safety');
}
try{await run();}catch(e){console.error(e.stack||String(e));console.error('Wrangler output:',log.slice(-4000));process.exitCode=1;}
finally{if(child&&child.exitCode===null){child.kill('SIGTERM');await sleep(750);if(child.exitCode===null)child.kill('SIGKILL');}}
