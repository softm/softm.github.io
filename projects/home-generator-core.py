#!/usr/bin/env python3
"""Generate public project home TOCs without touching any archived source/media."""
from __future__ import annotations
import hashlib, html, json, re
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path('projects')
BASE='https://softm.github.io/projects/'
VERSION='20260930-project-homes-v2'
UPDATED_AT='2026-10-10'
E=lambda value: html.escape(str(value or ''), quote=True)
# Public-safe labels only. No private document bodies, credentials, or media bytes.
CHAT_PATHS={
 'hwagok-farm':[
  ('농업인 안전보험 가입 기록','records/20260812-nh-farm-safety-insurance/'),
  ('파종 작업 기록','records/20260905-radish-sowing/'),
  ('비료 사용 계획','fertilizer-plan-20260914/'),
  ('방제 상담 기록','pesticide-consultation/')],
 'mine-private':[
  ('진료 경과 정리','archive/20260806-right-index-laceration/'),
  ('진료의뢰서 정리','archive/20260810-medical-referral/'),
  ('농업인 안전보험 가입 정리','archive/20260812-farmer-safety-insurance/'),
  ('내가 가진 것 정리','archive/20260819-all-i-have/'),
  ('건강검진·보험 서류 정리','archive/20260903-health-checkup-insurance/'),
  ('임대차 갱신 정리','archive/20260904-onsu-hill-renewal/')],
 'father-hospital-treatment-private':[
  ('진료기록 발급·정정 요청','archive/20260923-seosan-medical-record-ha-correction'),
  ('민원답변 검토','archive/20260911-seosan-medical-center-response-review'),
  ('보험 보완서류 준비','archive/20260908-teacher-mutual-aid-adl-documents'),
  ('보험금 심사 관련 민원','archive/20260819-teacher-mutual-aid-insurance-complaint'),
  ('의무기록 정정·민원','archive/20260811-seosan-medical-record-complaint'),
  ('의무기록 정정 및 재심사 정리','archive/20260807-seosan-medical-record-correction'),
  ('진료 녹취 정리','archive/20260703-neuro-ophthalmology-visual-field')],
 'onsuhill-private':[
  ('임대차 갱신계약 정리','api/site?route=renewal'),
  ('계약서·생성 문서 목록','api/site?route=documents'),
  ('문자·전화 대응 정리','api/site?route=messages'),
  ('시설 수선 검토','api/site?route=facilities'),
  ('전세계약 갱신 검토','api/site?route=okgil'),
  ('LED 수리 기록·증빙','api/site?route=led-repair')],
 'hwagok-land-permit-private':[
  ('사건 접수·증거 정리','case/appeal'),
  ('사건 검토 기록','case/prosecution-outlook'),
  ('처분·항고 정리','case/nonprosecution-appeal'),
  ('사건·대화 타임라인','asset/archive-20260926.html'),
  ('항고장 보관 기록','asset/appeals-20260922/staging.html')],
 'baksok-public':[
  ('가구 계약·설비 구매 정리','reports/20260909-furniture-gas/'),
  ('제품 배송·개봉 기록','reports/20260911-rir4000s-delivery/'),
  ('운영·세무 분석 정리','reports/20260721-tax/')],
 'ungdo-private':[]
}
CSS='''*{box-sizing:border-box}body{margin:0;background:#f4f7f4;color:#1b3429;font:16px/1.65 system-ui,-apple-system,"Noto Sans KR",sans-serif}a{color:#205b43;text-underline-offset:3px}a:focus-visible,input:focus-visible,button:focus-visible{outline:3px solid #d79319;outline-offset:4px}.wrap{width:min(1160px,calc(100% - 32px));margin:auto}.hero{background:#173b2c;color:white;padding:38px 0}.hero a{color:#d7eddf}.eyebrow{font-size:12px;letter-spacing:.15em}h1{font-size:clamp(28px,5vw,44px);line-height:1.2;margin:16px 0}h2{font-size:24px;margin:28px 0 14px}h3{font-size:19px;margin:8px 0}.lead{max-width:850px}.stats,.actions,.tabs{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.badge{display:inline-block;padding:4px 10px;border-radius:30px;background:#e8f1ea;color:#31563d;font-size:13px}.private{background:#edf0fb;color:#344b7a}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.card{background:#fff;border:1px solid #d4e1d6;border-radius:15px;padding:20px;min-width:0}.card p{color:#526c5b}.card a{overflow-wrap:anywhere}.button{display:inline-block;padding:9px 13px;border:1px solid #bbd0c0;border-radius:9px;background:white;text-decoration:none;font-weight:700}.primary{background:#205b43;color:white}.note,.empty{padding:16px 18px;border-radius:12px;background:#fff8e7;border:1px solid #ead7a8;margin:16px 0}.muted{color:#647367;font-size:14px}.toolbar{margin:22px 0}input{width:100%;padding:12px;border:1px solid #b9ccbe;border-radius:9px;font:inherit}.repo{font-size:13px}.disabled{color:#825c19}footer{border-top:1px solid #d4e1d6;margin:34px 0;padding:20px 0;font-size:13px;color:#566d5e}details{margin-top:15px}summary{cursor:pointer}.chat{border-left:4px solid #b7cfbd}.chat.private{background:white;border-left-color:#8399c3}.count{font-size:15px;color:#647367}[hidden]{display:none!important}@media(max-width:700px){.grid{grid-template-columns:1fr}.hero{padding:28px 0}.card{padding:17px}}'''
JS="""const q=document.querySelector('#search');if(q)q.addEventListener('input',()=>{const v=q.value.trim().toLocaleLowerCase();document.querySelectorAll('[data-search]').forEach(el=>{el.hidden=!el.dataset.search.toLocaleLowerCase().includes(v)});});"""

def safe_url(value):
    if not isinstance(value,str): return ''
    u=urlsplit(value)
    return value if u.scheme=='https' and u.netloc and not u.username and not u.password else ''

def anchor(url,label,kind=''):
    u=safe_url(url)
    return f'<a class="button {E(kind)}" href="{E(u)}" rel="noreferrer">{E(label)}</a>' if u else ''

def frame(title,body,canonical):
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="description" content="{E(title)} 공개·비공개 채팅 정리 목록"><link rel="canonical" href="{E(canonical)}"><title>{E(title)} · SOFTM</title><style>{CSS}</style></head><body data-home-version="{VERSION}">{body}<script>{JS}</script></body></html>'''

def unique(items):
    out=[]; seen=set()
    for x in items:
        u=safe_url(x.get('url'))
        key=u or x.get('label')
        if key in seen: continue
        seen.add(key); out.append(dict(x,url=u))
    return out

def chats(p):
    known=p.get('links',[])
    pub=unique([x for x in known if x.get('visibility')=='public'])
    pri=[]
    base=(p.get('privateUrl') or '').rstrip('/')+'/'
    for title,path in CHAT_PATHS.get(p['repo'],[]):
        if safe_url(base): pri.append({'label':title,'url':base+path,'visibility':'private'})
    pri=unique(pri+[x for x in known if x.get('visibility')=='private'])
    service=safe_url(p.get('publicUrl'))
    if service and not any(x['url']==service for x in pub):
        pub.append({'label':'기존 공개 서비스·기록 홈','url':service,'visibility':'public','kind':'service'})
    if not pri and safe_url(p.get('privateUrl')) and p.get('deploymentStatus') in ('deployed','static-html-deployed'):
        pri=[{'label':p.get('latestTitle') or '기존 비공개 채팅 정리','url':p['privateUrl'],'visibility':'private','kind':'legacy-home'}]
    if p['repo']=='yeonseo' and not pri:
        pri.append({'label':'비공개 기록','url':'','visibility':'private','note':'Private GitHub 원본은 보존되어 있습니다. 인증된 웹 배포 연결 전입니다.'})
    if p['repo']=='medical-finder' and not pri:
        pri=[{'label':'사이트 기획·데이터·구현 문서','url':'','visibility':'private','note':'비공개 저장소에 보관 중이며 인증된 웹 배포 주소가 아직 없습니다.'}]
    return pub,pri

def section(title,rows,private=False):
    typ='private' if private else 'public'; parts=[]
    for x in rows:
        label=x.get('label') or '채팅 정리'; u=x.get('url','')
        host=urlsplit(u).hostname or ''
        method='비공개 서버 인증' if host.endswith('.vercel.app') else '기존 플랫폼 인증'
        note=x.get('note') or (f'{method} 경로 · 원문과 첨부는 비공개 사이트에서 엽니다.' if private else '기존 상세 본문·첨부 페이지로 연결합니다.')
        action=anchor(u,'인증 후 채팅 열기' if private else '상세 기록 열기','primary')
        if not action: action='<span class="disabled">웹 배포 연결 전</span>'
        parts.append(f'<article class="card chat {typ}" data-search="{E(label)}"><span class="badge {typ}">{"🔒 비공개" if private else "공개"}</span><h3>{E(label)}</h3><p class="muted">{E(note)}</p>{action}</article>')
    empty='등록된 비공개 채팅이 없습니다.' if private else '등록된 공개 채팅이 없습니다.'
    return f'<section id="{typ}"><h2>{title} <span class="count">{len(rows)}개</span></h2>'+('<div class="grid">'+''.join(parts)+'</div>' if parts else f'<p class="empty">{empty}</p>')+'</section>'

def build():
    source=ROOT/'projects.json'; original=json.loads(source.read_text(encoding='utf-8'))
    data=json.loads(json.dumps(original)); generated=[]; report=[]
    for p in data['projects']:
        repo=p['repo']; slug={'baksok-public':'baksok','mine-private':'mine'}.get(repo,repo.removesuffix('-private'))
        assert re.fullmatch(r'[a-zA-Z0-9_-]+',slug),slug
        home=BASE+slug+'/'
        p.setdefault('previousHomeUrl',p.get('homeUrl'))
        p.update(projectHomeUrl=home,homeUrl=home,publicHomeStatus='github-pages-home-generated')
        if p.get('repoStatus')=='missing': p.pop('publicRepoUrl',None)
        if not p.get('privateEntryPolicy'):
            p['privateEntryPolicy']='direct-deep-link; server authentication; return to requested chat'
        if 'vercelAccountAuthVerified' not in p:
            p['vercelAccountAuthVerified']=False
        pub,pri=chats(p)
        p['homePublicListCount']=len(pub);p['homePrivateListCount']=len(pri)
        repolinks=anchor(p.get('publicRepoUrl'),'GitHub 공개 저장소')+anchor(p.get('privateRepoUrl'),'🔒 GitHub 비공개 저장소')
        missing=''
        if not p.get('publicRepoUrl'): missing+='<span class="muted">프로젝트별 공개 저장소 미연결 · 이 안내 홈은 공개 softm.github.io 저장소에서 제공합니다.</span>'
        status=E(p.get('deploymentNote') or '기존 배포 상태를 확인해야 합니다.')
        notice='홈과 채팅 목록은 공개입니다. 비공개 항목은 선택한 채팅의 주소로 이동하며 해당 서버에서 인증합니다. 별도의 Vercel 계정 선택 로그인 활성화는 아직 확인되지 않았습니다.'
        body=f'''<header class="hero"><div class="wrap"><a href="{BASE}">← 전체 프로젝트</a><p class="eyebrow">PUBLIC PROJECT HOME / GITHUB PAGES</p><h1>{E(p['title'])}</h1><p class="lead">{E(p.get('description'))}</p></div></header><main class="wrap"><nav class="tabs" aria-label="채팅 목록"><a class="button" href="#public">공개 목록 {len(pub)}</a><a class="button" href="#private">비공개 목록 {len(pri)}</a></nav><div class="actions repo">{repolinks}</div>{missing}<div class="note">{notice}</div><label class="toolbar"><span>채팅 제목 검색</span><input id="search" type="search" placeholder="채팅 제목으로 찾기"></label>{section('공개 채팅·자료 목록',pub)}{section('비공개 채팅·자료 목록',pri,True)}<details><summary>배포·미디어 점검 상태</summary><p>{status}</p><p>{E(p.get('mediaStatus') or '미디어 전체 검증 전')}</p></details><footer>기존 HTML·Markdown·사진·영상·음성·문서 원본은 각 프로젝트 저장소에 유지합니다. 이 홈은 원본을 대체하지 않는 공개 목차입니다.<br>홈 구성 갱신: {UPDATED_AT} · 인증 후 본문·재생 검증과 홈 생성은 별도입니다.</footer></main>'''
        dest=ROOT/slug/'index.html'; dest.parent.mkdir(parents=True,exist_ok=True)
        text=frame(p['title'],body,home);dest.write_text(text,encoding='utf-8'); generated.append(str(dest))
        assert 'id="public"' in text and 'id="private"' in text
        for x in pub+pri:
            if x['url']: assert E(x['url']) in text
        old=next(a for a in original['projects'] if a['repo']==repo)
        assert p.get('links',[])==old.get('links',[])
        report.append({'repo':repo,'title':p['title'],'homeUrl':home,'publicEntries':len(pub),'privateEntries':len(pri),'htmlSha256':hashlib.sha256(text.encode()).hexdigest(),'authenticatedContentVerified':False})
    data['projectClickRule']='프로젝트명과 프로젝트 홈 버튼은 공개 GitHub Pages 프로젝트 홈으로 연결한다. 홈에는 공개·비공개 채팅 목록을 표시하고 비공개 원문은 서버 인증 후 열람한다.'
    data['updatedAt']=UPDATED_AT;data['homeVersion']=VERSION
    data['archivePolicy']['projectHome']='Public GitHub Pages TOC; private bodies and media remain in the original private repository'
    source.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');generated.append(str(source))
    cards=[]
    for p in sorted(data['projects'],key=lambda p:p.get('order',0)):
        h=p['projectHomeUrl'];repos=anchor(p.get('publicRepoUrl'),'GitHub 공개 저장소')+anchor(p.get('privateRepoUrl'),'🔒 GitHub 비공개 저장소')
        cards.append(f'''<article class="card" data-search="{E(p['title']+' '+p.get('category',''))}"><span class="badge">{E(p.get('category'))}</span><h2><a href="{E(h)}">{E(p['title'])}</a></h2><p>{E(p.get('description'))}</p><p class="muted">홈 목록: 공개 {p['homePublicListCount']} · 비공개 {p['homePrivateListCount']}</p><div class="actions">{anchor(h,'프로젝트 홈 · 채팅 목록','primary')}</div><div class="actions repo">{repos}</div><details><summary>기존 배포·미디어 상태</summary><p>{E(p.get('mediaStatus'))}</p><p>{E(p.get('deploymentNote'))}</p></details></article>''')
    body=f'''<header class="hero"><div class="wrap"><p class="eyebrow">SOFTM / PROJECT DIRECTORY</p><h1>전체 프로젝트</h1><p>프로젝트 홈에서 공개·비공개 채팅 정리 목록을 확인합니다.</p><p>전체 프로젝트 → 공개 프로젝트 홈 → 채팅 선택 → 비공개인 경우 인증 → 기존 상세 원문</p></div></header><main class="wrap"><div class="stats"><span class="badge">프로젝트 {len(cards)}개</span><span class="badge">프로젝트 홈: 공개 GitHub Pages</span></div><div class="note">홈과 목록은 공개이며 비공개 원문·첨부는 인증된 기존 사이트에서 열립니다. 기존 상세자료를 요약문으로 대체하지 않습니다.</div><div class="toolbar"><label>프로젝트 검색<input id="search" type="search" placeholder="프로젝트명 또는 분야"></label></div><div class="grid">{''.join(cards)}</div><footer><a href="https://github.com/softm/softm.github.io/blob/main/projects/README.md">아카이브 배포 규칙</a> · 갱신 {UPDATED_AT}<br>프로젝트 홈 생성은 비공개 운영 배포·원본 복구 완료를 의미하지 않습니다.</footer></main>'''
    (ROOT/'index.html').write_text(frame('전체 프로젝트',body,BASE),encoding='utf-8');generated.append('projects/index.html')
    policy='''\n\n## 프로젝트 홈 탐색 규칙 (2026-09-30 확정)\n\n전체 프로젝트 → 공개 GitHub Pages 프로젝트 홈 → 공개·비공개 채팅 목록 → 선택한 채팅.\n프로젝트 홈은 로그인 없이 열리는 공개 목차이며 각 원본 저장소 링크를 함께 표시한다.\n비공개 목록은 제목·안전한 안내·접근 주소만 공개한다. 비공개 본문과 미디어는 원래 Private 저장소에서 유지한다.\n비공개 항목은 개별 원문 주소로 연결하여 서버 인증 후 해당 채팅으로 돌아간다.\n동일 URL에 서로 다른 인증 이름을 붙이는 것만으로 두 인증 방식을 구현했다고 간주하지 않는다.\nVercel 계정 인증 활성화와 프로젝트 자체 비밀번호 인증은 별도로 검증한다. 선택형 인증 요청을 임의로 필수 이중 인증으로 바꾸지 않는다.\n프로젝트 홈의 기본 주소는 https://softm.github.io/projects/<project>/ 이며 기존 서비스 URL과 구분한다.\n'''
    readme=ROOT/'README.md';old=readme.read_text(encoding='utf-8')
    if '## 프로젝트 홈 탐색 규칙 (2026-09-30 확정)' not in old:readme.write_text(old+policy,encoding='utf-8')
    generated.append(str(readme))
    result={'version':VERSION,'projectCount':len(report),'projects':report,'files':generated+['projects/home-build.json'],'detailsAndMediaModified':False}
    (ROOT/'home-build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'projectCount':len(report),'publicEntries':sum(x['publicEntries'] for x in report),'privateEntries':sum(x['privateEntries'] for x in report),'preservedOriginalProjectCount':len(original['projects']),'generatedFiles':len(result['files'])},ensure_ascii=False))

if __name__=='__main__':build()
