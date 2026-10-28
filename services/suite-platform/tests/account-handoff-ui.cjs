// Test the real hub + SDK + vault over two origins. Only identity/database endpoints are synthetic.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.SUITE_UI_RUNTIME,'node_modules/playwright'));
const root=path.resolve(__dirname,'../../..'),output=process.env.SUITE_UI_OUTPUT;
const authModule=`
const apps=new Map();
const makeUser=site=>({uid:'fixture-user',displayName:'테스트 계정',getIdToken:async()=>'fixture-only',getIdTokenResult:async()=>({claims:site?{suite_site:site}:{}})});
window.handoffFixture={calls:0};
export function getAuth(app){if(!apps.has(app.name))apps.set(app.name,{currentUser:app.name==='softm-account-hub'?makeUser():null,listeners:[],authStateReady:async()=>{}});return apps.get(app.name);}
const notify=auth=>auth.listeners.forEach(fn=>fn(auth.currentUser));
export const browserLocalPersistence={};export async function setPersistence(){}
export class GoogleAuthProvider{}
export function onAuthStateChanged(auth,fn){auth.listeners.push(fn);fn(auth.currentUser);return ()=>{};}
export function signInWithPopup(auth){handoffFixture.calls++;return new Promise(resolve=>{handoffFixture.completeGoogle=()=>{auth.currentUser=makeUser();notify(auth);resolve();};});}
export const linkWithPopup=signInWithPopup;
export async function signInWithCustomToken(auth,token){auth.currentUser=makeUser(token==='fixture-site-token'?'goldsignal':null);notify(auth);}
export async function signOut(auth){auth.currentUser=null;notify(auth);}
`;
const firestoreModule=`
export const getFirestore=()=>({}),doc=(...parts)=>({parts}),collection=(...parts)=>({parts});
export async function runTransaction(db,fn){return fn({get:async()=>({exists:()=>false}),set(){}});}
export const getDoc=async()=>({exists:()=>false}),getDocFromServer=getDoc,getDocs=async()=>({docs:[]});
export const query=()=>({}),limit=()=>({}),orderBy=()=>({}),startAfter=()=>({}),serverTimestamp=()=>({});
export const writeBatch=()=>({set(){},update(){},delete(){},commit:async()=>{}});export async function deleteDoc(){}
`;
(async()=>{
 let hubOrigin,siteOrigin,browser;
 const state={grants:0,exchanges:0,codes:new Map(),oauth:new Map()};
 const json=(res,value,code=200)=>{res.writeHead(code,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
 const body=async req=>{let value='';for await(const chunk of req)value+=chunk;return JSON.parse(value||'{}');};
 const serve=async(req,res)=>{
  try{
   if([hubOrigin,siteOrigin].includes(req.headers.origin))res.setHeader('Access-Control-Allow-Origin',req.headers.origin);
   res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
   if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
   const url=new URL(req.url,hubOrigin),pathname=url.pathname;
   if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><body><h1>합성 사이트</h1><script type="module">import {mountSiteVault} from "/shared/platform/v1/site-vault.mjs";mountSiteVault({siteId:"goldsignal",name:"금시그널",keys:[],label:"합성 검사",target:"body"});</script></body></html>');return;}
   if(pathname==='/shared/platform/v1/config.json'){json(res,{enabled:true,hubUrl:hubOrigin+'/account/',apiBase:hubOrigin+'/api',socialApiBase:hubOrigin+'/api',databaseId:'fixture',firebase:{apiKey:'fixture-only',appId:'fixture-only'},providers:{google:true,kakao:true,naver:true},providerStatus:{naver:'review-required'}});return;}
   if(pathname==='/shared/platform/v1/registry.json'){json(res,{sites:{goldsignal:{name:'금시그널',url:siteOrigin,origins:[siteOrigin],integration:'snapshot-adapter'}}});return;}
   if(pathname==='/api/providers'){json(res,{providers:['google.com']});return;}
   if(pathname==='/api/session/authorize'){
    const value=await body(req);assert.equal(value.origin,siteOrigin);assert.equal(value.siteId,'goldsignal');assert.match(value.challenge,/^[A-Za-z0-9_-]{43}$/);
    assert.equal(req.headers.authorization,'Bearer fixture-only');const code=crypto.randomUUID();state.codes.set(code,value);state.grants++;json(res,{code});return;
   }
   if(pathname==='/api/session/exchange'){
    const value=await body(req),issued=state.codes.get(value.code);assert.ok(issued);assert.equal(crypto.createHash('sha256').update(value.verifier).digest('base64url'),issued.challenge);
    assert.equal(value.origin,siteOrigin);assert.equal(value.siteId,'goldsignal');state.codes.delete(value.code);state.exchanges++;json(res,{token:'fixture-site-token'});return;
   }
   if(pathname==='/api/oauth/start'){
    const value=await body(req),key=crypto.randomBytes(32).toString('base64url');state.oauth.set(key,value);json(res,{state:key,url:hubOrigin+'/account/#oauth='+key});return;
   }
   if(pathname==='/api/oauth/exchange'){
    const value=await body(req),issued=state.oauth.get(value.state);assert.ok(issued);assert.equal(crypto.createHash('sha256').update(value.verifier).digest('base64url'),issued.challenge);
    state.oauth.delete(value.state);json(res,{token:'fixture-hub-token'});return;
   }
   const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(root+path.sep))throw Error('path');
   res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await fs.readFile(file));
  }catch(error){json(res,{message:error.message},500);}
 };
 const hub=http.createServer(serve),site=http.createServer(serve);
 await new Promise(resolve=>hub.listen(0,'127.0.0.1',resolve));hubOrigin='http://127.0.0.1:'+hub.address().port;
 await new Promise(resolve=>site.listen(0,'127.0.0.1',resolve));siteOrigin='http://127.0.0.1:'+site.address().port;
 try{
  browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1280,height:900}}),errors=[];
  await context.route('https://www.gstatic.com/**',route=>{
   const url=route.request().url();return route.fulfill({contentType:'text/javascript',body:url.includes('firebase-app')?'export const initializeApp=(config,name)=>({name});':url.includes('firebase-firestore')?firestoreModule:authModule});
  });
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  const parent=await context.newPage();await parent.goto(siteOrigin+'/');
  await parent.getByRole('button',{name:'내 보관소',exact:true}).click();
  const openPopup=async()=>{
   const pending=parent.waitForEvent('popup');await parent.getByRole('dialog').locator('#connect').click();const popup=await pending;
   await popup.setViewportSize({width:520,height:703});await popup.locator('#continue').waitFor({state:'visible'});return popup;
  };
  const first=await openPopup();await first.close();
  await parent.waitForFunction(()=>document.querySelector('softm-site-vault').shadowRoot.getElementById('status').textContent.includes('닫혔습니다'));
  const google=await openPopup();
  assert.match(await parent.getByRole('dialog').getByRole('status').innerText(),/로그인 창에서/);
  const grant=await google.locator('#continue').boundingBox();assert.ok(grant.y>=0&&grant.y+grant.height<=703,'grant must be in the first popup viewport');
  assert.equal(await google.locator('header').isVisible(),false);assert.equal(await google.locator('#sites-card').isVisible(),false);
  assert.equal(await google.locator('#naver').isDisabled(),true);assert.equal(await google.locator('#naver').innerText(),'네이버 로그인 · 승인 대기');
  assert.equal(state.grants,0,'opening a popup must not silently authorize the existing account');
  await google.screenshot({path:path.join(output,'account-connection-first-screen.png')});
  await google.locator('#google').click();await google.waitForFunction(()=>!!handoffFixture.completeGoogle);
  assert.equal(state.grants,0,'only completing the explicit provider action can continue');
  const googleClosed=google.waitForEvent('close');await google.evaluate(()=>handoffFixture.completeGoogle());await googleClosed;
  await parent.getByRole('dialog').getByRole('status').filter({hasText:'로그인했습니다.'}).waitFor();
  assert.equal(await parent.getByRole('button',{name:'이 사이트 로그아웃',exact:true}).isVisible(),true);assert.equal(state.exchanges,1);
  const existing=await openPopup(),existingClosed=existing.waitForEvent('close');
  await existing.getByRole('button',{name:'이 계정으로 금시그널 연결',exact:true}).click();await existingClosed;
  await parent.getByRole('dialog').getByRole('status').filter({hasText:'로그인했습니다.'}).waitFor();assert.equal(state.exchanges,2);
  const kakao=await openPopup(),kakaoClosed=kakao.waitForEvent('close');await kakao.locator('#kakao').click();await kakaoClosed;
  await parent.getByRole('dialog').getByRole('status').filter({hasText:'로그인했습니다.'}).waitFor();assert.equal(state.exchanges,3);
  const invalid=await openPopup(),invalidUrl=new URL(invalid.url());invalidUrl.searchParams.set('origin','https://not-allowed.example');await invalid.goto(invalidUrl.href);
  await invalid.locator('#grant').waitFor({state:'visible'});assert.equal(await invalid.locator('#continue').isVisible(),false);assert.equal(await invalid.locator('#login-card').isVisible(),false);assert.equal(state.grants,3);await invalid.close();
  const tester=await context.newPage();await tester.goto(hubOrigin+'/account/?naver-test=1');
  await tester.waitForFunction(()=>!document.getElementById('naver').disabled);assert.equal(await tester.locator('#naver').innerText(),'네이버 테스트 로그인');
  assert.deepEqual(errors,[]);
  console.log('Cross-origin handoff: visible grant, cancelled-popup retry, Google auto-connect, existing-account consent, Kakao OAuth return, PKCE exchange, origin rejection and honest Naver availability passed.');
 }finally{await browser?.close();await Promise.all([new Promise(resolve=>hub.close(resolve)),new Promise(resolve=>site.close(resolve))]);}
})().catch(error=>{console.error(error);process.exitCode=1;});
