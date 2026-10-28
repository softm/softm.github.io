const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.SUITE_UI_RUNTIME,'node_modules/playwright'));
const root=path.resolve(__dirname,'../../..'),output=process.env.SUITE_UI_OUTPUT;
(async()=>{
 const html=await fs.readFile(path.join(root,'account/index.html'),'utf8'),section=html.slice(html.indexOf('<section id="withdrawal"'),html.indexOf('<footer>'));
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/account/style.css"><body><main><section id="login-card">합성 로그인 화면</section>'+section+`<script type="module">
import {mountWithdrawal} from '/account/withdrawal.mjs';
window.fixture={user:{uid:'synthetic-user',displayName:'검사 계정'},mode:'recent',calls:0,logouts:0,complete:false,accepted:false};
const post=async(url,body)=>{
 if(url.endsWith('/status')){if(!fixture.accepted){const e=Error('not found');e.httpStatus=404;throw e;}return {state:fixture.complete?'complete':'processing'};}
 fixture.calls++;fixture.lastBody=body;
 if(fixture.mode==='recent'){const e=Error('같은 SNS 계정으로 다시 로그인해 주세요.');e.httpStatus=401;throw e;}
 fixture.accepted=true;if(fixture.mode==='lost')throw TypeError('synthetic lost response');return {accepted:true};
};
const controller=mountWithdrawal({post,getUser:()=>fixture.user,randomSecret:()=> 'r'.repeat(43),logout:async()=>{fixture.user=null;fixture.logouts++;controller.onUser(null);},setLocked:value=>{fixture.locked=value;}});
controller.onUser(fixture.user);await controller.resume();window.controller=controller;
</script></main></body></html>`);return;}
  const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':'text/css');res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('#withdrawal').waitFor({state:'visible'});
  assert.equal(await page.locator('#withdraw-submit').isDisabled(),true);
  await page.locator('#withdraw-ack').check();await page.locator('#withdraw-confirmation').fill('회원탈퇴');assert.equal(await page.locator('#withdraw-submit').isEnabled(),true);
  page.once('dialog',dialog=>dialog.dismiss());await page.locator('#withdraw-submit').click();assert.equal(await page.evaluate(()=>fixture.calls),0);
  page.once('dialog',dialog=>dialog.accept());await page.locator('#withdraw-submit').click();await page.locator('#withdraw-status').filter({hasText:'다시 로그인'}).waitFor();
  assert.equal(await page.evaluate(()=>fixture.logouts),0);assert.equal(await page.evaluate(()=>fixture.locked),false);assert.equal(await page.evaluate(()=>sessionStorage.getItem('softm-withdrawal-receipt-v1')),null);
  await page.evaluate(()=>{fixture.mode='lost';});page.once('dialog',dialog=>dialog.accept());await page.locator('#withdraw-submit').click();
  await page.locator('#withdraw-status').filter({hasText:'처리 중'}).waitFor();assert.equal(await page.evaluate(()=>fixture.logouts),1);assert.equal(await page.evaluate(()=>fixture.locked),true);assert.equal(await page.locator('#withdraw-submit').isDisabled(),true);
  const body=await page.evaluate(()=>fixture.lastBody);assert.equal(body.uid,'synthetic-user');assert.equal(body.confirmation,'회원탈퇴');assert.equal(body.acknowledged,true);assert.match(body.receipt,/^[A-Za-z0-9_-]{43}$/);
  await page.evaluate(()=>{fixture.complete=true;});await page.locator('#withdraw-recheck').click();await page.locator('#withdraw-status').filter({hasText:'회원탈퇴가 완료'}).waitFor();assert.equal(await page.evaluate(()=>sessionStorage.getItem('softm-withdrawal-receipt-v1')),null);
  for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.locator('#withdrawal').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);await page.screenshot({path:path.join(output,'withdrawal-complete-'+width+'.png'),fullPage:true});}
  assert.deepEqual(errors,[]);console.log('Withdrawal UI: confirmation, cancel, recent-login denial, ambiguous committed response, logout, receipt polling, completion and responsive widths passed.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
