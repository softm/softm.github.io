/* The ZIP-generated, deployed HTML is the only public archive list source. */
(function(global){
'use strict';
const ORIGIN='https://softm.github.io';
const text=v=>typeof v==='string'?v.trim():'';
function https(value){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw new Error('HTTPS 원본 경로 오류');return u}
function validDate(s){if(!s)return true;if(/^\d{4}$/.test(s))return Number(s)>=1000;if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s}
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
function jsonArchiveRows(data,p){
 if(!data||!Array.isArray(data.records)||(data.errors!==undefined&&(!Array.isArray(data.errors)||data.errors.length)))throw new Error('공개 JSON 목록 형식 오류');
 const root=https(p.publicUrl),repo=https(p.publicRepoUrl),seen=new Set();
 if(root.origin!==ORIGIN||root.pathname.startsWith('/projects/')||repo.hostname!=='github.com')throw new Error('공개 원본 오류');
 return data.records.map(row=>{
  if(!row||typeof row!=='object'||!Array.isArray(row.files))throw new Error('기록 형식 오류');
  const dir=text(row.slug||row.id),title=text(row.title),date=text(row.date);
  if(!/^[A-Za-z0-9_-]+$/.test(dir)||!title||!validDate(date)||seen.has(dir))throw new Error('기록 메타데이터 오류: '+dir);
  const url=new URL('records/'+dir+'/',root.href.replace(/\/?$/,'/')).href;
  const repoUrl=repo.href.replace(/\/$/,'')+'/tree/main/records/'+dir;
  const files={images:0,videos:0,audio:0,documents:0,archives:0};
  for(const file of row.files){
   const path=text(file?.path).toLowerCase();if(!path)throw new Error('파일 메타데이터 오류: '+dir);
   if(/\.(jpe?g|png|webp|gif|avif|heic|svg)$/.test(path))files.images++;
   else if(/\.(mp4|webm|mov|m4v)$/.test(path))files.videos++;
   else if(/\.(mp3|m4a|wav|ogg|flac|aac)$/.test(path))files.audio++;
   else if(/\.(pdf|md|txt|docx?|xlsx?|pptx?|hwp|hwpx|csv)$/.test(path))files.documents++;
   else if(/\.(zip|7z)$/.test(path))files.archives++;
  }
  seen.add(dir);
  return {visibility:'public',label:title,title,chatTitle:title,sourceTitle:text(row.input),date,dateSource:'archive-canonical',titleSource:'archive-canonical',url,repoUrl,category:text(row.category)||'아카이브',summary:'원본 자료 '+row.files.length+'개',count:row.files.length,files,directory:dir,recordPath:'records/'+dir};
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
    const id=text(r.slug),rawListTitle=text(r.listTitle),cleanName=v=>text(v).replace(/\.zip$/i,'').replace(/_MD_HTML_전체자료$/i,'').replace(/_/g,' ').trim(),overrides={'20261009-bak-cultivation':'20261009 박 적심도식 정리','20261009-sprinkler-thread-guide':'20261009 스프링클러 배관 나사 규격 정리','20261009-stake-inserter-purchase':'20261009 지주대 삽입기 구매기록','20261009-herbicide-classification':'20261009 제초제 분류 및 사용 가이드'},listTitle=overrides[id]||cleanName(rawListTitle),displayTitle=listTitle,date=text(r.date);
    if(!/^[A-Za-z0-9_-]+$/.test(id)||!listTitle||!displayTitle||!validDate(date)||seen.has(id))throw new Error('농업 기록 메타데이터 오류');
    if(r.visibility!=='public'||r.url!==root.href+'records/'+id+'/'||r.repoUrl!=='https://github.com/softm/farm/tree/main/records/'+id)throw new Error('농업 기록 링크 오류');seen.add(id);
    return {visibility:'public',listTitle,label:displayTitle,title:displayTitle,chatTitle:displayTitle,sourceTitle:r.sourceTitle,date,dateSource:r.dateBasis,titleSource:r.titleSource||'archive-canonical',url:r.url,repoUrl:r.repoUrl,category:r.kind||'재배',summary:(r.description||'')+(r.sourceIntegrityComplete?'':' · 원본 자료 업로드 대기'),directory:id,recordPath:'records/'+id,sourceIntegrityComplete:r.sourceIntegrityComplete,originalPhotoCount:r.originalPhotoCount,originalImageCount:r.originalImageCount,uniqueOriginalImageCount:r.uniqueOriginalImageCount,diagramCount:r.diagramCount};
  });
  p.links=[...links,...(p.links||[]).filter(x=>x.visibility==='private')];p.homePublicListCount=links.length;p.pageCount=links.length;p.homePrivateListCount=p.links.filter(x=>x.visibility==='private').length;
  p.mediaStatus=data.records.every(r=>r.sourceIntegrityComplete)?'공개 기록 원본 파일·해시 확인 완료':'일부 공개 기록의 원본 자료 확인 대기';
  p.archiveSync={status:'ok',source:expected,count:links.length};return;
 }
  if(source.format==='json-record-index'){
  const root=https(p.publicUrl),sourceUrl=https(source.url),expected=new URL('records/index.json',root).href;
  if(root.origin!==ORIGIN||root.pathname.startsWith('/projects/')||sourceUrl.href!==expected)throw new Error('공개 JSON 목록 원본 경로 오류');
  sourceUrl.searchParams.set('archive-sync',String(Date.now()));
  const response=await fetch(sourceUrl.href,{cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const raw=await response.text();if(raw.length>2500000)throw new Error('공개 목록 크기 초과');
  const links=jsonArchiveRows(JSON.parse(raw),p);
  p.links=[...links,...(p.links||[]).filter(x=>x.visibility==='private')];p.homePublicListCount=links.length;p.pageCount=links.length;p.homePrivateListCount=p.links.filter(x=>x.visibility==='private').length;
  p.mediaStatus='공개 서비스 JSON과 동일한 '+links.length+'개 기록. 파일 수와 형식은 배포 매니페스트를 기준으로 표시합니다.';
  p.deploymentNote='공개 records/index.json을 직접 읽었습니다. 상세 HTML과 원본 미디어는 프로젝트 저장소에 유지됩니다.';
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
const api={archiveRows,jsonArchiveRows,syncPublishedArchive,syncProjects};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else global.SoftmArchiveSync=api;
})(typeof window!=='undefined'?window:globalThis);
