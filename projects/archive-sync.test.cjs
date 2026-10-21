'use strict';
const assert=require('node:assert/strict');
const {archiveRows,jsonArchiveRows,syncProjects}=require('./archive-sync.js');
const browser=require('./project-home.js');
const project={repo:'hwagok-farm',publicUrl:'https://softm.github.io/hwagok-farm/',publicRepoUrl:'https://github.com/softm/hwagok-farm'};
const row={date:'2026-09-23',title:'사용자 원본 HTML 제목',dir:'20260923-test',kind:'아카이브',desc:'원본 설명',url:project.publicUrl+'records/20260923-test/',repoUrl:project.publicRepoUrl+'/tree/main/public/records/20260923-test'};
const canonical=archiveRows([row],project)[0];
assert.equal(canonical.title,row.title);
assert.equal(canonical.date,row.date);
assert.equal(canonical.url,row.url);
assert.equal(canonical.repoUrl,row.repoUrl);
assert.equal(canonical.recordPath,'public/records/'+row.dir);
assert.equal(canonical.dateSource,'archive-canonical');
assert.deepEqual(archiveRows([],project),[]);
const rootRow={...row,repoUrl:project.publicRepoUrl+'/tree/main/records/'+row.dir};
assert.equal(archiveRows([rootRow],project)[0].recordPath,'records/'+row.dir);
// SOFTM-unicode-archive-slug-test START: 안전한 한글 슬러그와 GitHub URL 정규화 검증 (2026-10-15)
const unicodeDir='20261009-화곡농장-보유-농약-정리';
const unicodeRow={...row,dir:unicodeDir,url:project.publicUrl+'records/'+unicodeDir+'/',repoUrl:project.publicRepoUrl+'/tree/main/public/records/'+unicodeDir};
assert.equal(archiveRows([unicodeRow],project)[0].recordPath,'public/records/'+unicodeDir);
// SOFTM-unicode-archive-slug-test END: 안전한 한글 슬러그와 GitHub URL 정규화 검증 (2026-10-15)
const jsonProject={repo:'baksok-public',publicUrl:'https://softm.github.io/baksok-public/',publicRepoUrl:'https://github.com/softm/baksok-public'};
const jsonData={errors:[],records:[{slug:'2025-front-window-design',date:'2025',title:'전면 유리 디자인',category:'디자인',input:'2025_전면유리',files:[{path:'images/a.jpg',size:10},{path:'index.html',size:20},{path:'notes.md',size:30}]}]};
const jsonRow=jsonArchiveRows(jsonData,jsonProject)[0];
assert.equal(jsonRow.date,'2025');
assert.equal(jsonRow.url,jsonProject.publicUrl+'records/2025-front-window-design/');
assert.equal(jsonRow.repoUrl,jsonProject.publicRepoUrl+'/tree/main/records/2025-front-window-design');
assert.equal(jsonRow.recordPath,'records/2025-front-window-design');
assert.equal(jsonRow.count,3);
assert.deepEqual(jsonRow.files,{images:1,videos:0,audio:0,documents:1,archives:0});

const registrationJson=jsonArchiveRows({...jsonData,records:[{...jsonData.records[0],date:'2026-10-22',dateBasis:'archive_created',eventDate:null}]},jsonProject)[0];
assert.equal(registrationJson.dateSource,'archive-canonical');
assert.equal(registrationJson.dateBasis,'archive_created');
assert.equal(registrationJson.eventDate,null);
assert.equal(browser.display(registrationJson).displayDate,'2026-10-22');
const eventArchive=archiveRows([{...row,dateBasis:'event-date',eventDate:row.date}],project)[0];
assert.equal(eventArchive.dateBasis,'event-date');
assert.equal(eventArchive.eventDate,row.date);

assert.throws(()=>jsonArchiveRows({...jsonData,errors:[{error:'failed'}]},jsonProject));
assert.throws(()=>jsonArchiveRows({...jsonData,records:[jsonData.records[0],jsonData.records[0]]},jsonProject));
for(const repoUrl of ['https://github.com/other/repo/tree/main/records/'+row.dir,project.publicRepoUrl+'/tree/main/private/records/'+row.dir,project.publicRepoUrl+'/tree/main/records/other'])assert.throws(()=>archiveRows([{...row,repoUrl}],project));
for(const bad of [{...row,dir:'../bad'},{...row,title:''},{...row,date:'2026-02-30'},{...row,url:'https://private.vercel.app/'},{...row,repoUrl:project.publicRepoUrl}])assert.throws(()=>archiveRows([bad],project));
assert.throws(()=>archiveRows([row,row],project));
assert.throws(()=>archiveRows({},project));
assert.throws(()=>archiveRows([row],{...project,publicUrl:'https://private.vercel.app/'}));
const meta={entries:{[browser.keyFor(row.url)]:{authoredAt:'2026-10-05',userTitle:'OLD TITLE'}}};
const shown=browser.lists({...project,links:[canonical],chatMetadata:{[browser.keyFor(row.url)]:{userTitle:'OTHER OLD TITLE'}}},meta).public[0];
assert.equal(shown.displayName,row.title);
assert.equal(shown.displayTitle,row.title);
assert.equal(shown.displayDate,row.date);
const card=browser.card(browser.record(project,shown,0,'public'),'cards');
assert.ok(card.includes('datetime="'+row.date+'"'));
assert.ok(card.includes(row.repoUrl));
assert.ok(!card.includes('OLD TITLE'));
assert.ok(!card.includes('작성일 미확인'));
let calls=[];
global.DOMParser=class{parseFromString(markup){return{querySelector(selector){assert.equal(selector,'script#archive-data[type="application/json"]');return {textContent:markup}}}}};
const privateLink={visibility:'private',url:'https://private.vercel.app/secret/',label:'Private link'};
function input(){return {...project,links:[{visibility:'public',url:project.publicUrl+'old/',label:'STALE'},privateLink]}}
async function run(){
 global.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,text:async()=>JSON.stringify([row])}};
 let p=input();await syncProjects([p]);
 assert.equal(p.archiveSync.status,'ok');assert.equal(p.homePublicListCount,1);
 assert.deepEqual(p.links.map(x=>x.url),[row.url,privateLink.url]);
 assert.equal(calls.length,1);assert.equal(calls[0].options.cache,'no-store');
 assert.equal(calls[0].options.credentials,'omit');assert.equal(calls[0].options.redirect,'error');
 assert.ok(calls[0].url.startsWith(project.publicUrl+'?archive-sync='));
 global.fetch=async()=>({ok:false,status:503});p=input();await syncProjects([p]);
 assert.equal(p.archiveSync.status,'error');assert.equal(p.homePublicListCount,null);
 assert.deepEqual(p.links,[privateLink]);
 global.fetch=async()=>({ok:true,text:async()=>'[]'});p=input();await syncProjects([p]);
 assert.equal(p.archiveSync.status,'ok');assert.equal(p.homePublicListCount,0);assert.deepEqual(p.links,[privateLink]);
 global.fetch=async()=>({ok:true,text:async()=>JSON.stringify(jsonData)});
 p={...jsonProject,publicIndexSource:{url:jsonProject.publicUrl+'records/index.json',format:'json-record-index'},links:[privateLink]};await syncProjects([p]);
 assert.equal(p.archiveSync.status,'ok');assert.equal(p.homePublicListCount,1);
 assert.deepEqual(p.links.map(x=>x.url),[jsonRow.url,privateLink.url]);
 // SOFTM-persimmon-central-sync START: farm 공개 인덱스의 감나무 기록 제목·집계 동기화 검증 (2026-10-15)
 const farmProject={repo:'farm',publicUrl:'https://softm.github.io/farm/',publicRepoUrl:'https://github.com/softm/farm',publicIndexSource:{url:'https://softm.github.io/farm/archive-index.json',format:'json-archive-index'},links:[privateLink]};
 const farmRecord={slug:'20261015-persimmon-grafting-guide',listTitle:'20261015_감나무_접수_접목방법',sourceTitle:'2026-10-15 감나무 접수·접목 방법',titleSource:'inbox-name',date:'2026-10-15',dateBasis:'source-directory-name',kind:'재배 · 접목',visibility:'public',url:farmProject.publicUrl+'records/20261015-persimmon-grafting-guide/',repoUrl:farmProject.publicRepoUrl+'/tree/main/records/20261015-persimmon-grafting-guide',description:'원본 화면 146장',sourceIntegrityComplete:true,originalImageCount:146};
 global.fetch=async()=>({ok:true,text:async()=>JSON.stringify({repository:'softm/farm',records:[farmRecord]})});
 p={...farmProject};await syncProjects([p]);
 assert.equal(p.archiveSync.status,'ok');assert.equal(p.homePublicListCount,1);
 assert.equal(p.links[0].title,'20261015 감나무 접수·접목 방법');assert.equal(p.links[0].originalImageCount,146);
 assert.equal(p.links[1].url,privateLink.url);
 // SOFTM-persimmon-central-sync END: farm 공개 인덱스의 감나무 기록 제목·집계 동기화 검증 (2026-10-15)

 // Actual date/link fields from farm/archive-index.json after the 2026-10-22 license release.
 const actualFarmPayload={
   "repository": "softm/farm",
   "records": [
     {
       "slug": "20261009-herbicide-classification",
       "listTitle": "herbicide-guide-20261009.zip",
       "date": "2026-10-09",
       "dateBasis": "archive_created",
       "eventDate": null,
       "visibility": "public",
       "url": "https://softm.github.io/farm/records/20261009-herbicide-classification/",
       "repoUrl": "https://github.com/softm/farm/tree/main/records/20261009-herbicide-classification",
       "sourceIntegrityComplete": false
     },
     {
       "slug": "20261009-bak-cultivation",
       "listTitle": "20261009_박_적심도식_정리_MD_HTML_전체자료.zip",
       "date": "2026-10-09",
       "dateBasis": "archive_created",
       "eventDate": null,
       "visibility": "public",
       "url": "https://softm.github.io/farm/records/20261009-bak-cultivation/",
       "repoUrl": "https://github.com/softm/farm/tree/main/records/20261009-bak-cultivation",
       "sourceIntegrityComplete": false
     },
     {
       "slug": "20261009-sprinkler-thread-guide",
       "listTitle": "20261009_스프링클러_배관_나사_규격_정리_MD_HTML_전체자료.zip",
       "date": "2026-10-09",
       "dateBasis": "archive_created",
       "eventDate": null,
       "visibility": "public",
       "url": "https://softm.github.io/farm/records/20261009-sprinkler-thread-guide/",
       "repoUrl": "https://github.com/softm/farm/tree/main/records/20261009-sprinkler-thread-guide",
       "sourceIntegrityComplete": true
     },
     {
       "slug": "20261009-stake-inserter-purchase",
       "listTitle": "20261009_지주대_삽입기_구매기록.zip",
       "date": "2026-10-09",
       "dateBasis": "order-date",
       "visibility": "public",
       "url": "https://softm.github.io/farm/records/20261009-stake-inserter-purchase/",
       "repoUrl": "https://github.com/softm/farm/tree/main/records/20261009-stake-inserter-purchase",
       "sourceIntegrityComplete": true
     },
     {
       "slug": "20261015-persimmon-grafting-guide",
       "listTitle": "20261015_감나무_접수_접목방법",
       "date": "2026-10-15",
       "dateBasis": "source-directory-name",
       "visibility": "public",
       "url": "https://softm.github.io/farm/records/20261015-persimmon-grafting-guide/",
       "repoUrl": "https://github.com/softm/farm/tree/main/records/20261015-persimmon-grafting-guide",
       "sourceIntegrityComplete": true
     },
     {
       "slug": "20261006-autumn-seed-purchase",
       "listTitle": "20261006 무·시래기무·시금치 종자 구입 및 늦가을 파종 기록",
       "date": "2026-10-06",
       "dateBasis": "purchase-receipt",
       "visibility": "public",
       "url": "https://softm.github.io/farm/records/20261006-autumn-seed-purchase/",
       "repoUrl": "https://github.com/softm/farm/tree/main/records/20261006-autumn-seed-purchase",
       "sourceIntegrityComplete": false
     },
     {
       "slug": "20261022-farm-excavator-license",
       "listTitle": "농기계·굴착기면허·소형건설기계조종면허",
       "date": "2026-10-22",
       "dateBasis": "archive_created",
       "eventDate": null,
       "visibility": "public",
       "url": "https://softm.github.io/farm/records/20261022-farm-excavator-license/",
       "repoUrl": "https://github.com/softm/farm/tree/main/records/20261022-farm-excavator-license",
       "sourceIntegrityComplete": true
     }
   ]
 };
 global.fetch=async()=>({ok:true,text:async()=>JSON.stringify(actualFarmPayload)});
 p={...farmProject,title:'농업·농사',category:'농업',updatedAt:'2099-12-31',latestTitle:'stale snapshot title'};
 await syncProjects([p]);
 assert.equal(p.archiveSync.status,'ok');
 assert.equal(p.homePublicListCount,7);
 const licenseSlug='20261022-farm-excavator-license';
 const licenseUrl=farmProject.publicUrl+'records/'+licenseSlug+'/';
 const license=p.links.find(x=>x.url===licenseUrl);
 assert.equal(license.dateSource,'archive-canonical');
 assert.equal(license.dateBasis,'archive_created');
 assert.equal(license.eventDate,null);
 assert.ok(p.links.filter(x=>x.visibility==='public').every(x=>x.dateSource==='archive-canonical'));
 const staleMetadata={entries:{[browser.keyFor(licenseUrl)]:{authoredAt:'2099-12-31',userTitle:'stale date override'}}};
 const publicRows=browser.lists(p,staleMetadata).public.map((x,index)=>browser.record(p,x,index,'public'));
 assert.equal(publicRows.length,7);
 assert.ok(publicRows.every(x=>x.date));
 const shownLicense=publicRows.find(x=>x.url===licenseUrl);
 assert.equal(shownLicense.date,'2026-10-22');
 assert.equal(shownLicense.eventDate,null);
 assert.ok(browser.card(shownLicense,'cards').includes('등록 <time datetime="2026-10-22">2026-10-22</time>'));
 const unknown=browser.record(p,{listTitle:'20991231 날짜 미확인',date:'',dateSource:'archive-canonical',url:farmProject.publicUrl+'records/20991231-unknown/'},7,'public');
 assert.equal(unknown.date,null,'A filename/title date must not supply the sort date');
 const newest=browser.sortRows([...publicRows,unknown],'newest');
 const oldest=browser.sortRows([...publicRows,unknown],'oldest');
 assert.equal(newest[0].url,licenseUrl);
 assert.equal(oldest[0].recordDir,'20261006-autumn-seed-purchase');
 assert.equal(newest.at(-1),unknown);
 assert.equal(oldest.at(-1),unknown);
 assert.deepEqual(oldest.filter(x=>x.date).map(x=>x.date),newest.filter(x=>x.date).map(x=>x.date).reverse());
 const farmDirectory=browser.projectRecord(p,0,staleMetadata);
 assert.equal(farmDirectory.date,'2026-10-22','Project date must be the maximum member date');
 assert.equal(farmDirectory.latestRecordDateBasis,'archive_created');
 assert.equal(farmDirectory.publicCount,7);
 assert.equal(farmDirectory.privateCount,1);
 const olderDirectory=browser.projectRecord({repo:'older',title:'Earlier project',links:[{visibility:'public',listTitle:'Known earlier record',date:'2026-10-21',dateSource:'archive-canonical',url:'https://softm.github.io/older/records/known/'}]},1);
 const unknownDirectory=browser.projectRecord({repo:'20991231-unknown',title:'20991231 날짜 미확인 프로젝트',updatedAt:'2099-12-31',links:[{visibility:'public',label:'20991231 자료',url:'https://softm.github.io/unknown/records/20991231/'}]},2);
 assert.equal(unknownDirectory.date,null);
 assert.deepEqual(browser.sortRows([unknownDirectory,olderDirectory,farmDirectory],'newest').map(x=>x.project.repo),['farm','older','20991231-unknown']);
 assert.deepEqual(browser.sortRows([unknownDirectory,olderDirectory,farmDirectory],'oldest').map(x=>x.project.repo),['older','farm','20991231-unknown']);
 assert.equal(browser.authoredDate({date:'2026-10-22',dateBasis:'archive_created'}),'','Unqualified dates remain untrusted');
 console.log('PASS: actual farm payload latest/oldest ordering, registration/event date distinction, canonical precedence, project maximum date and unknown-last');

 calls=[];global.fetch=async()=>{calls.push('UNEXPECTED');throw new Error('Unexpected request')};
 p={...input(),publicIndexSource:{url:'https://private.vercel.app/',format:'html-archive-data'}};await syncProjects([p]);
 assert.equal(p.archiveSync.status,'error');assert.equal(calls.length,0);
 await syncProjects([{repo:'mine-private',privateUrl:privateLink.url,links:[privateLink]}]);
 assert.equal(calls.length,0);
 console.log('PASS: canonical title/date/link parity, snapshot replacement, empty archives, error states, URL validation, private-origin isolation');
}
run().catch(e=>{console.error(e);process.exitCode=1});

