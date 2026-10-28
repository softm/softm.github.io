const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.SUITE_UI_RUNTIME,'node_modules/playwright'));
const root=path.resolve(__dirname,'../../..'),output=process.env.SUITE_UI_OUTPUT;
(async()=>{
 const server=http.createServer(async(req,res)=>{try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="ko"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><header style="display:flex;justify-content:space-between"><h1>보관소 검사</h1></header><main>실계정이 아닌 검사 전용 화면</main></body></html>');return;}
   const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep))throw Error('path');
   res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':'text/plain');res.end(await fs.readFile(file));
 }catch{res.statusCode=404;res.end('not found');}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  const {mountSiteVault}=await import('/shared/platform/v1/site-vault.mjs');
  localStorage.setItem('favorite','["station-001"]');localStorage.setItem('auth-token','never-export');
  const state={row:null,backups:new Map(),counter:0,listeners:[]};
  const client={currentUser:null,onUser(fn){state.listeners.push(fn);fn(this.currentUser);return ()=>{};},
   async login({popup}){this.currentUser={uid:'fixture-user'};state.listeners.forEach(f=>f(this.currentUser));popup.close();},
   async logout(){this.currentUser=null;state.listeners.forEach(f=>f(null));},
   async get(id,{password}){if(!state.row)return null;const {unseal}=await import('/shared/platform/v1/crypto.mjs');return {revision:state.row.revision,value:await unseal(state.row.cipher,password,'head')};},
   async put(id,value,{password,expectedRevision}){if((state.row?.revision||0)!==expectedRevision)throw Error('conflict');const {seal}=await import('/shared/platform/v1/crypto.mjs');state.row={revision:expectedRevision+1,cipher:await seal(value,password,'head')};return state.row.revision;},
   async remove(id,{expectedRevision}){if(state.row?.revision!==expectedRevision)throw Error('conflict');state.row=null;},
   async uploadEncryptedBackup(text){const id='snapshot-'+(++state.counter);state.backups.set(id,text);return {id};},
   async downloadBackup(id){return state.backups.get(id);},async deleteBackup(id){state.backups.delete(id);}
  };
  window.fixture={state,client};
  mountSiteVault({siteId:'fixture',name:'검사 사이트',keys:['favorite'],label:'관심 충전소',sdkLoader:async()=>({createSiteClient:async()=>client})});
 });
 await page.getByRole('button',{name:'내 보관소',exact:true}).click();
 await page.getByRole('textbox',{name:'이 사이트의 개인 메모'}).fill('테스트 메모');
 await page.getByRole('button',{name:'Google · 카카오 · 네이버 로그인',exact:true}).click();
 await page.getByLabel('보관소 암호 · 10자 이상').fill('fixture-password-123');
 await page.getByRole('button',{name:'저장본 확인',exact:true}).click();
 await page.getByRole('button',{name:'현재 자료 저장',exact:true}).click();
 await page.getByRole('status').filter({hasText:'암호화 저장을 완료'}).waitFor();
 assert.equal(await page.evaluate(()=>[...fixture.state.backups.values()].some(x=>x.includes('테스트 메모')||x.includes('never-export')||x.includes('station-001'))),false);
 await page.getByLabel('이 창에서 변경한 자료 자동 저장').check();
 await page.getByLabel('이 창에서 변경한 자료 자동 저장').uncheck();
 assert.equal(await page.getByLabel('이 창에서 변경한 자료 자동 저장').isChecked(),false);
 await page.getByRole('textbox',{name:'이 사이트의 개인 메모'}).fill('변경 중인 메모');
 const cancelledDialog=page.waitForEvent('dialog');
 await page.getByRole('button',{name:'선택한 자료 복원',exact:true}).click();
 await (await cancelledDialog).dismiss();
 await page.waitForFunction(()=>!document.querySelector('softm-site-vault').shadowRoot.getElementById('restore').disabled);
 assert.equal(await page.getByRole('textbox',{name:'이 사이트의 개인 메모'}).inputValue(),'변경 중인 메모');
 const acceptedDialog=page.waitForEvent('dialog');
 await page.getByRole('button',{name:'선택한 자료 복원',exact:true}).click();
 await (await acceptedDialog).accept();
 await page.getByRole('button',{name:'복원한 사이트 새로 열기'}).waitFor();
 assert.equal(await page.getByRole('textbox',{name:'이 사이트의 개인 메모'}).inputValue(),'테스트 메모');
 assert.equal(await page.evaluate(()=>localStorage.getItem('auth-token')),'never-export');
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:900});
  const box=await page.getByRole('dialog').boundingBox();
  assert.ok(box.x>=0&&box.x+box.width<=width+1);
  assert.ok(await page.evaluate(()=>{const d=document.querySelector('softm-site-vault').shadowRoot.querySelector('dialog');return d.scrollWidth<=d.clientWidth+1;}));
  await page.screenshot({path:path.join(output,'site-vault-'+width+'.png'),fullPage:true});
 }
 await page.getByRole('button',{name:'이 사이트 로그아웃',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('softm-site-vault').shadowRoot.getElementById('password').value==='');
 // SOFTM-HOMECARE-VAULT START 날짜:20261028 : 고정 지도 도구가 헤더를 덮는 사이트에서도 실제 메뉴와 중첩 보관소를 조작
 await page.getByRole('button',{name:'보관소 닫기',exact:true}).click();
 await page.evaluate(async()=>{
  const {mountSiteVault}=await import('/shared/platform/v1/site-vault.mjs');
  const {SITE_INTEGRATIONS}=await import('/shared/platform/v1/site-integrations.mjs');
  document.body.insertAdjacentHTML('beforeend','<button id="fixture-menu-toggle">전체 메뉴 열기</button><dialog class="care-navigation-menu" aria-label="돌봄한눈 메뉴"><nav aria-label="보조 탐색"></nav></dialog>');
  const menu=document.querySelector('.care-navigation-menu');
  document.getElementById('fixture-menu-toggle').onclick=()=>menu.showModal();
  mountSiteVault({siteId:'homecare',...SITE_INTEGRATIONS.homecare});
 });
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:900});
  await page.getByRole('button',{name:'전체 메뉴 열기',exact:true}).click();
  const menu=page.getByRole('dialog',{name:'돌봄한눈 메뉴',exact:true});
  await menu.getByRole('button',{name:'내 보관소',exact:true}).press('Enter');
  const vault=page.getByRole('dialog',{name:'돌봄한눈 보관소',exact:true});
  await vault.waitFor({state:'visible'});
  const box=await vault.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
  await page.screenshot({path:path.join(output,'homecare-menu-vault-'+width+'.png')});
  await vault.getByRole('button',{name:'보관소 닫기',exact:true}).click();
  assert.equal(await menu.isVisible(),true);
  await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});
 }
 // SOFTM-HOMECARE-VAULT END
 assert.deepEqual(errors,[]);
 console.log('Fixture UI: login handoff, encrypted save, cancellation, restore, auto-off, logout, 320/390/1280 widths passed. Real SNS accounts were not used.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
