#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";

const argv=process.argv.slice(2);
const args={};
for(let i=0;i<argv.length;i++) if(argv[i].startsWith("--")) args[argv[i].slice(2)]=argv[i+1] && !argv[i+1].startsWith("--") ? argv[++i] : "true";
for(const k of ["project","record","title","date","url","repo-url"]){
  if(!args[k]){ console.error(`missing --${k}`); process.exit(2); }
}

const file="projects/projects.json";
const data=JSON.parse(fs.readFileSync(file,"utf8"));
const project=data.projects.find(p=>p.repo===args.project);
if(!project){ console.error("project not found:",args.project); process.exit(2); }
if(!project.privateRepo || !project.privateUrl){ console.error("project has no private archive configuration"); process.exit(2); }

const item={
  visibility:"private",
  label:args.title,
  title:args.title,
  chatTitle:args.title,
  date:args.date,
  dateSource:"archive-canonical",
  titleSource:"archive-canonical",
  category:args.category || "비공개 아카이브",
  url:args.url,
  repoUrl:args["repo-url"],
  directory:args.record,
  recordPath:`archive/${args.record}`,
  summary:args.summary || "비공개 상세 열람은 인증 필요.",
  publicSummary:args["public-summary"] || "비공개 상세 열람은 인증 필요."
};
project.links=Array.isArray(project.links)?project.links.filter(x=>x.directory!==args.record):[];
project.links.push(item);
project.links.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")) || String(a.title||"").localeCompare(String(b.title||"")));
project.privatePageCount=project.links.filter(x=>x.visibility==="private").length;
project.homePrivateListCount=project.privatePageCount;
project.latestTitle=project.links[0]?.title || project.latestTitle;
project.archiveLastPublishedAt=new Date().toISOString();
project.deploymentStatus="deployed";
data.updatedAt=args.date;
fs.writeFileSync(file,JSON.stringify(data,null,2)+"\n");
console.log(JSON.stringify({project:args.project,record:args.record,latestTitle:project.latestTitle,privatePageCount:project.privatePageCount},null,2));
