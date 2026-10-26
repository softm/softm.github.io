#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";

const args = Object.fromEntries(process.argv.slice(2).map((v,i,a)=>{
  if(!v.startsWith("--")) return null;
  const key=v.slice(2), next=a[i+1];
  return [key, next && !next.startsWith("--") ? next : "true"];
}).filter(Boolean));

const projectKey=args.project;
const privateRepo=args.repo;
const record=args.record || "";
if(!projectKey || !privateRepo){
  console.error("usage: node private-archive-guard.mjs --project <project> --repo <owner/repo-private> [--record <slug>]");
  process.exit(2);
}

const checks=[];
const add=(name,ok,detail)=>checks.push({name,ok:Boolean(ok),detail});
const ghToken=process.env.ARCHIVE_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";
const headers={"Accept":"application/vnd.github+json","User-Agent":"softm-private-archive-guard","X-GitHub-Api-Version":"2022-11-28"};
if(ghToken) headers.Authorization=`Bearer ${ghToken}`;

async function gh(path, accept){
  const h={...headers};
  if(accept) h.Accept=accept;
  const r=await fetch(`https://api.github.com/repos/${privateRepo}/${path}`,{headers:h});
  return r;
}
async function textFile(path){
  const r=await gh(`contents/${path}?ref=main`,"application/vnd.github.raw");
  if(!r.ok) return {ok:false,status:r.status,text:""};
  return {ok:true,status:r.status,text:await r.text()};
}

const catalog=JSON.parse(fs.readFileSync("projects/projects.json","utf8"));
const project=catalog.projects.find(p=>p.repo===projectKey);
add("central project exists",!!project,projectKey);
if(project){
  add("privateRepo matches",project.privateRepo===privateRepo.split("/").pop(),project.privateRepo || "missing");
  add("privateUrl is Vercel",/^https:\/\/[^/]+\.vercel\.app\/?$/.test(project.privateUrl||""),project.privateUrl||"missing");
  if(record){
    const link=(project.links||[]).find(x=>x.visibility==="private" && (x.directory===record || x.recordPath===`archive/${record}`));
    add("record exists in projects.json",!!link,link?.url || record);
    if(link){
      add("record URL uses privateUrl",String(link.url||"").startsWith(String(project.privateUrl||"").replace(/\/$/,"")+"/"),link.url);
      add("record repoUrl points to private repo",String(link.repoUrl||"").includes(`github.com/${privateRepo}/tree/main/archive/${record}`),link.repoUrl||"missing");
    }
  }
}

const rr=await gh("");
add("private GitHub repo reachable",rr.ok,`HTTP ${rr.status}`);
if(rr.ok){
  const info=await rr.json();
  add("repository is private",info.private===true,`private=${info.private}`);
  add("default branch is main",info.default_branch==="main",`default=${info.default_branch}`);
}

for(const p of ["api/site.js","vercel.json",".vercelignore"]){
  const f=await textFile(p);
  add(`${p} exists`,f.ok,`HTTP ${f.status}`);
  if(p==="api/site.js" && f.ok){
    add("gateway reads GITHUB_TOKEN",/process\.env\.(?:ARCHIVE_)?GITHUB_TOKEN|process\.env\[["']GITHUB_TOKEN["']\]/.test(f.text),p);
    add("gateway uses GitHub API",/api\.github\.com\/repos\//.test(f.text),p);
    add("gateway disables cache",/no-store/.test(f.text),p);
  }
  if(p==="vercel.json" && f.ok){
    try{
      const v=JSON.parse(f.text);
      add("Vercel build targets gateway",Array.isArray(v.builds) && v.builds.some(x=>String(x.src||"").startsWith("api/") && x.use==="@vercel/node"),"vercel.json builds");
    }catch{ add("vercel.json parses",false,"invalid JSON"); }
  }
  if(p===".vercelignore" && f.ok){
    add("archive excluded from Vercel static build",/archive\/\*\*/.test(f.text),".vercelignore");
    add("root index excluded from Vercel static build",/(^|\n)index\.html(\n|$)/.test(f.text),".vercelignore");
  }
}
if(record){
  const detail=await textFile(`archive/${record}/index.html`);
  add("record detail exists in private GitHub",detail.ok,`HTTP ${detail.status}`);

  const manifest=await textFile(`archive/${record}/archive-manifest.json`);
  add("archive manifest exists",manifest.ok,`HTTP ${manifest.status}`);
  if(manifest.ok){
    try{
      const m=JSON.parse(manifest.text);
      const sources=Array.isArray(m.sources)?m.sources:[];
      add("archive manifest declares source files",sources.length>0,`sources=${sources.length}`);
      for(const source of sources){
        const p=String(source.path||"");
        if(!p){ add("manifest source path valid",false,"missing path"); continue; }
        const rf=await gh(`contents/${p.split("/").map(encodeURIComponent).join("/")}?ref=main`);
        add(`source file exists: ${p}`,rf.ok,`HTTP ${rf.status}`);
        if(rf.ok){
          const meta=await rf.json();
          if(source.bytes!=null) add(`source byte size matches: ${p}`,Number(meta.size)===Number(source.bytes),`expected=${source.bytes}, actual=${meta.size}`);
        }
      }
    }catch(e){
      add("archive manifest parses",false,e?.message||"invalid JSON");
    }
  }
}

if(project?.privateUrl){
  try{
    const r=await fetch(project.privateUrl,{redirect:"manual",headers:{"User-Agent":"softm-private-archive-guard/1.0"}});
    const protectedStatus=[301,302,303,307,308,401,403].includes(r.status);
    add("anonymous private URL is protected",protectedStatus,`HTTP ${r.status}`);
  }catch(e){ add("anonymous private URL check",false,e?.name||"request failed"); }
}

const failed=checks.filter(x=>!x.ok);
console.log("\nPRIVATE ARCHIVE PREFLIGHT");
for(const c of checks) console.log(`${c.ok?"[OK]":"[FAIL]"} ${c.name}: ${c.detail}`);
console.log(`\nResult: ${failed.length?"INCOMPLETE":"PASS"} (${checks.length-failed.length}/${checks.length})`);
if(failed.length) process.exit(1);
