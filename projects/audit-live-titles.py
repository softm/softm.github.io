#!/usr/bin/env python3
"""Public title verification. Private entries are inventoried but never fetched."""
import json,re,subprocess,time
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,urljoin
from urllib.request import Request,urlopen,HTTPRedirectHandler,build_opener
ROOT=Path(__file__).resolve().parent
catalog=json.loads((ROOT/'projects.json').read_text())
metadata=json.loads((ROOT/'chat-metadata.json').read_text())
js="const p=require(process.argv[1]),fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(d.projects.map(x=>({repo:x.repo,title:x.title,home:p.homeUrl(x),rows:p.lists(x,d.metadata)}))));"
records=json.loads(subprocess.run(['node','-e',js,str(ROOT/'project-home.js')],input=json.dumps({'projects':catalog['projects'],'metadata':metadata},ensure_ascii=False),text=True,capture_output=True,check=True).stdout)
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
opener=build_opener(NoRedirect)
class H1(HTMLParser):
    def __init__(self): super().__init__();self.h=[];self.cur=None;self.refresh=None
    def handle_starttag(self,t,a):
        a=dict(a)
        if t=='h1':self.cur=[]
        if t=='br' and self.cur is not None:self.cur.append(' ')
        if t=='meta' and a.get('http-equiv','').lower()=='refresh':self.refresh=a.get('content','')
    def handle_data(self,d):
        if self.cur is not None:self.cur.append(d)
    def handle_endtag(self,t):
        if t=='h1' and self.cur is not None:self.h.append(' '.join(''.join(self.cur).split()));self.cur=None

def probe(item):
    result=dict(item)
    if item['visibility']=='private':result['status']='private-authenticated-page-not-fetched';return result
    url=item['url']
    if not url:result['status']='no-url';return result
    u=urlsplit(url)
    if u.netloc!='softm.github.io' or not u.path.strip('/') or u.path.startswith('/projects/'):
        result['status']='external-service-or-project-home';return result
    if re.search(r'\.(jpg|png|mp4|m4a|pdf|zip|docx|xlsx)$',u.path,re.I):result['status']='attachment-not-page';return result
    try:
        for _ in range(4):
            req=Request(url+('&' if '?' in url else '?')+'title-audit='+str(int(time.time())),headers={'User-Agent':'SOFTM-Title-Consistency','Cache-Control':'no-cache'})
            try:
                response=opener.open(req,timeout=25)
            except Exception as error:
                if getattr(error,'code',0) in [301,302,303,307,308]:
                    dest=urljoin(url,error.headers['Location'])
                    if urlsplit(dest).netloc!='softm.github.io':raise RuntimeError('external-redirect-unverified')
                    url=dest;continue
                raise
            with response:
                if response.status!=200:raise RuntimeError('HTTP '+str(response.status))
                raw=response.read(2500001)
                if len(raw)>2500000:raise RuntimeError('document-too-large')
                doc=raw.decode('utf-8')
            p=H1();p.feed(doc)
            if p.refresh:
                m=re.search(r'url\s*=\s*(.*)',p.refresh,re.I)
                if not m:raise RuntimeError('invalid-document-redirect')
                target=urljoin(url,m.group(1).strip().strip('\"\''))
                if urlsplit(target).netloc!='softm.github.io':raise RuntimeError('external-redirect-unverified')
                url=target;continue
            result.update(http=200,finalUrl=url,actual=p.h,status='matched' if p.h==[item['expected']] else 'title-mismatch')
            return result
        raise RuntimeError('redirect-limit')
    except Exception as error:result.update(status='unverified',error=str(error),http=getattr(error,'code',None));return result

entries=[]
for p in records:
    for v in ['public','private']:
        for row in p['rows'][v]:entries.append({'project':p['repo'],'visibility':v,'url':row.get('url',''),'name':row['displayName'],'authoredDate':row['displayDate'],'expected':row.get('sourceTitle',row['displayTitle']) if row.get('listTitle') else row['displayTitle'],'listTitle':row.get('listTitle'),'inputName':row.get('inputName')})
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(probe,entries))
projects=[]
for p in records:
    rows=[r for r in results if r['project']==p['repo']];counts={}
    for r in rows:counts[r['status']]=counts.get(r['status'],0)+1
    projects.append({'repo':p['repo'],'title':p['title'],'home':p['home'],'rows':len(rows),'publicRows':sum(r['visibility']=='public' for r in rows),'privateRows':sum(r['visibility']=='private' for r in rows),'counts':counts})
report={'checkedAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'projectCount':len(projects),'rowCount':len(entries),'privateContentFetched':False,'projects':projects,'results':results}
out=ROOT/'title-audit';out.mkdir(exist_ok=True)
(out/'live-titles.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'projects':projects,'mismatches':[r for r in results if r['status']=='title-mismatch']},ensure_ascii=False,indent=2))
