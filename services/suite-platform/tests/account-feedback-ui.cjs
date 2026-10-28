// Synthetic browser checks: no real OAuth account, token, or remote request is used.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SUITE_UI_RUNTIME?path.join(process.env.SUITE_UI_RUNTIME,'node_modules/playwright'):'playwright');
const root=path.resolve(__dirname,'../../..'),output=process.env.SUITE_UI_OUTPUT||path.join(root,'verification');
const authModule=`
const user={uid:'fixture-user',displayName:'테스트 계정',getIdToken:async()=>'fixture-only'};
const auth={currentUser:user,authStateReady:async()=>{}},listeners=[];
window.feedbackFixture={calls:0};
export const getAuth=()=>auth;
export class GoogleAuthProvider{}
export function onAuthStateChanged(a,fn){listeners.push(fn);fn(a.currentUser);return ()=>{};}
export function signInWithPopup(){feedbackFixture.calls++;return new Promise((resolve,reject)=>{
 feedbackFixture.succeed=()=>{auth.currentUser=user;listeners.forEach(fn=>fn(user));resolve();};
 feedbackFixture.fail=code=>reject({code});
});}
export const linkWithPopup=signInWithPopup;
export async function signInWithCustomToken(){}
export async function signOut(){auth.currentUser=null;listeners.forEach(fn=>fn(null));}
`;
const sdkModule=`export async function loadPlatformConfig(){return {
 enabled:true,providers:{google:true,kakao:true,naver:true},providerStatus:{naver:'review-required'},
 firebase:{},apiBase:'/api',socialApiBase:'/api'
};}
export async function createSiteClient(){throw Error('합성 검사에는 실제 보관소를 연결하지 않습니다.');}`;
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const server=http.createServer(async(req,res)=>{
  try{
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(pathname==='/shared/platform/v1/registry.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({sites:{fixture:{name:'검사 사이트',url:'#',origins:[],integration:'snapshot-adapter'}}}));return;}
   if(pathname==='/shared/platform/v1/sdk.mjs'){res.setHeader('Content-Type','text/javascript');res.end(sdkModule);return;}
   if(pathname==='/shared/platform/v1/crypto.mjs'){res.setHeader('Content-Type','text/javascript');res.end("export const randomSecret=()=>'',challengeFor=async()=>'';");return;}
   if(pathname==='/api/providers'){res.setHeader('Content-Type','application/json');res.end('{"providers":["google.com","kakao","naver"]}');return;}
   const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
   if(!file.startsWith(root+path.sep))throw Error('path');
   res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
   res.end(await fs.readFile(file));
  }catch{res.statusCode=404;res.end('not found');}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{browser=await chromium.launch({headless:true});}catch(error){await new Promise(resolve=>server.close(resolve));throw error;}
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('https://www.gstatic.com/**',route=>route.fulfill({contentType:'text/javascript',body:route.request().url().includes('firebase-app')?'export const initializeApp=()=>({});':authModule}));
 await page.route('**/*',async(route)=>{
  const url=new URL(route.request().url());
  if(url.hostname==='127.0.0.1'||url.hostname==='www.gstatic.com')return route.fallback();
  return route.abort();
 });
 try{
  for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:960});
   await page.goto('http://127.0.0.1:'+server.address().port+'/account/');
   const google=page.locator('#google');await google.waitFor();
   await page.waitForFunction(()=>!document.getElementById('google').disabled);
   await page.screenshot({path:path.join(output,'account-ready-'+width+'.png')});
   const box=await google.boundingBox();
   await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
   await page.waitForTimeout(150);
   const pressed=await google.evaluate(el=>getComputedStyle(el).transform);assert.notEqual(pressed,'none');
   await page.screenshot({path:path.join(output,'account-pressed-'+width+'.png')});
   await page.mouse.up();
   await page.waitForFunction(()=>document.getElementById('google').getAttribute('aria-busy')==='true');
   assert.equal(await google.innerText(),'Google 로그인 중…');
   assert.equal(await page.locator('#kakao').isDisabled(),true);
   assert.equal(await page.locator('[data-link="naver"]').isDisabled(),true);
   assert.equal(await page.locator('#status').getAttribute('data-state'),'busy');
   await page.evaluate(()=>{document.getElementById('google').click();document.getElementById('kakao').click();});
   assert.equal(await page.evaluate(()=>feedbackFixture.calls),1);
   await page.screenshot({path:path.join(output,'account-loading-'+width+'.png')});
   await page.evaluate(()=>feedbackFixture.fail('auth/popup-closed-by-user'));
   await page.waitForFunction(()=>!document.getElementById('google').disabled);
   assert.equal(await google.innerText(),'Google로 계속하기');
   assert.equal(await google.getAttribute('aria-busy'),null);
   assert.match(await page.locator('#status').innerText(),/취소됐습니다/);
   assert.equal(await page.locator('#status').getAttribute('data-state'),'error');
   assert.equal(await page.locator('#naver').innerText(),'네이버 로그인 · 승인 대기');
   assert.equal(await page.locator('#kakao').isEnabled(),true);
   await google.click();await page.evaluate(()=>feedbackFixture.succeed());
   await page.waitForFunction(()=>document.getElementById('status').dataset.state==='success');
   assert.equal(await google.isEnabled(),true);
   assert.equal(await page.locator('[data-link="naver"]').isEnabled(),false);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#google').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.getElementById('google').getAttribute('aria-busy')==='true');
  assert.equal(await page.locator('#google').evaluate(el=>getComputedStyle(el,'::before').animationName),'none');
  await page.evaluate(()=>feedbackFixture.fail('auth/popup-blocked'));
  await page.waitForFunction(()=>!document.getElementById('google').disabled);
  assert.match(await page.locator('#status').innerText(),/팝업이 차단/);
  await page.getByRole('button',{name:'나의 보관소',exact:true}).click();
  await page.locator('#vault-load').click();
  await page.waitForFunction(()=>document.getElementById('vault-status').dataset.state==='error');
  assert.equal(await page.locator('#vault-load').isEnabled(),true);
  assert.equal(await page.locator('#sites button').isEnabled(),true);
  assert.deepEqual(errors,[]);
  console.log('Account feedback: pointer press, progress, duplicate prevention, cancellation, success, popup retry, keyboard, reduced motion and vault recovery passed at 320/390/1280px.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});

