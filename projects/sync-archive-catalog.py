#!/usr/bin/env python3
"""Install narrow live-list hooks and refresh only configured public archive snapshots."""
from __future__ import annotations
import json
import re
import subprocess
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = '20261007-private-live-read-v18'

class ArchiveDataParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.capture = False
        self.parts = []
        self.found = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('id') == 'archive-data' and attrs.get('type') == 'application/json':
            self.capture = True
            self.found += 1

    def handle_endtag(self, tag):
        if tag == 'script':
            self.capture = False

    def handle_data(self, data):
        if self.capture:
            self.parts.append(data)


def patch_runtime():
    path = ROOT / 'project-home.js'
    source = path.read_text(encoding='utf-8')
    source, version_count = re.subn(r"const VERSION='[^']+';", f"const VERSION='{VERSION}';", source, count=1)
    if version_count != 1:
        raise RuntimeError(f'Expected one runtime VERSION declaration, found {version_count}')
    replacements = [
        ("function authoredDate(row){", "function authoredDate(row){if(row.dateSource==='archive-canonical')return dateOnly(row.date);"),
        ("function display(row){const date=authoredDate(row);", "function display(row){const date=authoredDate(row);if(row.dateSource==='archive-canonical'){const title=text(row.title)||text(row.label)||'기록';return {...row,displayDate:date,displayName:title,displayTitle:title,titleSource:'archive-canonical'}}"),
        ("return display({...metadata?.entries?.[key],...row,...p.chatMetadata?.[key]})", "return row.dateSource==='archive-canonical'?display(row):display({...metadata?.entries?.[key],...row,...p.chatMetadata?.[key]})"),
        ("const known=p.repo==='hwagok-farm'&&visibility==='public'?FARM[slug]:null;", "const known=p.repo==='hwagok-farm'&&visibility==='public'&&x.dateSource!=='archive-canonical'?FARM[slug]:null;"),
        ("${x.directory?dateHTML(x):''}", "${(x.directory||x.dateSource==='archive-canonical')?dateHTML(x):''}"),
        ("+button(dirUrl,x.recordDir,'repo-link record-dir-link')", "+'<span class=\"repo-separator\" aria-hidden=\"true\"> › </span>'+button(dirUrl,x.recordDir,'repo-link record-dir-link')"),
        ("if(x.directory)return `공개 ${x.publicCount} · 비공개 ${x.privateCount}`;", "if(x.directory)return `공개 ${x.publicCount===null?'확인 실패':x.publicCount} · 비공개 ${x.privateCount}`;"),
        ("count:r.public.length+r.private.length,publicCount:r.public.length,", "count:project.archiveSync?.status==='error'?null:r.public.length+r.private.length,publicCount:project.archiveSync?.status==='error'?null:r.public.length,"),
        ("mount(p?registered:visible,p,metadata);", "const archiveTargets=p?[p]:visible;if(archiveTargets.some(x=>x.publicIndexSource||x.repo==='hwagok-farm')){if(!window.SoftmArchiveSync)throw new Error('공개 목록 동기화 모듈을 불러오지 못했습니다.');await window.SoftmArchiveSync.syncProjects(archiveTargets)}mount(p?registered:visible,p,metadata);const syncFailures=archiveTargets.filter(x=>x.archiveSync?.status==='error');if(syncFailures.length)area.insertAdjacentHTML('afterbegin',syncFailures.map(x=>'<p class=\"empty\" role=\"alert\">'+esc(x.title+' · '+x.archiveSync.message)+' '+button(x.publicUrl,'공개 원본 홈 확인')+'</p>').join(''));"),
        ("최신순 (작성일)", "최신순 (기록일)"),
        ("오래된순 (작성일)", "오래된순 (기록일)"),
        ("날짜는 채팅 작성일 기준이며, 작성일 미확인 항목은 날짜 정렬의 뒤에 둡니다.", "ZIP 아카이브 날짜·제목은 배포된 원본의 canonical 메타데이터를 그대로 사용합니다. 그 외 기록은 확인된 채팅 작성일을 사용하며, 날짜 미확인 항목은 날짜 정렬의 뒤에 둡니다."),
    ]
    for old, new in replacements:
        if new in source:
            continue
        count = source.count(old)
        if count != 1:
            raise RuntimeError(f'Runtime hook changed; refusing an unsafe edit ({count} matches): {old[:90]}')
        source = source.replace(old, new, 1)
    path.write_text(source, encoding='utf-8')
    subprocess.run(['node', '--check', str(path)], check=True, timeout=30)


def sync_catalog():
    path = ROOT / 'projects.json'
    catalog = json.loads(path.read_text(encoding='utf-8'))
    for project in catalog['projects']:
        # Explicitly migrate the project from the user's reported synchronization issue.
        if project['repo'] == 'hwagok-farm' and not project.get('publicIndexSource'):
            project['publicIndexSource'] = {'url': project['publicUrl'], 'format': 'html-archive-data'}
        source = project.get('publicIndexSource')
        if not source:
            continue
        url = source['url']
        parsed = urllib.parse.urlsplit(url)
        if source.get('format') != 'html-archive-data' or parsed.scheme != 'https' or parsed.netloc != 'softm.github.io' or parsed.username or parsed.password or parsed.path.startswith('/projects/') or url != project['publicUrl']:
            raise ValueError('Refusing a private, external or unexpected archive source')
        request_url = url + ('&' if parsed.query else '?') + 'archive-sync=' + str(time.time_ns())
        req = urllib.request.Request(request_url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'SOFTM-Archive-Catalog/1.0'})
        with urllib.request.urlopen(req, timeout=25) as response:
            if response.geturl() != request_url or 'text/html' not in response.headers.get('Content-Type', ''):
                raise ValueError('Unexpected archive redirect or content type')
            raw = response.read(2_500_001)
        if len(raw) > 2_500_000:
            raise ValueError('Archive index exceeds size limit')
        parser = ArchiveDataParser()
        parser.feed(raw.decode('utf-8'))
        if parser.found != 1:
            raise ValueError('Expected exactly one archive-data block')
        archive = json.loads(''.join(parser.parts))
        code = "const fs=require('node:fs');const a=require(process.argv[1]);const x=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(a.archiveRows(x.archive,x.project)));"
        checked = subprocess.run(['node', '-e', code, str(ROOT / 'archive-sync.js')], input=json.dumps({'archive': archive, 'project': project}, ensure_ascii=False), text=True, encoding='utf-8', capture_output=True, check=True, timeout=30)
        links = json.loads(checked.stdout)
        project['links'] = links + [x for x in project.get('links', []) if x.get('visibility') == 'private']
        project['homePublicListCount'] = project['pageCount'] = len(links)
        project['homePrivateListCount'] = sum(x.get('visibility') == 'private' for x in project['links'])
        project['publicIndexSnapshot'] = {'source': url, 'recordCount': len(links), 'purpose': 'build snapshot; browsers refresh from the deployed source on every page load'}
        project['mediaStatus'] = '공개 홈의 canonical 목록을 동기화했습니다. 첨부 수와 재생 가능 여부는 별도 점검 대상입니다.'
        project['deploymentNote'] = '실제 콘텐츠는 프로젝트 저장소에 보존하고 중앙 목록은 배포된 HTML의 archive-data를 직접 조회합니다.'
    catalog['homeVersion'] = VERSION
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    patch_runtime()
    for test in ['archive-sync.test.cjs', 'project-home.test.cjs', 'test-title-parity.cjs']:
        subprocess.run(['node', str(ROOT / test)], check=True, timeout=30)
    sync_catalog()

if __name__ == '__main__':
    main()
