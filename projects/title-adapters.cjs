'use strict';
// Explicit adapters for routes verified in the existing servers. No private source is copied out.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=process.cwd(),reportPath=path.join(root,'.title-audit/result.json'),report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
const repo=report.repo,tracked=cp.execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean),known=new Set(tracked);
const changed=new Set(report.changedFiles),staged=new Map();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const immutable=f=>/\.(?:jpe?g|png|webp|gif|svg|avif|mp4|mov|m4a|mp3|wav|ogg|flac|pdf|zip|7z|docx?|xlsx?|pptx?)$/i.test(f)||/(?:^|\/)(?:source-documents|originals|source|snapshots)(?:\/|$)/.test(f);
const saved=new Map(tracked.filter(immutable).map(f=>[f,hash(fs.readFileSync(f))]));
const read=f=>staged.get(f)??fs.readFileSync(f,'utf8');
const put=(f,s)=>{if(!known.has(f))throw Error('Untracked source refused: '+f);if(read(f)!==s){staged.set(f,s);changed.add(f)}};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const references=s=>[...s.matchAll(/\b(?:href|src|poster)\s*=\s*(?:"[^"]*"|'[^']*')/g)].map(m=>m[0]);
function checked(f,before,after){if(JSON.stringify(references(before))!==JSON.stringify(references(after)))throw Error('Reference change refused: '+f);put(f,after)}
function html(f,r){if(!known.has(f))return false;let s=read(f),heads=[...s.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)];const duplicatedCaseTitle=repo==='hwagok-land-permit-private'&&f==='private_assets/case/nonprosecution-appeal.html'&&heads.length===2;
 if(heads.length!==1&&!duplicatedCaseTitle)throw Error('Unexpected primary heading count: '+f);
 let out=s;for(const item of heads){const h=item[0],newH=h.replace(/^(<h1\b[^>]*>)[\s\S]*?(<\/h1>)$/i,(_,a,b)=>a+esc(r.title)+b);out=out.replace(h,newH)}
 out=out.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i,()=>'<title>'+esc(r.title)+'</title>');
 out=out.replace(/<meta\b[^>]*(?:property|name)=["'](?:og:title|twitter:title)["'][^>]*>/gi,m=>m.replace(/content=(?:"[^"]*"|'[^']*')/i,()=> 'content="'+esc(r.title)+'"'));
 checked(f,s,out);r.files.push({file:f,state:s===out?'matched':'title-corrected',after:r.title,adapter:'verified-route-to-original'});return true;
}
function md(f,r){if(!known.has(f))return;let s=read(f);if(!/^#\s+.+$/m.test(s))return;let out=s.replace(/^#\s+.+$/m,()=> '# '+r.title);put(f,out);r.files.push({file:f,state:s===out?'matched':'title-corrected',after:r.title,adapter:'verified-route-to-original'})}
let ts;try{ts=require(process.env.TYPESCRIPT_PATH||'typescript')}catch{}
function apiTemplates(f,functions){
 if(!ts)throw Error('TypeScript parser required');const source=read(f),ast=ts.createSourceFile(f,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
 function walk(n,record){
  if(ts.isFunctionDeclaration(n))record=functions[n.name?.text]||null;
  if(record&&ts.isCallExpression(n)&&n.expression.getText(ast)==='shell'){
   const [title,body]=n.arguments;
   if(!title||!ts.isStringLiteral(title)||!body)throw Error('Unexpected shell signature');
   edits.push([title.getStart(ast),title.end,JSON.stringify(record.title)]);
   const value=source.slice(body.getStart(ast),body.end),heads=[...value.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi)];
   if(heads.length!==1)throw Error('Expected one template heading for '+record.route);
   const output=value.replace(heads[0][0],h=>h.replace(/^(<h1\b[^>]*>)[\s\S]*?(<\/h1>)$/i,(_,a,b)=>a+esc(record.title).replace(/`/g,'&#96;').replace(/\$\{/g,'&#36;{')+b));
   edits.push([body.getStart(ast),body.end,output]);
   record.files.push({file:f,state:'title-corrected',after:record.title,adapter:'identity-bound-shell-template'});
  }
  ts.forEachChild(n,child=>walk(child,record));
 }
 walk(ast,null);let output=source;for(const[a,b,v]of edits.sort((a,b)=>b[0]-a[0]))output=output.slice(0,a)+v+output.slice(b);checked(f,source,output);
}
if(repo==='father-hospital-treatment-private')for(const r of report.results){
 const p=new URL(r.url).pathname.replace(/\/$/,'');if(!/^\/view\/[a-z0-9-]+$/.test(p))continue;
 const slug=p.split('/').pop();if(html('archive/'+slug+'/index.html',r)){md('archive/'+slug+'/summary.md',r);r.state='source-resolved'}
}
if(repo==='hwagok-land-permit-private'){
 const routes=new Map(report.results.map(r=>[new URL(r.url).pathname.replace(/\/$/,''),r]));
 const names={'/case/appeal':'private_assets/case/report.html','/case/nonprosecution-appeal':'private_assets/case/nonprosecution-appeal.html','/asset/archive-20260926.html':'private_assets/case/archive-20260926.html','/asset/appeals-20260922/staging.html':'private_assets/case/appeals-20260922/staging.html'};
 for(const[route,f]of Object.entries(names)){const r=routes.get(route);if(r&&html(f,r)){md(f.replace(/\.html$/,'.md'),r);r.state='source-resolved'}}
 apiTemplates('api/index.js',{appealFallback:routes.get('/case/appeal'),outlookPage:routes.get('/case/prosecution-outlook'),nonprosecutionAppealPage:routes.get('/case/nonprosecution-appeal')});
 const outlook=routes.get('/case/prosecution-outlook');if(outlook&&outlook.files.length)outlook.state='source-resolved';
 // Existing project-home card labels for these exact routes, not arbitrary prose.
 const s=read('api/index.js');const out=s.replace(/<a\b[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>/g,(a,href)=>{const r=routes.get(href.replace(/\/$/,''));return r?a.replace(/(<h3\b[^>]*>)[\s\S]*?(<\/h3>)/i,(_,x,y)=>x+esc(r.title).replace(/`/g,'&#96;').replace(/\$\{/g,'&#36;{')+y):a});checked('api/index.js',s,out);
}
if(repo==='onsuhill-private'){
 if(!ts)throw Error('TypeScript parser required');const f='api/site.js',s=read(f),ast=ts.createSourceFile(f,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),found=new Map();
 if(!s.includes('<h1>${esc(title)}</h1>'))throw Error('Shared shell no longer displays its title');
 function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='pages'&&n.initializer&&ts.isObjectLiteralExpression(n.initializer))for(const p of n.initializer.properties){if(!ts.isPropertyAssignment(p))continue;const fn=p.initializer;if(ts.isArrowFunction(fn)&&ts.isCallExpression(fn.body)&&fn.body.expression.getText(ast)==='shell'&&ts.isStringLiteral(fn.body.arguments[0]))found.set(p.name.getText(ast).replace(/^["']|["']$/g,''),fn.body.arguments[0].text)}ts.forEachChild(n,walk)}walk(ast);
 for(const r of report.results){const route=new URL(r.url).searchParams.get('route');if(!route){r.state='project-home-not-record';continue}if(found.get(route)!==r.title)throw Error('Query-route title mismatch: '+route);r.files.push({file:f,state:'matched',after:r.title,adapter:'query-route-shell-title-h1'});r.state='source-resolved';}
}
for(const[f,s]of staged)fs.writeFileSync(f,s);
for(const[f,h]of saved)if(hash(fs.readFileSync(f))!==h)throw Error('Original media changed: '+f);
report.changedFiles=[...changed];report.sourceResolved=report.results.filter(r=>r.state==='source-resolved').length;report.adaptersApplied=true;report.mediaUnchanged=report.mediaUnchanged&&true;
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log('TITLE_ADAPTER_SUMMARY '+JSON.stringify({repo,rows:report.registeredRows,resolved:report.sourceResolved,changedFiles:report.changedFiles.length,mediaUnchanged:true}));
