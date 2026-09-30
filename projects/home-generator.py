#!/usr/bin/env python3
"""Apply the shared authored-date/title policy to the preserved home generator."""
from __future__ import annotations
import json
import runpy
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSION = '20260930-authored-chat-titles-v4'

def build():
    # Validate the metadata and compute all labels before the generator writes files.
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
    # Keep the original generator intact; change only the rows used for TOC labels.
    legacy = runpy.run_path(str(ROOT / 'home-generator-core.py'))
    scope = legacy['build'].__globals__
    original_section = scope['section']

    def chats(project):
        rows = prepared[project['repo']]
        return rows['public'], rows['private']

    def section(title, rows, private=False):
        labelled = [dict(row, label=row['displayTitle']) for row in rows]
        return original_section(title, labelled, private)

    scope['ROOT'] = Path('projects')
    scope['VERSION'] = VERSION
    scope['chats'] = chats
    scope['section'] = section
    legacy['build']()
    report_path = ROOT / 'home-build.json'
    report = json.loads(report_path.read_text(encoding='utf-8'))
    report['chatTitlePolicy'] = 'authored date + user title (preferred) or original chat title'
    report['unknownAuthoredDatesAreNotGuessed'] = True
    report['files'] = list(dict.fromkeys(report['files'] + [
        'projects/chat-metadata.json', 'projects/project-home.js',
        'projects/project-home.css', 'projects/home-generator.py',
        'projects/home-generator-core.py', 'projects/CHAT-TITLE-POLICY.md',
    ]))
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

if __name__ == '__main__':
    build()
