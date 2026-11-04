// The real hub and Android return page run with synthetic authentication only.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SUITE_UI_RUNTIME?path.join(process.env.SUITE_UI_RUNTIME,'node_modules/playwright'):'playwright');
const root=path.resolve(__dirname,'../../..'),out=process.env.SUITE_UI_OUTPUT||'/tmp/gagyebu-common-login-20261105';
const auth=`const user={uid:'fixture',displayName:'검증 계정',getIdToken:async()=>'fixture-token',getIdTokenResult:async()=>({claims:{}})};export const getAuth=()=>({currentUser:user,authStateReady:async()=>{}});export class GoogleAuthProvider{};export const signInWithPopup=async()=>{},signInWithCustomToken=async()=>{},linkWithPopup=async()=>{},signOut=async()=>{},setPersistence=async()=>{},browserLocalPersistence={};export function onAuthStateChanged(a,f){f(a.currentUser);return ()=>{};}`;
const firestore=`export const getFirestore=()=>({}),doc=()=>({}),collection=()=>({}),getDoc=async()=>({}),getDocFromServer=async()=>({}),getDocs=async()=>({docs:[]}),query=()=>({}),limit=()=>({}),orderBy=()=>({}),startAfter=()=>({}),runTransaction=async()=>{},writeBatch=()=>({}),serverTimestamp=()=>({}),deleteDoc=async()=>{};`;
(async()=>{const browser=await chromium.launch();try{
 const context=await browser.newContext({viewport:{width:393,height:852}});let grants=0;
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='www.gstatic.com')return route.fulfill({contentType:'text/javascript',body:url.pathname.includes('firebase-app')?'export const initializeApp=()=>({});':url.pathname.includes('firebase-auth')?auth:firestore});
  if(url.hostname.includes('cloudfunctions.net')){
   let value={};if(url.pathname.endsWith('/membership/status'))value={registered:true};
   else if(url.pathname.endsWith('/providers'))value={providers:['google.com']};
   else if(url.pathname.endsWith('/session/authorize')){const data=route.request().postDataJSON();assert.equal(data.siteId,'gagyebu');assert.equal(data.origin,'https://appassets.androidplatform.net');assert.equal(route.request().headers().authorization,'Bearer fixture-token');grants++;value={code:'C'.repeat(43)};}
   else throw Error('Unexpected API call');
   return route.fulfill({contentType:'application/json',body:JSON.stringify(value)});
  }
  assert.equal(url.origin,'https://softm.github.io');
  const file=path.resolve(root,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));assert.ok(file.startsWith(root+path.sep));
  return route.fulfill({contentType:file.endsWith('.mjs')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html',body:await fs.readFile(file)});
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const params=new URLSearchParams({site:'gagyebu',origin:'https://appassets.androidplatform.net',transport:'android',request:'A'.repeat(43),challenge:'B'.repeat(43)});
 const start='https://softm.github.io/account/?'+params;
 await page.goto(start);await page.locator('#continue').waitFor({state:'visible'});assert.equal(grants,0);
 await page.screenshot({path:out+'/hub-android-connect.png'});await page.locator('#continue').click();
 await page.locator('#return').waitFor({state:'visible'});const reply=await page.locator('#return').getAttribute('href');
 assert.equal(new URL(reply).protocol,'softm.android.gagyebu:');assert.equal(new URLSearchParams(new URL(reply).hash.slice(1)).get('code'),'C'.repeat(43));assert.equal(new URL(page.url()).hash,'');assert.equal(grants,1);
 await page.goto(start);await page.locator('#cancel').click();await page.locator('#return').waitFor({state:'visible'});assert.match(await page.locator('#return').getAttribute('href'),/error=cancelled/);assert.equal(grants,1);
 params.set('origin','https://evil.test');await page.goto('https://softm.github.io/account/?'+params);await page.locator('#grant-description').filter({hasText:'만료'}).waitFor();assert.equal(await page.locator('#continue').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS native hub: explicit grant, fixed app callback, cancel, invalid origin rejection, no token URL.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
