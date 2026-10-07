#!/usr/bin/env python3
"""Add viewers to existing canonical records. Never delete inputs or change auth."""
from __future__ import annotations
import argparse, hashlib, html, json, os, re, shutil, subprocess, tempfile, urllib.request
from pathlib import Path
from urllib.parse import quote

VERSION = '1.0.1'
BASE = Path(__file__).resolve().parent
POLICY = '''# 아카이브 미디어·문서 뷰어/플레이어 기준

확정: 2026-10-07 · 사용자 요청: 텍스트·이미지·동영상·PDF 등 가능한 모든 포맷에 플레이어/뷰어 적용. 현재 프로젝트에도 적용.

## 공통 필수 원칙

아카이브는 다운로드 링크만 나열하지 않는다. 사용 가능한 브라우저 뷰어/플레이어 또는 안전한 미리보기를 제공하고 원본 열기·다운로드를 항상 유지한다. 원본 HTML 우선, HTML 없는 MD의 전체 본문 HTML 변환 기준은 유지한다.

| 형식 | 구현 기준 | 제한/대체 |
|---|---|---|
| TXT·LOG·JSON·XML·YAML·녹취·코드·자막 | 읽기 전용 텍스트, 줄바꿈, 인코딩 선택, 복사 | 큰 파일은 한도 안내와 원본 |
| MD·Markdown | 정제한 HTML 본문/원문 전환 | 원본 MD 유지, 외부 자동 로딩 차단 |
| HTML·HTM | 스크립트를 실행하지 않는 격리 미리보기 | 원본 파일과 미리보기를 구분 |
| JPG·PNG·WEBP·GIF·AVIF·SVG·BMP·ICO | 썸네일, 확대/축소·회전·화면맞춤·이전/다음 | 브라우저 지원에 따름 |
| HEIC·HEIF·TIFF·PSD | 가능한 경우 별도 PNG 미리보기 생성 | 원본은 그대로, 실패 이유 표시; PSD는 합성 이미지, TIFF는 첫 페이지임을 명시 |
| MP4·WEBM·MOV·M4V·OGV 등 | controls, metadata preload, 모바일 playsinline, 배속·10초 탐색 | 확장자만으로 재생 보장 금지. 미지원 코덱이면 원본/호환 파생본 |
| MP3·M4A·WAV·OGG·FLAC·AAC·OPUS 등 | 오디오 controls, 배속·10초 탐색 | 브라우저·코덱 제한 및 원본 링크 |
| PDF | PDF.js 페이지 이동·확대·회전; 실패 시 브라우저 PDF 뷰어 | 암호/손상/용량 제한을 안내하고 원본 제공 |
| DOCX | 같은 사이트의 로컬 라이브러리로 문서 미리보기 | 서식·서명 확인은 원본/PDF. 외부 관계·매크로 실행 금지 |
| XLSX·XLS·XLSB·ODS·CSV·TSV | 시트 선택과 표 보기, 행 단위 탐색 | 저장된 값 보기. 수식·매크로 실행 금지; 대형 데이터 제한 표시 |
| PPTX·ODT·ODP·HWPX·EPUB | 텍스트와 내장 이미지 중심 구조 미리보기 | 원본 레이아웃·쪽나눔·애니메이션의 완전 재현으로 표시하지 않음 |
| ZIP | 내부 파일명·크기 목록, 지원 항목 선택 미리보기 | 자동 전체 해제/실행 금지, 개수·용량·경로 안전검사 |
| DOC·PPT·HWP·7Z·RAR·기타 미지원 바이너리 | 이름·크기·형식 및 원본 다운로드 | 가능한 안전한 파생 미리보기가 있을 때 추가, 불가능을 숨기지 않음 |

## 보안·원본·접근성

- 비공개 파일은 인증된 동일 사이트에서만 로드한다. Google Docs Viewer, Office Online 등 외부 뷰어에 private URL이나 원문을 보내지 않는다.
- 뷰어 코드는 형식별로 필요할 때 읽는다. 라이브러리는 버전과 해시·라이선스를 기록하고 같은 사이트에서 제공한다.
- HTML/MD는 정제 및 sandbox/CSP로 스크립트·이벤트·외부 자동 요청을 제한한다. 문서의 외부 참조·매크로·수식을 실행하지 않는다.
- 모든 원본 파일은 바이트와 SHA-256을 유지한다. 썸네일·프리뷰·뷰어 진입 HTML은 generated 산출물로 구분한다.
- 원본 HTML 파일과 내용·레이아웃은 보존한다. 뷰어를 붙이는 generated index에는 최소 진입 코드만 추가하고, 단독 index 원본이면 원본 보존본부터 만든다.
- 로딩, 미지원 형식, 인증 실패, 손상, 용량 제한에 각각 안내를 제공한다. 닫기/ESC, 키보드 탐색, 모바일 스크롤과 포커스를 지원한다.
- 형식 목록은 지원 시도 범위다. 같은 확장자 모든 파일의 완전한 표시·재생을 보장하지 않는다.
- 뷰어 추가 요청을 인증 완화나 새 공개 배포, 다른 프로젝트 전체 재배포 허가로 확대하지 않는다. 비공개 배포 구조 문제는 별도 상태로 보고한다.

## 자동 적용과 완료 판정

기존 canonical 기록 경로를 재사용하고 viewer-manifest.json에 이름·크기·SHA-256·뷰어 URL·파생 미리보기를 기록한다. 원본 MD 갱신/ZIP 처리 후 뷰어 생성 단계를 실행해 이후 변경에서도 유지한다. zip/ 입력은 삭제하지 않는다.

완료는 코드/커밋/READY가 아니라 실제 본문, 이미지 표시·확대, PDF 로딩, 문서 내용, 영상·음성 재생, 원본 링크, 모바일, 비인증 직접 접근 차단을 나누어 확인한다. 실제 원본이 없는 형식은 테스트 샘플 검증으로 명확히 구분한다. 공통 기준·공통 구현 수정과 다른 프로젝트 실제 적용 완료를 혼동하지 않는다.

전역 기억 저장과 중앙 기준 저장은 별도 작업이다. 메모리 도구가 비활성화된 경우 중앙 기준에 지속 보존했음을 알리고 별도의 전역 메모리 저장에 성공했다고 표현하지 않는다.

## 구현

- 공통 소스: `viewer/viewer.js`, `viewer/install.py`, `viewer/test_viewer.py`
- 재사용 Workflow: `.github/workflows/archive-viewers-reusable.yml`
- 기본 출력: `archive/_viewer/`, 각 기록의 `viewer-manifest.json`, `viewer.html`, generated index의 뷰어 연결
- 검증 상태를 중앙 프로젝트 metadata에 별도 기록하며 원본 본문은 공개 저장소로 복사하지 않는다.

## 기술 근거

PDF.js: https://github.com/mozilla/pdf.js
DOCX preview: https://github.com/VolodymyrBaydalka/docxjs
SheetJS 브라우저 배포: https://docs.sheetjs.com/docs/getting-started/installation/standalone/
브라우저 영상/음성 코덱: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats
'''

def sha(p: Path) -> str:
    h=hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def write_json(p, value):
    p.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def policy(root: Path):
    directory=root/'projects/archive-deployment'
    destination=directory/'MEDIA-VIEWER-POLICY.md'
    destination.write_text(POLICY,encoding='utf-8')
    marker='## 2026-10-07 확정: 가능한 모든 형식 뷰어·플레이어'
    note='\n\n'+marker+'\n\n[미디어·문서 뷰어/플레이어 기준](MEDIA-VIEWER-POLICY.md)을 공통 필수 기준으로 적용한다. 텍스트·MD·이미지·영상·음성·PDF·DOCX·스프레드시트·구조화 문서·ZIP은 가능한 인라인 뷰어를 제공한다. 미지원 형식/코덱은 한계를 명시하고 원본 열기·다운로드를 유지한다. 비공개 원문을 외부 뷰어로 보내지 않는다. 현재 요청의 실제 적용 대상은 온수힐이며, 다른 프로젝트까지 배포 완료됐다고 보고하지 않는다.\n'
    for name in ['README.md','MD-HTML-ZIP-PROMPT.md','archive_deployment_prompt.md','20261005_아카이브배포_ZIP폴더_Workflow_처리기준.md','CHANGELOG.md']:
        p=directory/name
        if p.exists():
            text=p.read_text(encoding='utf-8')
            if marker not in text: p.write_text(text.rstrip()+note,encoding='utf-8')
    p=root/'projects/projects.json'
    if p.exists():
        data=json.loads(p.read_text(encoding='utf-8'))
        data.setdefault('archivePolicy',{})['mediaViewerPolicy']='projects/archive-deployment/MEDIA-VIEWER-POLICY.md'
        data['archivePolicy']['mediaViewerRequirement']='가능한 모든 형식에 인라인 뷰어/플레이어; 미지원 형식·코덱은 명시; 원본 보존·인증 유지·외부 뷰어 전송 금지'
        write_json(p,data)
    print('Central viewer standards updated; no private records copied.')

def install(root: Path, vendor: Path):
    archive=root/'archive'
    if not archive.is_dir(): raise RuntimeError('archive/ not found; refusing unrelated writes')
    bundle=archive/'_viewer';bundle.mkdir(exist_ok=True)
    shutil.copy2(BASE/'viewer.js',bundle/'viewer.js')
    dest=bundle/'vendor';dest.mkdir(exist_ok=True)
    modules=vendor/'node_modules'
    pairs=[('jszip/dist/jszip.min.js','jszip.min.js'),('docx-preview/dist/docx-preview.min.js','docx-preview.min.js'),('dompurify/dist/purify.min.js','purify.min.js'),('marked/lib/marked.umd.js','marked.umd.js'),('pdfjs-dist/legacy/build/pdf.mjs','pdf.mjs'),('pdfjs-dist/legacy/build/pdf.worker.mjs','pdf.worker.mjs')]
    for src,name in pairs:
        source=modules/src
        if not source.is_file(): raise RuntimeError('Missing reviewed dependency: '+src)
        shutil.copy2(source,dest/name)
    for name in ['standard_fonts','cmaps','wasm']:
        source=modules/'pdfjs-dist'/name
        if source.exists(): shutil.copytree(source,dest/name,dirs_exist_ok=True)
    source=vendor/'xlsx.full.min.js'
    if not source.is_file(): raise RuntimeError('SheetJS vendored script missing')
    shutil.copy2(source,dest/'xlsx.full.min.js')
    licenses=[]
    for name in ['jszip','docx-preview','dompurify','marked','pdfjs-dist']:
        pkg=json.loads((modules/name/'package.json').read_text())
        licenses.append({'package':name,'version':pkg['version'],'license':pkg.get('license')})
        for file in (modules/name).glob('LICENSE*'):
            if file.is_file(): shutil.copy2(file,dest/(name+'-'+file.name))
    licenses.append({'package':'xlsx','version':'0.20.3','license':'Apache-2.0','source':'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'})
    write_json(bundle/'vendor-manifest.json',{'libraries':licenses,'files':[{'path':p.relative_to(dest).as_posix(),'size':p.stat().st_size,'sha256':sha(p)} for p in sorted(dest.rglob('*')) if p.is_file()]})
    if (vendor/'package-lock.json').exists():shutil.copy2(vendor/'package-lock.json',bundle/'dependency-lock.json')
    result=[]
    exclude={'index.html','viewer.html','viewer-manifest.json','archive-manifest.json','.DS_Store','Thumbs.db'}
    for record in sorted(archive.iterdir()):
        if not record.is_dir() or record.name.startswith(('_','.')) or not (record/'index.html').is_file():continue
        index=record/'index.html'; text=index.read_text(encoding='utf-8')
        raw=[p for p in sorted(record.rglob('*')) if p.is_file() and not p.is_symlink() and p.name not in exclude and not p.name.endswith('.md.html') and not any(x.startswith(('_','.')) for x in p.relative_to(record).parts)]
        # Keep a sole original entry HTML before decorating its generated entrypoint.
        if 'archive-renderer' not in text and '<!-- archive-viewer:start -->' not in text and not any(p.suffix.lower() in {'.html','.htm'} and p.read_bytes()==index.read_bytes() for p in raw):
            saved=record/'sources'/'original-index.html';saved.parent.mkdir(exist_ok=True)
            if not saved.exists():shutil.copy2(index,saved)
            raw.append(saved)
        hashes={p:sha(p) for p in raw}
        items=[]
        for p in raw:
            rel=p.relative_to(record).as_posix()
            item={'name':p.name,'path':rel,'url':quote(rel,safe='/'),'size':p.stat().st_size,'sha256':hashes[p]}
            if p.suffix.lower() in {'.heic','.heif','.tif','.tiff','.psd'}:
                try:
                    from PIL import Image, ImageOps
                    import pillow_heif
                    pillow_heif.register_heif_opener()
                    target=record/'_previews'/(hashes[p][:16]+'.png');target.parent.mkdir(exist_ok=True)
                    with Image.open(p) as image:
                        image.seek(0);image=ImageOps.exif_transpose(image);image.thumbnail((2400,2400));image.convert('RGB').save(target)
                    item['preview']=quote(target.relative_to(record).as_posix(),safe='/');item['previewNote']='generated-first-frame'
                except Exception as exc:item['previewStatus']='unsupported-or-conversion-failed'
            items.append(item)
        write_json(record/'viewer-manifest.json',{'schemaVersion':1,'viewerVersion':VERSION,'slug':record.name,'files':items})
        inject='\n<!-- archive-viewer:start -->\n<script defer data-av-manifest="viewer-manifest.json" src="../_viewer/viewer.js?v='+VERSION+'"></script>\n<!-- archive-viewer:end -->\n'
        clean=re.sub(r'\n?<!-- archive-viewer:start -->.*?<!-- archive-viewer:end -->\n?', '', text, flags=re.S)
        index.write_text(re.sub(r'</body>',lambda m:inject+'</body>',clean,count=1,flags=re.I) if re.search(r'</body>',clean,re.I) else clean+inject,encoding='utf-8')
        titlematch=re.search(r'<title>(.*?)</title>',clean,re.S|re.I);title=html.unescape(titlematch.group(1)) if titlematch else record.name
        viewer='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive"><title>'+html.escape(title)+' · 첨부 뷰어</title><style>body{margin:0;font-family:system-ui;color:#243145}main{max-width:1100px;margin:auto;padding:20px 12px}h1{font-size:24px}a{color:#245a91}</style></head><body><main><nav><a href="./">← 기록 본문</a></nav><h1>'+html.escape(title)+'</h1><div data-archive-viewer-mount></div><noscript><ul>'+''.join('<li><a href="'+x['url']+'">'+html.escape(x['name'])+'</a></li>' for x in items)+'</ul></noscript></main>'+inject+'</body></html>'
        (record/'viewer.html').write_text(viewer,encoding='utf-8')
        manifest=record/'archive-manifest.json'
        if manifest.exists():
            data=json.loads(manifest.read_text(encoding='utf-8'));data['viewer']={'version':VERSION,'manifest':'viewer-manifest.json','entry':'viewer.html','originalsVerified':True};data['entrySha256']=sha(index);write_json(manifest,data)
        assert all(sha(p)==value for p,value in hashes.items()),'Original file was changed'
        result.append({'slug':record.name,'originalFiles':len(items),'sourceHashesVerified':True})
    manifest=root/'archive-manifest.json'
    if manifest.exists():
        data=json.loads(manifest.read_text(encoding='utf-8'));data['viewerVersion']=VERSION
        for row in data.get('records',[]):
            if any(x['slug']==row.get('slug') for x in result):row['viewerPath']=row.get('path','archive/'+row['slug'])+'/viewer.html'
        write_json(manifest,data)
    home=root/'index.html'
    if home.exists():
        text=home.read_text(encoding='utf-8');text=re.sub(r'<!-- archive-viewer-links:start -->.*?<!-- archive-viewer-links:end -->','',text,flags=re.S)
        links='<!-- archive-viewer-links:start --><section style="margin-top:18px;font-size:14px"><h2 style="font-size:18px">첨부 뷰어</h2>'+''.join('<p><a href="archive/'+x['slug']+'/viewer.html">'+html.escape(x['slug'])+' · 원본 '+str(x['originalFiles'])+'개 보기</a></p>' for x in result)+'</section><!-- archive-viewer-links:end -->'
        home.write_text(text.replace('</main>',links+'</main>'),encoding='utf-8')
    write_json(bundle/'installation-report.json',{'viewerVersion':VERSION,'records':result,'inboxDeleted':False,'authChanged':False,'deploymentStructureChanged':False})
    print(json.dumps({'viewerVersion':VERSION,'records':result,'authChanged':False},ensure_ascii=False))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path.cwd());p.add_argument('--vendor',type=Path);p.add_argument('--policy',action='store_true');args=p.parse_args()
    if args.policy:policy(args.root)
    else:
        if not args.vendor:p.error('--vendor is required')
        install(args.root,args.vendor)
