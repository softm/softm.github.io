// Synthetic UI regression tests. No real OAuth or user data is used.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.SUITE_UI_RUNTIME?path.join(process.env.SUITE_UI_RUNTIME,'node_modules/playwright'):'playwright');
const root=path.resolve(__dirname,'../../..'),output=process.env.SUITE_UI_OUTPUT||path.join(root,'verification');
const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#f2f6fa;font-family:system-ui}header{display:flex;justify-content:space-between;align-items:center;padding:12px;overflow:hidden;transform:translateZ(0);background:#fff}h1{font-size:18px}main{height:1000px}</style><body><header><h1>계정 메뉴 검사</h1><div id="anchor"></div></header><main></main><script type="module">
import {mountSiteAccount} from '/shared/platform/v1/account-menu.mjs';
let user=null;const subs=new Set();window.fixture={loginCalls:0,logoutCalls:0,vaultCalls:0,popups:0,blocked:false};
function emit(u){user=u;for(const f of subs)f(user);}window.emitUser=emit;
const account={get currentUser(){return user;},subscribe(f){subs.add(f);f(user);return ()=>subs.delete(f);},ready:async()=>{},login:async()=>{fixture.loginCalls++;return new Promise((resolve,reject)=>{fixture.resolveLogin=u=>{emit(u);resolve(u)};fixture.rejectLogin=()=>reject(new Error('로그인을 취소했습니다.'));});},logout:async()=>{fixture.logoutCalls++;emit(null);}};
window.open=()=>{fixture.popups++;return fixture.blocked?null:{close(){fixture.closed=true;}}};
window.widget=mountSiteAccount({siteId:'fixture',name:'검사 앱',target:'#anchor',account,vault:{open(){fixture.vaultCalls++;}}});
</script></body></html>`;
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const server=http.createServer(async(req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname;if(p==='/'){res.setHeader('Content-Type','text/html');res.end(html);return;}const file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/plain');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end('not found');}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
 try{
  browser=await chromium.launch();const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://profiles.example.test/good.svg',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#164a68"/><text x="40" y="54" text-anchor="middle" fill="white" font-size="40">T</text></svg>'}));
  await page.route('https://profiles.example.test/bad.svg',route=>route.fulfill({status:404,body:'not found'}));
  for(const width of [320,390,768,1280]){
   await page.setViewportSize({width,height:800});await page.goto('http://127.0.0.1:'+server.address().port+'/');
   await page.locator('softm-site-account[data-auth-state="guest"]').waitFor();
   await page.waitForFunction(()=>document.querySelector('softm-site-account').shadowRoot.querySelector('link').sheet!==null);
   const trigger=page.locator('softm-site-account #profile'),menu=page.locator('softm-account-popover #menu');
   assert.equal(await menu.isVisible(),false);await trigger.click();assert.equal(await menu.isVisible(),true);
   const box=await menu.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);
   await page.screenshot({path:path.join(output,'account-menu-guest-'+width+'.png')});
   await page.keyboard.press('Escape');assert.equal(await menu.isVisible(),false);
   await trigger.press('ArrowDown');assert.equal(await page.locator('softm-account-popover #login').evaluate(el=>el===el.getRootNode().activeElement),true);
   await page.mouse.click(8,600);assert.equal(await menu.isVisible(),false);
   const user={uid:'fixture-user',displayName:'검사 회원',photoURL:'https://profiles.example.test/good.svg',providerData:[{providerId:'google.com'}]};
   await page.evaluate(user=>emitUser(user),user);await trigger.click();
   await page.waitForFunction(()=>{const img=document.querySelector('softm-site-account').shadowRoot.querySelector('img');return img&&!img.hidden&&img.naturalWidth>0;});
   assert.equal(await page.locator('softm-account-popover #login').isVisible(),false);assert.equal(await page.locator('softm-account-popover #logout').isVisible(),true);
   assert.equal(await page.locator('softm-account-popover #account-name').innerText(),'검사 회원');
   await page.screenshot({path:path.join(output,'account-menu-member-'+width+'.png')});
   await page.locator('softm-account-popover #vault').click();assert.equal(await page.evaluate(()=>fixture.vaultCalls),1);assert.equal(await menu.isVisible(),false);
   await trigger.click();await page.locator('softm-account-popover #logout').click();await page.locator('softm-site-account[data-auth-state="guest"]').waitFor();assert.equal(await page.locator('softm-site-account img').count(),0);
   await page.evaluate(user=>emitUser(user),{...user,uid:'fixture-other',photoURL:'https://profiles.example.test/bad.svg'});
   await page.waitForFunction(()=>!document.querySelector('softm-site-account').shadowRoot.querySelector('img'));
   assert.equal(await page.locator('softm-site-account .avatar').innerText(),'검');
   await page.evaluate(()=>emitUser(null));await trigger.click();await page.locator('softm-account-popover #login').click();
   assert.equal(await page.evaluate(()=>fixture.popups),1);assert.equal(await page.locator('softm-account-popover #signup').isDisabled(),true);
   await page.evaluate(()=>document.querySelector('softm-account-popover').shadowRoot.querySelector('#login').click());assert.equal(await page.evaluate(()=>fixture.loginCalls),1);
   await page.evaluate(user=>fixture.resolveLogin(user),user);await page.locator('softm-site-account[data-auth-state="authenticated"]').waitFor();assert.equal(await menu.isVisible(),false);
   await page.evaluate(()=>{document.querySelector('header').innerHTML='<h1>새 헤더</h1><div id="anchor"></div>';});
   await page.waitForFunction(()=>document.querySelector('#anchor > softm-site-account')!==null);assert.equal(await page.locator('softm-site-account').count(),1);assert.equal(await page.locator('softm-account-popover').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  await page.evaluate(()=>emitUser(null));await page.locator('softm-site-account #profile').click();await page.evaluate(()=>fixture.blocked=true);await page.locator('softm-account-popover #login').click();assert.match(await page.locator('softm-account-popover #feedback').innerText(),/팝업을 허용/);
  await page.evaluate(()=>fixture.blocked=false);await page.locator('softm-account-popover #login').click();await page.evaluate(()=>fixture.rejectLogin());await page.waitForFunction(()=>!document.querySelector('softm-account-popover').shadowRoot.querySelector('#login').disabled);assert.match(await page.locator('softm-account-popover #feedback').innerText(),/취소/);
  await page.evaluate(()=>emitUser({uid:'fixture-xss',displayName:'<img src=x onerror=alert(1)>',photoURL:'javascript:alert(1)'}));await page.locator('softm-site-account #profile').click();assert.equal(await page.locator('softm-account-popover #account-name img').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('softm-site-account #profile').evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
  await page.evaluate(()=>widget.destroy());assert.equal(await page.locator('softm-site-account,softm-account-popover').count(),0);assert.deepEqual(errors,[]);
  console.log('Account menu passed: guest/member/avatar/fallback/logout, popup retry, keyboard, overflow, remount and cleanup at 320/390/768/1280px.');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
