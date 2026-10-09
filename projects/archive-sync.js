/* The ZIP-generated, deployed HTML is the only public archive list source. */
(function(global){
'use strict';
const ORIGIN='https://softm.github.io';
const text=v=>typeof v==='string'?v.trim():'';
function https(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw new Error('HTTPS 원본 경로 오류');return u}
function validDate(s){if(!s)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s}
function archiveRows(data,p){
 if(!Array.isArray(data))throw new Error('공개 목록 형식 오류');
 const root=https(p.publicUrl),repo=https(p.publicRepoUrl),seen=new Set();
 if(root.origin!==ORIGIN||root.pathname.startsWith('/projects/')||repo.hostname!=='github.com')throw new Error('공개 원본 오류');
 return data.map(row=>{
  if(!row||typeof row!=='object')throw new Error('기록 형식 오류');
  const dir=text(row.dir),title=(typeof row.listTitle==='string'&&row.listTitle.length?row.listTitle:text(row.title)),date=text(row.date);
  if(!/^[A-Za-z0-9_-]+$/.test(dir)||!title||!validDate(date)||seen.has(dir))throw new Error('기록 메타데이터 오류: '+dir);
  const expected=new URL('records/'+dir+'/',root.href.replace(/\/?$/,'/')).href;
  const repoBase=repo.href.replace(/\/$/,'')+'/tree/main/';
  const repoPaths=['public/records/'+dir,'records/'+dir];
  const recordPath=repoPaths.find(path=>repoBase+path===https(row.repoUrl).href);
  if(https(row.url).href!==expected||!recordPath)throw new Error('상세/원본 링크 오류: '+dir);
  seen.add(dir);
  return {...(typeof row.listTitle==='string'&&row.listTitle.length?{listTitle:row.listTitle,inputName:row.inputName,inputKind:row.inputKind,sourceTitle:row.sourceTitle}:{}),visibility:'public',label:title,title,chatTitle:title,date,dateSource:'archive-canonical',titleSource:row.listTitle?(row.titleSource||'inbox-name'):'archive-canonical',url:row.url,repoUrl:row.repoUrl,category:text(row.kind)||'아카이브',summary:text(row.desc),directory:dir,recordPath};
 });
}
async function syncPublishedArchive(p){
 const source=p.publicIndexSource||(p.repo==='hwagok-farm'?{url:p.publicUrl,format:'html-archive-data'}:null);
 if(!source)return;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  if(source.format==='json-archive-index' && p.repo==='farm'){
  const root=https(p.publicUrl),expected=new URL('archive-index.json',root).href;
  if(root.origin!==ORIGIN||root.pathname!=='/farm/'||source.url!==expected)throw new Error('농업 목록 원본 경로 오류');
  const response=await fetch(expected+'?archive-sync='+Date.now(),{cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const raw=await response.text();if(raw.length>2500000)throw new Error('공개 목록 크기 초과');
  const data=JSON.parse(raw);if(data.repository!=='softm/farm'||!Array.isArray(data.records))throw new Error('농업 목록 형식 오류');
  const seen=new Set(),links=data.records.map(r=>{
    const id=text(r.slug),listTitle=text(r.listTitle),displayTitle=text(r.title)||text(r.sourceTitle)||listTitle,date=text(r.date);
    if(!/^[A-Za-z0-9_-]+$/.test(id)||!listTitle||!displayTitle||!validDate(date)||seen.has(id))throw new Error('농업 기록 메타데이터 오류');
    if(r.visibility!=='public'||r.url!==root.href+'records/'+id+'/'||r.repoUrl!=='https://github.com/softm/farm/tree/main/records/'+id)throw new Error('농업 기록 링크 오류');seen.add(id);
    return {visibility:'public',listTitle,label:displayTitle,title:displayTitle,chatTitle:displayTitle,sourceTitle:r.sourceTitle,date,dateSource:r.dateBasis,titleSource:r.titleSource||'archive-canonical',url:r.url,repoUrl:r.repoUrl,category:r.kind||'재배',summary:(r.description||'')+(r.sourceIntegrityComplete?'':' · 원본 자료 업로드 대기'),directory:id,recordPath:'records/'+id,sourceIntegrityComplete:r.sourceIntegrityComplete,originalPhotoCount:r.originalPhotoCount,originalImageCount:r.originalImageCount,uniqueOriginalImageCount:r.uniqueOriginalImageCount,diagramCount:r.diagramCount};
  });
  p.links=[...links,...(p.links||[]).filter(x=>x.visibility==='private')];p.homePublicListCount=links.length;p.pageCount=links.length;p.homePrivateListCount=p.links.filter(x=>x.visibility==='private').length;
  p.mediaStatus=data.records.every(r=>r.sourceIntegrityComplete)?'공개 기록 원본 파일·해시 확인 완료':'일부 공개 기록의 원본 자료 확인 대기';
  p.archiveSync={status:'ok',source:expected,count:links.length};return;
 }
  const root=https(p.publicUrl),sourceUrl=https(source.url);
  if(source.format!=='html-archive-data'||root.origin!==ORIGIN||sourceUrl.origin!==root.origin||sourceUrl.pathname!==root.pathname||root.pathname.startsWith('/projects/'))throw new Error('공개 목록 원본 경로 오류');
  sourceUrl.searchParams.set('archive-sync',String(Date.now()));
  const response=await fetch(sourceUrl.href,{cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const markup=await response.text();
  if(markup.length>2500000)throw new Error('공개 목록 크기 초과');
  const doc=new DOMParser().parseFromString(markup,'text/html');
  const node=doc.querySelector('script#archive-data[type="application/json"]');
  if(!node)throw new Error('archive-data 없음');
  const links=archiveRows(JSON.parse(node.textContent),p);
  // Replace rather than merge: obsolete static entries cannot survive a ZIP redeployment.
  p.links=[...links,...(p.links||[]).filter(x=>x.visibility==='private')];
  p.homePublicListCount=links.length;p.pageCount=links.length;
  p.homePrivateListCount=p.links.filter(x=>x.visibility==='private').length;
  p.mediaStatus='공개 서비스 홈과 동일한 '+links.length+'개 기록. 첨부 수는 각 공개 본문에서 별도 확인합니다.';
  p.deploymentNote='ZIP 배포 결과의 archive-data를 직접 읽었습니다. 상세 HTML과 원본 미디어는 기존 프로젝트 저장소에 유지됩니다.';
  p.archiveSync={status:'ok',source:root.href,count:links.length};
 }catch(e){
  // Do not pass a stale snapshot off as a successful live synchronization.
  p.links=(p.links||[]).filter(x=>x.visibility==='private');
  p.homePublicListCount=null;p.pageCount=null;
  p.archiveSync={status:'error',message:'공개 목록 동기화 실패: '+e.message};
 }finally{clearTimeout(timer)}
}
async function syncProjects(projects){await Promise.all(projects.map(syncPublishedArchive));return projects}
const api={archiveRows,syncPublishedArchive,syncProjects};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else global.SoftmArchiveSync=api;
})(typeof window!=='undefined'?window:globalThis);
