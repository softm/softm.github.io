#!/usr/bin/env python3
"""Apply the user-confirmed listing-title policy without rewriting archive bodies."""
from __future__ import annotations
import copy, hashlib, json, os, re, sys, time
from pathlib import Path
from urllib.request import Request, urlopen

DOCS=Path(__file__).resolve().parent
PROJECTS=DOCS.parent
TITLE='20260809_화곡농장_스프링클러_배관계획_작업정리'
HOME='https://softm.github.io/hwagok-farm/'
CENTRAL='https://softm.github.io/projects/hwagok-farm/'
DETAIL=HOME+'records/20260809-sprinkler-piping-plan/'
RULE='inbox-name-list-title-v1'
VERSION='20261008-inbox-list-title-v22'
NOTE='''## 2026-10-08 확정: 입력 이름을 목록 제목으로 사용

**zip/ 폴더 아카이브 배포의 목록 제목은 작업 폴더명 또는 ZIP 파일명 그대로 사용한다.** ZIP 확장자, 날짜, 한글, 공백, 밑줄도 별도 지시 없이는 보존한다. HTML H1·MD 제목·자동 요약·slug로 목록 제목을 대체하지 않는다.

정상 원본 HTML/MD는 변경하지 않는다. `listTitle`(입력 이름)과 `sourceTitle`(본문 제목)을 분리하며, 기존 제목 일치 규칙보다 이 ZIP·폴더 목록 제목 예외를 우선한다. 기존 URL·slug·사건일·기록 수·공개 범위는 유지하고 프로젝트 자체 목록, 중앙 프로젝트 홈, 전체 projects의 관련 기록 정보에 같은 목록 제목을 사용한다.

상세 기준: [ZIP·폴더 목록 제목 기준](INBOX-LIST-TITLE-POLICY.md). 정책 저장·개별 적용·운영 검증·전역 메모리 저장은 서로 다른 결과로 보고한다.
'''

def append_note(path):
    text=path.read_text(encoding='utf-8')
    if NOTE.splitlines()[0] not in text:
        path.write_text(text.rstrip()+'\n\n'+NOTE,encoding='utf-8')

def replace_once(path,old,new):
    text=path.read_text(encoding='utf-8')
    if new in text:return
    if text.count(old)!=1:raise RuntimeError('Source changed; review required: '+str(path))
    path.write_text(text.replace(old,new,1),encoding='utf-8')

def policy():
    rule=DOCS/'INBOX-LIST-TITLE-POLICY.md'
    assert rule.is_file() and RULE in rule.read_text(encoding='utf-8')
    for filename in ['README.md','archive_deployment_prompt.md','20261005_아카이브배포_ZIP폴더_Workflow_처리기준.md']:
        append_note(DOCS/filename)
    prompt=DOCS/'MD-HTML-ZIP-PROMPT.md'
    old='`date`, `title`, `slug`, `id`를 하나의 canonical 메타데이터로 정의한다. 목록 제목·상세 H1·브라우저 제목·MD 제목·프로젝트 홈·중앙 인덱스는 같은 제목을 사용한다. 제목 앞 날짜가 필요하면 같은 date에서 생성한다. 동일 기록에 새 slug를 무분별하게 부여하지 않는다.'
    new='`date`, `title`, `slug`, `id`를 canonical 메타데이터로 관리한다. **ZIP·폴더 배포의 목록 제목은 입력 작업 폴더명 또는 ZIP 파일명 그대로 사용한다.** `listTitle`과 기존 본문 `sourceTitle`을 분리하고, 목록 제목을 맞추기 위해 정상 HTML H1·브라우저 제목·MD 원문을 덮어쓰지 않는다. 이 경우 날짜·밑줄·공백·ZIP 확장자를 지우거나 날짜를 추가하지 않는다. 프로젝트 자체 목록·중앙 프로젝트 홈·전체 projects의 관련 기록 정보는 같은 `listTitle`을 사용한다. 다른 신규 생성 문서는 기존 제목 일치 기준을 유지한다. 기존 사건일·id·slug·URL을 변경하거나 중복 기록을 만들지 않는다. 상세 기준은 [INBOX-LIST-TITLE-POLICY.md](INBOX-LIST-TITLE-POLICY.md)다.'
    replace_once(prompt,old,new)
    req=DOCS/'MD-HTML-ZIP-REQUIREMENTS.md'
    replace_once(req,'| R11 | 사용자 지정 제목, canonical date/title/slug/id | 4 | 모든 화면과 문서 일치 |','| R11 | 사용자 지정 제목과 canonical 식별자. ZIP·폴더는 listTitle과 본문 sourceTitle 분리 | 4 | 목록 간 제목 일치, 정상 원본 본문 보존 |')
    text=req.read_text(encoding='utf-8')
    if '| R52 |' not in text:
        row='| R52 | zip/ 아카이브 목록 제목은 입력 폴더명·ZIP 파일명 그대로. 날짜·공백·밑줄·확장자 유지, 본문 제목으로 대체 금지 | 4, INBOX-LIST-TITLE-POLICY | 입력 이름과 세 목록의 listTitle 일치, sourceTitle·원본 해시·URL·기록 수 보존 |\n'
        text=text.replace('\n## 2.', '\n'+row+'\n## 2.',1)
        req.write_text(text,encoding='utf-8')
    readme=DOCS/'README.md';text=readme.read_text(encoding='utf-8').replace('51개 요구사항','52개 요구사항')
    readme.write_text(text,encoding='utf-8')
    append_note(DOCS/'CHANGELOG.md')
    # Prefer an explicit listTitle without stripping its date, whitespace or extension.
    old="function display(row){const date=authoredDate(row);if(row.dateSource==='archive-canonical'){const title=text(row.title)||text(row.label)||'기록';return {...row,displayDate:date,displayName:title,displayTitle:title,titleSource:'archive-canonical'}}"
    guard="if(typeof row.listTitle==='string'&&row.listTitle.length){const title=row.listTitle;return {...row,displayDate:date,displayName:title,displayTitle:title,titleSource:row.titleSource||'inbox-name'}}"
    new="function display(row){const date=authoredDate(row);"+guard+old.split('const date=authoredDate(row);',1)[1]
    for filename in ['project-home.js','sync-archive-catalog.py']:
        replace_once(PROJECTS/filename,old,new)
    sync=PROJECTS/'archive-sync.js'
    replace_once(sync,'const dir=text(row.dir),title=text(row.title),date=text(row.date);',"const dir=text(row.dir),title=(typeof row.listTitle==='string'&&row.listTitle.length?row.listTitle:text(row.title)),date=text(row.date);")
    replace_once(sync,"return {visibility:'public',label:title,title,chatTitle:title,date,dateSource:'archive-canonical',titleSource:'archive-canonical',url:row.url,repoUrl:row.repoUrl,category:text(row.kind)||'아카이브',summary:text(row.desc),directory:dir,recordPath:'public/records/'+dir};", "return {...(typeof row.listTitle==='string'&&row.listTitle.length?{listTitle:row.listTitle,inputName:row.inputName,inputKind:row.inputKind,sourceTitle:row.sourceTitle}:{}),visibility:'public',label:title,title,chatTitle:title,date,dateSource:'archive-canonical',titleSource:row.listTitle?(row.titleSource||'inbox-name'):'archive-canonical',url:row.url,repoUrl:row.repoUrl,category:text(row.kind)||'아카이브',summary:text(row.desc),directory:dir,recordPath:'public/records/'+dir};")
    # The public heading audit checks sourceTitle, not the intentionally different listTitle.
    audit=PROJECTS/'audit-live-titles.py'
    replace_once(audit,"'expected':row['displayTitle']", "'expected':row.get('sourceTitle',row['displayTitle']) if row.get('listTitle') else row['displayTitle'],'listTitle':row.get('listTitle'),'inputName':row.get('inputName')")
    replace_once(audit,"if t=='h1':self.cur=[]", "if t=='h1':self.cur=[]\n        if t=='br' and self.cur is not None:self.cur.append(' ')")
    # Version the runtime and its generator together so later runs do not revert it.
    for filename in ['project-home.js','home-generator.py','sync-archive-catalog.py']:
        p=PROJECTS/filename;text=p.read_text(encoding='utf-8')
        text,n=re.subn(r"((?:const )?VERSION\s*=\s*)['\"][^'\"]+['\"]",lambda m:m[1]+repr(VERSION),text,count=1)
        assert n==1
        p.write_text(text,encoding='utf-8')
    for filename in ['index.html','hwagok-farm/index.html']:
        p=PROJECTS/filename;text=p.read_text(encoding='utf-8')
        text=re.sub(r'([?&]v=)[^\"\x27&<>\s]+',lambda m:m[1]+VERSION,text)
        text=re.sub(r'(data-home-version=[\"\x27])[^\"\x27]+',lambda m:m[1]+VERSION,text)
        p.write_text(text,encoding='utf-8')
    tests="""'use strict';
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
"""
    (PROJECTS/'inbox-list-title.test.cjs').write_text(tests,encoding='utf-8')
    print('Policy documents and shared list-title handling updated; original archive bodies untouched.')

def fetch(url):
    if not url.startswith('https://softm.github.io/'):raise ValueError('Public project URL required')
    with urlopen(Request(url,headers={'Cache-Control':'no-cache','User-Agent':'SOFTM-Title-Policy'}),timeout=30) as response:
        assert response.status==200
        return response.read()

def catalog():
    row=None
    for attempt in range(90):
        try:
            text=fetch(HOME+'?title-policy='+str(time.time_ns())).decode('utf-8')
            match=re.search(r'<script\b[^>]*id=[\"\x27]archive-data[\"\x27][^>]*>(.*?)</script>',text,re.S)
            rows=json.loads(match[1]);row=next(r for r in rows if r.get('url')==DETAIL)
            if row.get('title')==TITLE and row.get('listTitle')==TITLE:break
        except Exception as e:print('Awaiting published input title:',type(e).__name__,flush=True)
        time.sleep(10)
    else:raise RuntimeError('Input-name title not yet deployed; central record is not marked complete')
    # Refresh before editing to preserve concurrent work on other projects.
    import subprocess
    subprocess.run(['git','pull','--ff-only','origin','main'],check=True)
    p=PROJECTS/'projects.json';data=json.loads(p.read_text(encoding='utf-8'));before=copy.deepcopy(data['projects'])
    project=next(x for x in data['projects'] if x['repo']=='hwagok-farm')
    matches=[x for x in project['links'] if x.get('url')==DETAIL]
    assert len(matches)==1
    entry=matches[0]
    entry.update({k:row[k] for k in ['inputName','inputKind','listTitle','sourceTitle','titleSource']})
    entry.update(title=TITLE,label=TITLE,chatTitle=TITLE)
    for old,new in zip(before,data['projects']):
        if old['repo']!='hwagok-farm':assert old==new,'Unrelated project changed'
        else:
            assert len(old['links'])==len(new['links'])
            assert [x for x in old['links'] if x.get('url')!=DETAIL]==[x for x in new['links'] if x.get('url')!=DETAIL]
    data['archivePolicy'].update(listTitlePolicy='projects/archive-deployment/INBOX-LIST-TITLE-POLICY.md',listTitleRule='Input folder or ZIP filename verbatim; preserve original body titles separately',listTitleSource='inbox-name')
    data['homeVersion']=VERSION;data['updatedAt']='2026-10-08'
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'listTitle':TITLE,'sourceTitle':entry['sourceTitle'],'recordCountUnchanged':len(project['links']),'otherProjectsUnchanged':True},ensure_ascii=False))

if __name__=='__main__':
    {'policy':policy,'catalog':catalog}[sys.argv[1]]()
