#!/usr/bin/env python3
"""Publish browser views while preserving the existing generator and title policy."""
from __future__ import annotations
import html
import json
import re
import runpy
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = '20260930-project-browser-icons-v6'

def frame(title: str, canonical: str, project: str = '') -> str:
    e = lambda value: html.escape(str(value), quote=True)
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="description" content="{e(title)} 기록 검색 · 카드·목록·표·갤러리 보기와 날짜·제목·자료 수 정렬"><link rel="canonical" href="{e(canonical)}"><title>{e(title)} · SOFTM</title><link rel="stylesheet" href="/projects/project-home.css?v={VERSION}"><link rel="stylesheet" href="/projects/view-controls.css?v={VERSION}"><script src="/projects/project-home.js?v={VERSION}" defer></script><script src="/projects/view-controls.js?v={VERSION}" defer></script></head><body data-home-version="{VERSION}" data-project="{e(project)}"><header class="hero"><div class="wrap"><a id="back" href="/projects/" hidden>← 전체 프로젝트</a><p class="eyebrow">SOFTM / PROJECTS</p><h1 id="title">{e(title)}</h1><p id="lead">기록과 자료를 찾아보세요.</p></div></header><main id="app" class="wrap"><p>목록을 읽는 중입니다.</p></main><noscript><p class="wrap">목록을 표시하려면 JavaScript가 필요합니다. <a href="https://github.com/softm/softm.github.io/blob/main/projects/projects.json">등록 정보 보기</a></p></noscript><footer class="wrap"><a href="/projects/">전체 프로젝트</a> · <a href="/projects/PROJECT-HOME-POLICY.md">공개·비공개 자료 안내</a></footer></body></html>'''

def build():
    subprocess.run(['node', str(ROOT / 'view-controls.test.cjs')], check=True, timeout=30)
    catalog = json.loads((ROOT / 'projects.json').read_text(encoding='utf-8'))
    metadata = json.loads((ROOT / 'chat-metadata.json').read_text(encoding='utf-8'))
    if metadata.get('schemaVersion') != 1 or not isinstance(metadata.get('entries'), dict):
        raise ValueError('Invalid chat writing-date/title metadata')
    javascript = """const fs=require('node:fs');
const policy=require(process.argv[1]);
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const out={};
for(const p of input.projects)out[p.repo]=policy.lists(p,input.metadata);
process.stdout.write(JSON.stringify(out));"""
    result = subprocess.run(
        ['node', '-e', javascript, str(ROOT / 'project-home.js')],
        input=json.dumps({'projects': catalog['projects'], 'metadata': metadata}, ensure_ascii=False),
        text=True, encoding='utf-8', capture_output=True, check=True, timeout=30,
    )
    prepared = json.loads(result.stdout)
    legacy = runpy.run_path(str(ROOT / 'home-generator-core.py'))
    scope = legacy['build'].__globals__
    original_section = scope['section']

    def chats(project):
        rows = prepared[project['repo']]
        return rows['public'], rows['private']

    def section(title, rows, private=False):
        return original_section(title, [dict(row, label=row['displayTitle']) for row in rows], private)

    scope['ROOT'] = Path('projects')
    scope['VERSION'] = VERSION
    scope['chats'] = chats
    scope['section'] = section
    legacy['build']()
    # Replace only generated TOC shells, never the underlying records or media.
    homes = []
    for project in catalog['projects']:
        repo = project['repo']
        slug = {'baksok-public': 'baksok', 'mine-private': 'mine'}.get(repo, repo.removesuffix('-private'))
        if not re.fullmatch(r'[a-zA-Z0-9_-]+', slug):
            raise ValueError('Invalid project slug')
        target = ROOT / slug / 'index.html'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(frame(project['title'], 'https://softm.github.io/projects/' + slug + '/', repo), encoding='utf-8')
        homes.append('projects/' + slug + '/index.html')
    (ROOT / 'index.html').write_text(frame('전체 프로젝트', 'https://softm.github.io/projects/'), encoding='utf-8')
    report_path = ROOT / 'home-build.json'
    report = json.loads(report_path.read_text(encoding='utf-8'))
    report['version'] = VERSION
    report['chatTitlePolicy'] = 'authored date + user title (preferred) or original chat title'
    report['unknownAuthoredDatesAreNotGuessed'] = True
    report['features'] = {'views': ['cards', 'list', 'table', 'gallery'],
                          'viewControls': 'icon-only with accessible names and hover titles',
                          'sorts': ['newest', 'oldest', 'title-asc', 'title-desc', 'count-desc'],
                          'privateContentFetched': False}
    report['files'] = list(dict.fromkeys(report['files'] + homes + [
        'projects/index.html', 'projects/chat-metadata.json', 'projects/project-home.js',
        'projects/project-home.css', 'projects/home-generator.py',
        'projects/home-generator-core.py', 'projects/CHAT-TITLE-POLICY.md',
        'projects/view-controls.js', 'projects/view-controls.css', 'projects/view-controls.test.cjs',
    ]))
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

if __name__ == '__main__':
    build()
