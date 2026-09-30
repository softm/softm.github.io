'use strict';
/* Title-only migration. Source files and binary assets never leave the current repository. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),cp=require('node:child_process');
const args=process.argv.slice(2),arg=(k,d='')=>{let i=args.indexOf(k);return i<0?d:args[i+1]};
const root=path.resolve(arg('--root','.')),repo=arg('--repo',process.env.GITHUB_REPOSITORY||'').replace(/^softm\//,''),apply=args.includes('--apply');
const central=path.resolve(arg('--central',path.join(root,'.title-tools')));
let ts;for(const m of [process.env.TYPESCRIPT_PATH,'typescript','/usr/local/lib/node_modules/typescript']){try{if(m){ts=require(m);break}}catch{}}
const read=p=>fs.readFileSync(p,'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const catalog=JSON.parse(read(path.join(central,'projects.json'))),metadata=JSON.parse(read(path.join(central,'chat-metadata.json')));
const ctx={module:{exports:{}},URL,Intl,Date,Set,Map};vm.runInNewContext(read(path.join(central,'project-home.js')),ctx,{timeout:5000});
const policy=ctx.module.exports;
if(metadata.schemaVersion!==1||typeof policy.lists!=='function'||typeof policy.display!=='function')throw Error('Central title schema changed');
const project=catalog.projects.find(p=>p.repo===repo||p.publicRepo===repo||p.privateRepo===repo);
if(!project)throw Error('Repository not registered in central catalog: '+repo);
const list=policy.lists(project,metadata),visibility=project.privateRepo===repo||project.repoVisibility==='private'&&project.repo===repo?'private':'public';
const rows=list[visibility], origin=visibility==='private'?project.privateUrl:project.publicUrl;
const text=s=>String(s||'').replace(/\s+/g,' ').trim();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=s=>String(s).replace(/&(?:amp|lt|gt|quot|#39|apos);/g,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'"}[x])).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n));
const plain=s=>text(decode(String(s).replace(/<[^>]+>/g,' ')));
const files=cp.execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const fileset=new Set(files),changes=new Set(),results=[],allBefore=new Map();
const immutable=p=>/\.(?:jpe?g|png|webp|gif|svg|avif|mp4|mov|m4a|mp3|wav|ogg|flac|pdf|zip|7z|docx?|xlsx?|pptx?)$/i.test(p)||/(?:^|\/)(?:source-documents|originals|source|snapshots|node_modules|\.git)(?:\/|$)/.test(p);
for(const f of files)if(immutable(f))allBefore.set(f,hash(fs.readFileSync(path.join(root,f))));
const staged=new Map();
function save(f,value){if(!apply)return;if(!fileset.has(f))throw Error('Not a tracked source file: '+f);const old=staged.has(f)?staged.get(f):read(path.join(root,f));if(old!==value){staged.set(f,value);changes.add(f)}}
function contents(f){return staged.get(f)??read(path.join(root,f));}
const mappings=new Map(),ids=new Map();
function addMapping(f,r){if(!fileset.has(f)||immutable(f))return;const old=mappings.get(f);if(old&&old.name!==r.name){old.conflict=true;return}mappings.set(f,r);}
function routeFor(r){try{let u=new URL(r.url),base=new URL(origin);if(u.origin!==base.origin)return null;let prefix=base.pathname.replace(/\/$/,'');if(prefix&&u.pathname!==prefix&&!u.pathname.startsWith(prefix+'/'))return null;return {url:u,path:decodeURIComponent(u.pathname.slice(prefix.length)).replace(/^\/+|\/+$/g,'')}}catch{return null}}
for(const row of rows){
 const r={url:row.url||'',name:row.displayName,title:row.displayTitle,date:row.displayDate||'',visibility,files:[],state:'unresolved'};
 const rt=routeFor(row);results.push(r);if(!rt){r.state=row.url?'external-or-service':'no-url';continue}
 if(/\.(?:jpe?g|png|webp|mp4|mov|m4a|mp3|wav|pdf|zip|docx?|xlsx?)$/i.test(rt.path)){r.state='attachment-not-page';continue}
 if(!rt.path){r.state='project-home-not-record';continue}
 let route=rt.path,slug=route.replace(/\/(?:index|record)\.html$/,'').split('/').pop();
 if(rt.url.search){if(route==='api/site'&&rt.url.searchParams.has('route'))slug=rt.url.searchParams.get('route');else{r.state='query-route-needs-adapter';continue}}
 r.route=route;r.slug=slug;
 if(ids.has(slug)&&ids.get(slug).name!==r.name)ids.set(slug,null);else if(!ids.has(slug))ids.set(slug,r);
 let candidates=new Set();
 for(const prefix of ['','public/','private/','private-assets/','content/','pages/']){
  const p=prefix+route;
  if(/\.(?:html?|md)$/.test(route))candidates.add(p);else for(const file of ['index.html','record.html','summary.md','record.md'])candidates.add(p+'/'+file);
 }
 for(const prefix of ['asset/','live/'])if(route.startsWith(prefix)){
  const tail=route.slice(prefix.length);for(const base of ['','private/','private-assets/'])candidates.add(base+tail);
 }
 if(!/\.(?:html?|md)$/.test(route)&&!rt.url.search){
  for(const prefix of ['app/','app/(protected)/','src/app/'])candidates.add(prefix+route+'/page.tsx');
 }
 // Explicit same-record archive aliases; never merge gallery documents or query routes.
 if(repo==='hwagok-farm'&&!/\.[^/]+$/.test(route))for(const base of ['public/archive/'+slug+'/'])for(const f of ['index.html','record.html','record.md'])candidates.add(base+f);
 if(route.startsWith('archive/')&&!/\.[^/]+$/.test(route))for(const base of ['', 'public/'])for(const f of ['index.html','record.html','summary.md','record.md'])candidates.add(base+route+'/'+f);
 for(const f of candidates)addMapping(f,r);
}
function patchHTML(f,r){
 const input=contents(f);const heads=[...input.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
 if(heads.length!==1)return {state:heads.length?'multiple-headings':'no-primary-heading'};
 const before=plain(heads[0][1]);let output=input;
 const oldTag=heads[0][0].match(/^<h1\b[^>]*>/i)[0];
 let attrs=oldTag.slice(3,-1).replace(/\sdata-record-title(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi,'');
 output=output.replace(heads[0][0],'<h1'+attrs+' data-record-title="canonical">'+escape(r.title)+'</h1>');
 output=output.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i,'<title>'+escape(r.title)+'</title>');
 output=output.replace(/<meta\b[^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*>/gi,m=>m.replace(/content=(?:"[^"]*"|'[^']*')/i,'content="'+escape(r.title)+'"'));
 const refs=s=>[...s.matchAll(/\b(?:src|href|poster)\s*=\s*(?:"[^"]*"|'[^']*')/gi)].map(x=>x[0]);
 if(JSON.stringify(refs(input))!==JSON.stringify(refs(output)))throw Error('Media/link reference changed: '+f);
 save(f,output);return {state:before===r.title?'matched':'title-corrected',before,after:r.title};
}
function patchMD(f,r){let input=contents(f);const m=/^#\s+(.+)$/m.exec(input);if(!m)return {state:'no-primary-heading'};let output=input.slice(0,m.index)+'# '+r.title+input.slice(m.index+m[0].length);save(f,output);return {state:m[1]===r.title?'matched':'title-corrected',before:m[1],after:r.title}}
function patchTSX(f,r){if(!ts)return {state:'typescript-parser-unavailable'};let input=contents(f),ast=ts.createSourceFile(f,input,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),headings=[];function walk(n){if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='h1')headings.push(n);ts.forEachChild(n,walk)}walk(ast);if(headings.length!==1)return {state:headings.length?'multiple-headings':'dynamic-heading'};let h=headings[0];const old=input.slice(h.getStart(ast),h.end);let bodyStart=h.openingElement.end,bodyEnd=h.closingElement.getStart(ast);let output=input.slice(0,bodyStart)+'{'+JSON.stringify(r.title)+'}'+input.slice(bodyEnd);save(f,output);return {state:old.includes(JSON.stringify(r.title))?'matched':'title-corrected',before:plain(old),after:r.title}}
for(const [f,r] of mappings){let result=r.conflict?{state:'ambiguous-source-mapping'}:/\.tsx$/.test(f)?patchTSX(f,r):/\.md$/.test(f)?patchMD(f,r):patchHTML(f,r);r.files.push({file:f,...result});}
// Patch identity-bound registry labels, never free text occurrences of the same words.
for(const f of files.filter(f=>!immutable(f)&&/(?:^|\/)(?:project|records|manifest|index)\.json$/.test(f))){
 let data;try{data=JSON.parse(contents(f))}catch{continue}let n=0;
 function visit(o){if(!o||typeof o!=='object')return;if(!Array.isArray(o)){let r=ids.get(o.slug||o.id);if(r&&typeof o.title==='string'&&o.title!==r.title){o.title=r.title;n++}if(r&&typeof o.displayName==='string')o.displayName=r.name;}for(const v of Object.values(o))if(v&&typeof v==='object')visit(v)}visit(data);if(n)save(f,JSON.stringify(data,null,2)+'\n');
}
if(ts)for(const f of files.filter(f=>!immutable(f)&&/\.(?:tsx?|m?js|cjs)$/.test(f)&&!/^(?:scripts|tests|\.github)\//.test(f))){
 const input=contents(f),ast=ts.createSourceFile(f,input,ts.ScriptTarget.Latest,true,/\.tsx$/.test(f)?ts.ScriptKind.TSX:ts.ScriptKind.TS),edits=[];
 const str=n=>n&&(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n))?n.text:null;
 function visit(n){
  if(ts.isObjectLiteralExpression(n)){const props=new Map(n.properties.filter(ts.isPropertyAssignment).map(p=>[p.name.getText(ast).replace(/^["']|["']$/g,''),p]));let r=ids.get(str(props.get('slug')?.initializer)||str(props.get('id')?.initializer));
   if(!r){let href=str(props.get('href')?.initializer)||str(props.get('url')?.initializer);if(href)try{const absolute=new URL(href,origin).href;r=results.find(x=>policy.keyFor(x.url)===policy.keyFor(absolute))}catch{}}
   if(r&&!r.conflict)for(const key of ['title','displayName']){const p=props.get(key),value=key==='title'?r.title:r.name;if(p&&str(p.initializer)!==null&&str(p.initializer)!==value)edits.push([p.initializer.getStart(ast),p.initializer.end,JSON.stringify(value)]);}
  }
  if(ts.isPropertyAssignment(n)){const key=n.name.getText(ast).replace(/^["']|["']$/g,''),r=ids.get(key),fn=n.initializer;if(r&&ts.isArrowFunction(fn)&&ts.isCallExpression(fn.body)&&fn.body.expression.getText(ast)==='shell'&&str(fn.body.arguments[0])!==null){let a=fn.body.arguments[0];if(str(a)!==r.title)edits.push([a.getStart(ast),a.end,JSON.stringify(r.title)]);}}
  if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='records'&&n.initializer&&ts.isArrayLiteralExpression(n.initializer))for(const tuple of n.initializer.elements){if(ts.isArrayLiteralExpression(tuple)&&tuple.elements.length>=3){const r=ids.get(str(tuple.elements[0])),value=tuple.elements[2];if(r&&str(value)!==null&&str(value)!==r.title)edits.push([value.getStart(ast),value.end,JSON.stringify(r.title)]);}}
  ts.forEachChild(n,visit);
 }visit(ast);if(edits.length){let output=input;for(const [a,b,v] of edits.sort((a,b)=>b[0]-a[0]))output=output.slice(0,a)+v+output.slice(b);save(f,output);}
}
for(const r of results)if(r.files.length)r.state=r.files.every(x=>['matched','title-corrected'].includes(x.state))?'source-resolved':'source-partial';
if(apply){for(const [f,content]of staged)fs.writeFileSync(path.join(root,f),content);for(const[f,h]of allBefore)if(hash(fs.readFileSync(path.join(root,f)))!==h)throw Error('Immutable media changed: '+f)}
const report={schemaVersion:1,repo,project:project.repo,visibility,centralRevision:arg('--revision'),checkedAt:new Date().toISOString(),applied:apply,registeredProjects:catalog.projects.length,registeredRows:rows.length,sourceResolved:results.filter(x=>x.state==='source-resolved').length,changedFiles:[...changes],mediaFilesChecked:allBefore.size,mediaUnchanged:true,results};
const reportPath=path.join(root,'.title-audit','result.json');fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log('TITLE_AUDIT_SUMMARY '+JSON.stringify({...report,results:undefined,changedFiles:[...changes]}));
for(const r of results)console.log('TITLE_ROW '+JSON.stringify({url:r.url,name:r.name,date:r.date,state:r.state,files:r.files.map(x=>({file:x.file,state:x.state,before:x.before,after:x.after}))}));
