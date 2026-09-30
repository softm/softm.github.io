'use strict';
// Audit the exact links rendered by the public index. No credentials or private
// response bodies are retained. HTTP access is not proof of media completeness.
const fs=require('node:fs');
const path=require('node:path');
const ui=require('./project-home.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'projects.json'),'utf8'));
const metadata=JSON.parse(fs.readFileSync(path.join(__dirname,'chat-metadata.json'),'utf8'));
const checkedAt=new Date().toISOString();
const allowed=new Set(['softm.github.io','vercel.com']);
const entries=[];
for(const p of data.projects){
 const lists=ui.lists(p,metadata);
 entries.push({project:p.repo,visibility:'home',url:ui.homeUrl(p)});
 for(const visibility of ['public','private'])for(const row of lists[visibility]){
  const url=ui.safe(row.url);
  if(url)allowed.add(new URL(url).hostname);
  entries.push({project:p.repo,visibility,url});
 }
}
function accepted(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&allowed.has(u.hostname)}catch{return false}}
async function request(url){
 const response=await fetch(url,{redirect:'manual',credentials:'omit',headers:{'User-Agent':'SOFTM-Project-Link-Audit','Cache-Control':'no-cache'},signal:AbortSignal.timeout(12000)});
 // Retain only boolean login markers from a bounded prefix, never the content.
 let login=false;
 if(response.status===200&&(response.headers.get('content-type')||'').includes('text/html')){
  const reader=response.body?.getReader();let text='',n=0;
  if(reader){try{while(n<65536){const chunk=await reader.read();if(chunk.done)break;n+=chunk.value.length;text+=Buffer.from(chunk.value).toString('utf8');if(/type=["']password["']/i.test(text)){login=true;break}}}finally{await reader.cancel().catch(()=>{})}}
  login=login||/type=["']password["']|\/login\?next=|Sign in to Vercel|Log in to Vercel/i.test(text);
 }else if(response.body){await response.body.cancel().catch(()=>{})}
 return {status:response.status,location:response.headers.get('location'),login,matchedPath:response.headers.get('x-matched-path')||''};
}
async function probe(url){
 if(!url)return {status:'missing-url',http:null,checkedAt};
 if(!accepted(url))return {status:'invalid-url',http:null,checkedAt};
 let current=url;const redirects=[];let first=null;
 try{
  for(let n=0;n<5;n++){
   const r=await request(current);if(first===null)first=r.status;
   if([401,403].includes(r.status))return {status:'authentication-required',http:first,finalHttp:r.status,redirects,checkedAt,authenticatedTargetVerified:false};
   if(r.status>=400)return {status:r.status===404?'not-found':'http-error',http:first,finalHttp:r.status,redirects,checkedAt};
   if(r.status>=300&&r.status<400&&r.location){
    const next=new URL(r.location,current);
    redirects.push({http:r.status,url:next.href});
    if(/\/(?:login|signin|auth|sso)(?:\/|$)/i.test(next.pathname)||next.hostname==='vercel.com'){
     const original=new URL(url),wanted=original.pathname+original.search;
     const returns=['returnTo','next','redirect','redirectTo','redirect_uri'].map(k=>next.searchParams.get(k)).filter(Boolean);
     return {status:'login-redirect',http:first,finalHttp:r.status,loginUrl:next.href,returnPathPreserved:returns.some(v=>v===wanted||v===original.href),redirects,checkedAt,authenticatedTargetVerified:false};
    }
    if(!accepted(next.href))return {status:'external-redirect-unverified',http:first,redirects,checkedAt};
    current=next.href;continue;
   }
   if(r.status===200)return {status:r.login?'login-page':'http-ok',http:first,finalHttp:200,finalUrl:current,redirects,checkedAt,authenticatedTargetVerified:false};
   return {status:'unexpected-status',http:first,finalHttp:r.status,redirects,checkedAt};
  }
  return {status:'redirect-limit',http:first,redirects,checkedAt};
 }catch(e){return {status:'network-error',http:first,error:e.name,checkedAt};}
}
(async()=>{
 const unique=[...new Set(entries.map(x=>x.url).filter(Boolean))],results={};let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<unique.length){const url=unique[cursor++];results[url]=await probe(url)}}));
 const projects=data.projects.map(p=>{
  const links=entries.filter(x=>x.project===p.repo).map(x=>({...x,...(x.url?results[x.url]:{status:'missing-url',http:null,checkedAt})}));
  const counts={};for(const x of links)counts[x.status]=(counts[x.status]||0)+1;
  const report={project:p.repo,title:p.title,homeUrl:ui.homeUrl(p),counts,links};
  console.log('PROJECT_LINK_AUDIT '+JSON.stringify({project:p.repo,total:links.length,counts,privateDirectVercel:links.filter(x=>x.visibility==='private'&&/^https:\/\/[^/]+\.vercel\.app\//.test(x.url)).length}));
  for(const x of links)if(!['http-ok','authentication-required','login-redirect','login-page'].includes(x.status))console.log('LINK_ISSUE '+JSON.stringify({project:p.repo,visibility:x.visibility,url:x.url,status:x.status,http:x.finalHttp||x.http}));
  return report;
 });
 const output={schemaVersion:1,checkedAt,sourceCommit:process.env.GITHUB_SHA||null,projectCount:projects.length,linkCount:entries.length,uniqueUrlCount:unique.length,scope:'Registered central project homes and their public/private chat links. No authenticated content or media verification.',projects};
 fs.mkdirSync(path.join(__dirname,'link-audit'),{recursive:true});
 fs.writeFileSync(path.join(__dirname,'link-audit','latest.json'),JSON.stringify(output,null,2)+'\n');
 console.log('AUDIT_COMPLETE '+JSON.stringify({projects:projects.length,links:entries.length,uniqueUrls:unique.length}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
