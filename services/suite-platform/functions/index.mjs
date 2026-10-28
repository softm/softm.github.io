import {onRequest} from 'firebase-functions/v2/https';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {assertAccountActive,requestWithdrawal,withdrawalStatus,processWithdrawal} from './withdrawal.mjs';
import {defineSecret} from 'firebase-functions/params';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,Timestamp,FieldValue} from 'firebase-admin/firestore';
import {readFileSync} from 'node:fs';
import {hash,random,validProof,requireSite,checkTicket,fail} from './security.mjs';
import {exchangeProviderToken,oauthFailureUrl} from './provider.mjs';
import {registerMembership} from './membership.mjs';
initializeApp();
const db=getFirestore('suite-v1'),auth=getAuth();
const registry=JSON.parse(readFileSync(new URL('./registry.json',import.meta.url),'utf8'));
const hub=new URL(registry.hub),project=process.env.GCLOUD_PROJECT||'softm-hannun-api';
const base=process.env.SUITE_API_BASE||`https://asia-northeast3-${project}.cloudfunctions.net/suiteSocialAuth`;
const socialEnabled=process.env.SUITE_ENABLE_SOCIAL==='true';
const kakaoSecret=socialEnabled?defineSecret('SUITE_KAKAO_CLIENT_SECRET'):null,naverSecret=socialEnabled?defineSecret('SUITE_NAVER_CLIENT_SECRET'):null;
const providers={
  kakao:{authorize:'https://kauth.kakao.com/oauth/authorize',token:'https://kauth.kakao.com/oauth/token',profile:'https://kapi.kakao.com/v2/user/me',client:()=>process.env.SUITE_KAKAO_CLIENT_ID,secret:()=>kakaoSecret.value()},
  naver:{authorize:'https://nid.naver.com/oauth2.0/authorize',token:'https://nid.naver.com/oauth2.0/token',profile:'https://openapi.naver.com/v1/nid/me',client:()=>process.env.SUITE_NAVER_CLIENT_ID,secret:()=>naverSecret.value()}
};
const expires=ms=>Timestamp.fromMillis(Date.now()+ms);
async function identity(req,{recent=false,hubOnly=false}={}){
  const token=req.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)fail('login-required',401);
  const claims=await auth.verifyIdToken(token,true);
  if(claims.firebase?.sign_in_provider==='anonymous')fail('registered-login-required',401);
  if(hubOnly&&claims.suite_site)fail('use-account-hub',403);
  if(recent&&Date.now()/1000-claims.auth_time>300)fail('recent-login-required',401);
  await assertAccountActive(db,claims.uid);return claims;
}
async function consume(ref,verifier,extra=()=>{}){
  return db.runTransaction(async tx=>{const snap=await tx.get(ref);const value=snap.data();checkTicket(value,verifier);extra(value);tx.update(ref,{used:true});return value;});
}
async function providerIdentity(provider,subject,linkUid){
  const ref=db.collection('_suiteIdentities').doc(hash(provider+':'+subject));
  return db.runTransaction(async tx=>{const existing=await tx.get(ref);if(existing.exists){const uid=existing.data().uid;if((await tx.get(db.collection('_suiteDeletions').doc(uid))).exists)fail('account-withdrawn',403);if(linkUid&&linkUid!==uid)fail('provider-already-linked',409);return uid;}
    const uid=linkUid||('sns_'+random());if((await tx.get(db.collection('_suiteDeletions').doc(uid))).exists)fail('account-withdrawn',403);tx.create(ref,{uid,provider,createdAt:FieldValue.serverTimestamp()});return uid;});
}
async function jsonFetch(url,options){const response=await fetch(url,{...options,signal:AbortSignal.timeout(12000)});const body=await response.json();if(!response.ok)fail('provider-request-failed',502);return body;}
function callbackPage(res,message){res.status(400).set('Content-Type','text/plain; charset=utf-8').send(message);}
const requestBuckets=new Map();
function allowRequest(req){
  const now=Date.now(),key=hash(req.ip||'unknown'),entry=requestBuckets.get(key);
  if(requestBuckets.size>4000)for(const [k,v] of requestBuckets)if(now-v.start>60000)requestBuckets.delete(k);
  if(!entry||now-entry.start>60000){if(requestBuckets.size>5000)return false;requestBuckets.set(key,{start:now,count:1});return true;}
  return ++entry.count<=40;
}
async function handler(req,res){
  res.set('Cache-Control','no-store');res.set('Referrer-Policy','no-referrer');res.set('X-Content-Type-Options','nosniff');
  const origin=req.get('Origin');const allowed=new Set([hub.origin,...Object.values(registry.sites).flatMap(s=>s.origins)]);
  if(origin&&!allowed.has(origin))return res.status(403).json({message:'허용되지 않은 사이트입니다.'});
  if(origin){res.set('Access-Control-Allow-Origin',origin);res.set('Vary','Origin');res.set('Access-Control-Allow-Headers','Content-Type, Authorization');res.set('Access-Control-Allow-Methods','POST, GET, OPTIONS');}
  if(req.method==='OPTIONS')return res.status(204).end();
  if(!allowRequest(req))return res.status(429).json({message:'잠시 후 다시 시도해 주세요.'});
  if((Number(req.get('Content-Length'))||0)>10000)return res.status(413).json({message:'요청이 너무 큽니다.'});
  const route=req.path.replace(/\/$/,'');const body=req.body||{};
  try{
    if(route==='/health'&&req.method==='GET')return res.json({ok:true,version:1,databaseId:'suite-v1',providers:{google:true,kakao:!!providers.kakao.client(),naver:!!providers.naver.client()}});
    if(route==='/oauth/callback'&&req.method==='GET'){
      const state=req.query.state,code=req.query.code;if(!validProof(state))return callbackPage(res,'로그인을 완료하지 못했습니다. 계정 화면에서 다시 시도해 주세요.');
      const ref=db.collection('_suiteOAuth').doc(hash(state));
      const transaction=await db.runTransaction(async tx=>{const snap=await tx.get(ref),v=snap.data();if(!v||v.state!=='pending'||v.expiresAt.toMillis()<Date.now())fail('invalid-oauth-state',401);tx.update(ref,{state:'processing'});return v;});
      try{
      if(req.query.error==='access_denied')fail('provider-cancelled',401);
      if(typeof code!=='string'||!code||code.length>2048||req.query.error)fail('provider-login-failed',401);
      const p=providers[transaction.provider];
      const accessToken=await exchangeProviderToken(transaction.provider,p,{code,state,redirectUri:base+'/oauth/callback'});
      // Provider access/refresh tokens are used transiently, never logged or retained.
      const profile=await jsonFetch(p.profile,{headers:{Authorization:'Bearer '+accessToken}});
      const subject=transaction.provider==='kakao'?String(profile.id||''):profile.response?.id;
      if(typeof subject!=='string'||!subject||subject.length>256)fail('invalid-provider-user',401);
      const uid=await providerIdentity(transaction.provider,subject,transaction.linkUid);
      await assertAccountActive(db,uid);try{await auth.getUser(uid);}catch(e){if(e.code!=='auth/user-not-found')throw e;await assertAccountActive(db,uid);await auth.createUser({uid});}
      await ref.update({state:'complete',uid,expiresAt:expires(60000)});
      const redirect=new URL(hub);redirect.hash=new URLSearchParams({oauth:state}).toString();return res.redirect(303,redirect.href);
      }catch(error){
        // The state was claimed above. A failed request cannot later be exchanged
        // for a login token; the existing hub session remains untouched.
        try{await ref.update({state:'failed',expiresAt:expires(60000)});}catch{console.error('suite-oauth-state-update-failed');}
        if(!error.status)console.error('suite-oauth-callback-failed');
        return res.redirect(303,oauthFailureUrl(hub,state,error));
      }
    }
    if(req.method!=='POST')return res.status(405).json({message:'지원하지 않는 요청입니다.'});
    if(!origin)fail('origin-required',403);
    if(route==='/oauth/start'){
      if(origin!==hub.origin)fail('use-account-hub',403);const p=providers[body.provider];if(!p?.client()||!validProof(body.challenge))fail('provider-not-configured',503);
      const linking=body.mode==='link'?await identity(req,{recent:true,hubOnly:true}):null;
      const state=random();await db.collection('_suiteOAuth').doc(hash(state)).create({provider:body.provider,challenge:body.challenge,state:'pending',linkUid:linking?.uid||null,expiresAt:expires(300000),used:false});
      const url=new URL(p.authorize);url.search=new URLSearchParams({client_id:p.client(),redirect_uri:base+'/oauth/callback',response_type:'code',state}).toString();return res.json({url:url.href,state});
    }
    if(route==='/oauth/exchange'){
      if(origin!==hub.origin||!validProof(body.state))fail('invalid-oauth-request',403);
      const value=await consume(db.collection('_suiteOAuth').doc(hash(body.state)),body.verifier,v=>{if(v.state!=='complete')fail('oauth-not-complete',401);});
      await assertAccountActive(db,value.uid);const token=await auth.createCustomToken(value.uid);return res.json({token});
    }
    if(route==='/membership/withdraw/status'){
      if(origin!==hub.origin)fail('use-account-hub',403);
      return res.json(await withdrawalStatus({db,uid:body.uid,receipt:body.receipt}));
    }
    if(route==='/membership/withdraw'){
      if(origin!==hub.origin)fail('use-account-hub',403);
      const claims=await identity(req,{recent:true,hubOnly:true});
      return res.status(202).json(await requestWithdrawal({db,uid:claims.uid,body,timestamp:()=>FieldValue.serverTimestamp(),expires}));
    }
    if(route==='/membership/status'){
      if(origin!==hub.origin)fail('use-account-hub',403);
      const claims=await identity(req,{hubOnly:true}),member=await db.collection('_suiteMemberships').doc(claims.uid).get();
      return res.json({registered:member.exists,version:member.exists?member.data().version:null});
    }
    if(route==='/membership/register'){
      if(origin!==hub.origin)fail('use-account-hub',403);
      const claims=await identity(req,{hubOnly:true});
      const profile=await auth.getUser(claims.uid);
      return res.json(await registerMembership({db,uid:claims.uid,displayName:profile.displayName||'',version:body.version,accepted:body.accepted,timestamp:()=>FieldValue.serverTimestamp()}));
    }
    if(route==='/session/authorize'){
      if(origin!==hub.origin)fail('use-account-hub',403);requireSite(registry,body.siteId,body.origin);if(!validProof(body.challenge))fail('invalid-proof');
      const claims=await identity(req,{hubOnly:true});if(!(await db.collection('_suiteMemberships').doc(claims.uid).get()).exists)fail('membership-required',403);const code=random();await db.collection('_suiteCodes').doc(hash(code)).create({uid:claims.uid,siteId:body.siteId,origin:body.origin,challenge:body.challenge,used:false,expiresAt:expires(60000)});return res.json({code});
    }
    if(route==='/session/exchange'){
      requireSite(registry,body.siteId,origin);if(origin!==body.origin||!validProof(body.code))fail('invalid-exchange');
      const value=await consume(db.collection('_suiteCodes').doc(hash(body.code)),body.verifier,v=>{if(v.siteId!==body.siteId||v.origin!==origin)fail('wrong-site',403);});
      await assertAccountActive(db,value.uid);return res.json({token:await auth.createCustomToken(value.uid,{suite_site:value.siteId})});
    }
    if(route==='/providers'){
      const claims=await identity(req,{hubOnly:true});const snap=await db.collection('_suiteIdentities').where('uid','==',claims.uid).limit(10).get();const user=await auth.getUser(claims.uid);return res.json({providers:[...new Set([...user.providerData.map(p=>p.providerId),...snap.docs.map(d=>d.data().provider)])]});
    }
    return res.status(404).json({message:'지원하지 않는 기능입니다.'});
  }catch(error){
    if(!error.status)console.error('suite-auth-failure',{code:String(error.code||'unknown').slice(0,80),route});
    // Never echo provider responses, tokens, UID, request body or OAuth codes.
    return res.status(error.status||500).json({code:error.status?error.message:'service-error',message:error.message==='recent-login-required'?'본인 확인을 위해 같은 SNS 계정으로 다시 로그인한 뒤 탈퇴해 주세요.':error.message==='account-withdrawn'?'탈퇴 처리 중이거나 탈퇴한 계정입니다.':error.message==='withdrawal-confirmation-required'?'삭제 범위를 확인하고 회원탈퇴를 정확히 입력해 주세요.':error.message==='withdrawal-receipt-invalid'?'탈퇴 처리 내역을 확인할 수 없습니다.':error.message==='withdrawal-in-progress'?'이미 탈퇴 처리가 진행 중입니다.':error.message==='membership-required'?'회원가입을 완료해 주세요.':error.status===409?'이미 다른 계정에 연결된 로그인입니다. 기존 계정으로 로그인해 주세요.':error.status===503?'이 로그인 제공자는 아직 운영 설정 중입니다.':'로그인을 완료하지 못했습니다. 계정 화면에서 다시 시도해 주세요.'});
  }
}
const options={region:'asia-northeast3',maxInstances:2,concurrency:20,timeoutSeconds:60,memory:'256MiB'};
export const suiteAuth=onRequest(options,(req,res)=>req.path.startsWith('/oauth/')?res.status(404).json({message:'SNS 전용 인증 서버를 사용해 주세요.'}):handler(req,res));
export const suiteSocialAuth=socialEnabled?onRequest({...options,secrets:[kakaoSecret,naverSecret]},handler):undefined;
export {handler};



export const suiteDeleteAccount=onDocumentCreated({document:'_suiteDeletions/{uid}',database:'suite-v1',region:'asia-northeast3',retry:true,maxInstances:2,concurrency:1,timeoutSeconds:540,memory:'512MiB'},event=>processWithdrawal({db,auth,uid:event.params.uid,timestamp:()=>FieldValue.serverTimestamp(),expires}));
