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
  const queue=[...sites];
  async function worker(){
   while(queue.length){const [siteId,url]=queue.shift(),page=await context.newPage(),entry={siteId,url,viewports:[],ok:false};
    try{
     await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
     const host=page.locator(`softm-site-account[data-site="${siteId}"][data-account-ui="icon-menu-v2"]`),trigger=host.locator('#profile');
     await host.waitFor({state:'visible',timeout:20000});assert.equal(await host.count(),1,'one shared account trigger');
     for(const width of [390,1280]){
      await page.setViewportSize({width,height:844});await page.waitForTimeout(200);
      const rect=await trigger.boundingBox();assert.ok(rect&&rect.x>=0&&rect.x+rect.width<=width&&rect.y>=0&&rect.y<220,'account trigger must be in the top viewport');
      await trigger.click();const menu=page.locator(`softm-account-popover[data-site="${siteId}"] #menu`);await menu.waitFor({state:'visible'});
      const bounds=await menu.boundingBox();assert.ok(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width&&bounds.y>=0&&bounds.y+bounds.height<=844,'menu must not be clipped');
      assert.equal(await menu.locator('#login').isVisible(),true,'fresh context is logged out');
      await page.screenshot({path:path.join(out,`${siteId}-${width}.png`)});await page.keyboard.press('Escape');assert.equal(await menu.isVisible(),false);
      entry.viewports.push({width,trigger:rect,menu:bounds});
     }
     entry.ok=true;
    }catch(error){entry.error=String(error.message).slice(0,1200);await page.screenshot({path:path.join(out,`${siteId}-failure.png`)}).catch(()=>{});}
    finally{results.push(entry);console.log(JSON.stringify(entry));await page.close();}
   }
  }
  await Promise.all([worker(),worker(),worker()]);
 }finally{await browser.close();await fs.writeFile(path.join(out,'live-account-menu-results.json'),JSON.stringify(results,null,2));}
 const failed=results.filter(r=>!r.ok);console.log(`Deployed account menus: ${results.length-failed.length}/${results.length} passed.`);
 if(failed.length){console.error('Not verified:',failed.map(r=>r.siteId).join(', '));process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});
