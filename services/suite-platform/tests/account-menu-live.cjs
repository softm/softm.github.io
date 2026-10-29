// Read-only smoke check of public, deployed apps. Never submit login or touch user data.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.env.SUITE_UI_RUNTIME,'node_modules/playwright'));
const out=process.env.SUITE_UI_OUTPUT||'verification';
const sites=[
 ['weatherhannun','https://softm.github.io/weatherhannun/'],['juyuhannun','https://softm.github.io/juyuhannun/'],
 ['evchargingstation','https://softm.github.io/evchargingstation/'],['hydrogenstation','https://softm.github.io/hydrogenstation/'],
 ['foodhannun','https://softm.github.io/foodhannun/'],['matjiphannun','https://softm.github.io/matjiphannun/'],
 ['policyfundfinder','https://policyfundfinder.designboard.net/'],['homecare','https://homecare.designboard.net/'],
 ['auctionhannun','https://auctionhannun.designboard.net/'],['goldsignal','https://goldsignal.designboard.net/'],
 ['bizhannun','https://softm.github.io/bizhannun/'],['calc','https://softm.github.io/calc/'],
 ['norn','https://norn.designboard.net/'],['wirohaeyo','https://softm.github.io/wirohaeyo/']
];
(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch();const results=[];
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
  let deployed=false;
  for(let attempt=0;attempt<24;attempt++){
   const response=await context.request.get('https://softm.github.io/shared/platform/v1/account-menu.mjs?verify='+Date.now(),{timeout:20000});
   if(response.ok()&&(await response.text()).includes('const layoutObserver=new ResizeObserver')){deployed=true;break;}
   await new Promise(resolve=>setTimeout(resolve,5000));
  }
  assert.ok(deployed,'latest account layout fixes have not reached Pages');
  try{
   const response=await context.request.get('https://asia-northeast3-softm-hannun-api.cloudfunctions.net/suiteSocialAuth/health',{timeout:15000});
   const value=await response.json();
   const health={httpStatus:response.status(),checkedAt:new Date().toISOString(),expectedProfileVersion:'20261030-1',profileCodeDeployed:response.ok()&&value.ok===true&&value.profileVersion==='20261030-1',response:value};
   await fs.writeFile(path.join(out,'social-profile-deployment.json'),JSON.stringify(health,null,2));
   console.log('Social profile backend deployment:',JSON.stringify(health));
  }catch(error){await fs.writeFile(path.join(out,'social-profile-deployment.json'),JSON.stringify({verified:false,error:String(error.message).slice(0,300)}));}
  const queue=[...sites];
  async function worker(){
   while(queue.length){const [siteId,url]=queue.shift(),page=await context.newPage(),entry={siteId,url,viewports:[],ok:false};
    try{
     if(siteId==='weatherhannun'){
      // Weather data can finish loading after either viewport check starts.
      // Close the real briefing UI; never hide it with JS or force clicks.
      await page.addLocatorHandler(page.locator('#startupWeatherBriefing[open]'),async dialog=>{
       await dialog.getByRole('button',{name:'지금은 닫기',exact:true}).click();
       entry.briefingDismissed=true;
      });
     }
     await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
     const selector=`softm-site-account[data-site="${siteId}"][data-account-ui="icon-menu-v2"]`;
     const host=page.locator(selector),trigger=host.locator('#profile');
     await host.waitFor({state:'visible',timeout:20000});
     await page.waitForFunction(selector=>document.querySelectorAll(selector).length===1,selector,{timeout:10000});
     if(siteId==='weatherhannun'){
      // Use the actual defer action; no device location is granted.
      const later=page.getByRole('button',{name:'다음에 설정할게요',exact:true});
      let visible=false;
      try{await later.waitFor({state:'visible',timeout:8000});visible=true;}catch(error){if(error.name!=='TimeoutError')throw error;}
      if(visible){await later.click();await later.waitFor({state:'hidden'});entry.onboarding='location deferred through visible UI';}
     }
     for(const width of [390,1280]){
      await page.setViewportSize({width,height:844});await page.waitForTimeout(400);
      const rect=await trigger.boundingBox();assert.ok(rect&&rect.x>=0&&rect.x+rect.width<=width&&rect.y>=0&&rect.y<220,'account trigger must be in the top viewport');
      await trigger.click();const menu=page.locator(`softm-account-popover[data-site="${siteId}"] #menu`);await menu.waitFor({state:'visible'});
      const bounds=await menu.boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width&&bounds.y>=0&&bounds.y+bounds.height<=844,'menu must not be clipped');
      assert.equal(await menu.locator('#login').isVisible(),true,'fresh context is logged out');
      assert.equal(await menu.locator('#signup').isVisible(),true,'signup remains separate from the vault');
      await page.screenshot({path:path.join(out,`${siteId}-${width}.png`)});await page.keyboard.press('Escape');assert.equal(await menu.isVisible(),false);
      entry.viewports.push({width,trigger:rect,menu:bounds});
     }
     entry.ok=true;
    }catch(error){
     entry.error=String(error.message).slice(0,1600);
     entry.dom=await page.evaluate(()=>[...document.querySelectorAll('softm-site-account')].map(el=>{
      const ancestors=[];for(let n=el;n&&ancestors.length<5;n=n.parentElement){const r=n.getBoundingClientRect(),s=getComputedStyle(n);ancestors.push({tag:n.tagName,class:n.className,rect:{x:r.x,y:r.y,width:r.width,height:r.height},display:s.display,visibility:s.visibility,pointerEvents:s.pointerEvents});}
      return {site:el.dataset.site,ancestors};
     })).catch(()=>[]);
     await page.screenshot({path:path.join(out,`${siteId}-failure.png`)}).catch(()=>{});
    }
    finally{results.push(entry);console.log(JSON.stringify(entry));await page.close();}
   }
  }
  await Promise.all([worker(),worker(),worker()]);
 }finally{await browser.close();await fs.writeFile(path.join(out,'live-account-menu-results.json'),JSON.stringify(results,null,2));}
 const failed=results.filter(r=>!r.ok);console.log(`Deployed account menus: ${results.length-failed.length}/${results.length} passed.`);
 if(process.env.GITHUB_STEP_SUMMARY){await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,'## Public guest account menus\n\n| Site | Result |\n|---|---|\n'+results.map(r=>`| ${r.siteId} | ${r.ok?'PASS (390 / 1280px)':'FAIL'} |`).join('\n')+'\n\nThese checks do not authenticate real SNS accounts. Firebase profile-server deployment is recorded separately in social-profile-deployment.json.\n');}
 if(failed.length){console.error('Not verified:',failed.map(r=>r.siteId).join(', '));process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});