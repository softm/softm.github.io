'use strict';
const assert=require('node:assert/strict');
const browser=require('./project-home.js');
const archive=require('./archive-sync.js');
const project={publicUrl:'https://softm.github.io/hwagok-farm/',publicRepoUrl:'https://github.com/softm/hwagok-farm'};
for(const name of ['20260809_화곡농장_작업 정리','20260809_작업 정리.zip','20260809_자료 (최종).ZIP']){
 const input={title:'본문 제목',listTitle:name,inputName:name,inputKind:name.toLowerCase().endsWith('.zip')?'zip':'folder',sourceTitle:'본문 제목',titleSource:'inbox-name',date:'2026-08-09',dateSource:'archive-canonical'};
 assert.equal(browser.display(input).displayTitle,name);
 const row=archive.archiveRows([{...input,dir:'sample',url:project.publicUrl+'records/sample/',repoUrl:project.publicRepoUrl+'/tree/main/public/records/sample'}],project)[0];
 assert.equal(row.title,name);assert.equal(row.listTitle,name);assert.equal(row.sourceTitle,'본문 제목');
 assert.equal(browser.display(row).displayTitle,name);
}
console.log('PASS: folder/ZIP list titles preserve dates, underscores, spaces and extensions; original source titles retained');
