#!/usr/bin/env python3
"""Verify the deployed public project browser; never fetch a private origin."""
import concurrent.futures
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
BASE = 'https://softm.github.io/projects/'
VERSION = re.search(r"const VERSION='([^']+)'", (ROOT/'project-home.js').read_text()).group(1)

def fetch(relative):
    url = BASE + relative + ('&' if '?' in relative else '?') + 'title-parity=' + str(time.time_ns())
    request = Request(url, headers={'User-Agent':'SOFTM-Title-Parity-Check', 'Cache-Control':'no-cache'})
    with urlopen(request, timeout=15) as response:
        if response.status != 200 or urlsplit(response.geturl()).netloc != 'softm.github.io':
            raise RuntimeError('Unexpected public response')
        body = response.read(2000001)
        if len(body) > 2000000:
            raise RuntimeError('Response too large')
        return body.decode('utf-8')

errors = []
started = time.monotonic()
for attempt in range(16):
    try:
        js = fetch('project-home.js')
        if "const VERSION='" + VERSION + "'" not in js or 'title:shown.displayTitle,date:' not in js:
            raise RuntimeError('Public JavaScript is not yet at the expected canonical-title version')
        catalog_text = fetch('projects.json')
        metadata_text = fetch('chat-metadata.json')
        projects = json.loads(catalog_text)['projects']
        homes = ['']
        for project in projects:
            slug = {'baksok-public':'baksok','mine-private':'mine'}.get(project['repo'], project['repo'].removesuffix('-private'))
            if not re.fullmatch(r'[a-zA-Z0-9_-]+', slug):
                raise RuntimeError('Unexpected project path')
            homes.append(slug + '/')
        def probe(home):
            html = fetch(home)
            return {'url':BASE+home, 'http':200, 'versionMatched':('project-home.js?v='+VERSION) in html}
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(probe, homes))
        stale = [r['url'] for r in results if not r['versionMatched']]
        if stale:
            raise RuntimeError('Entry pages not updated: ' + ', '.join(stale))
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            (work/'project-home.js').write_text(js)
            (work/'projects.json').write_text(catalog_text)
            (work/'chat-metadata.json').write_text(metadata_text)
            shutil.copyfile(ROOT/'test-title-parity.cjs', work/'test-title-parity.cjs')
            env = dict(os.environ, TITLE_PARITY_REPORT=str(work/'result.json'))
            checked = subprocess.run(['node',str(work/'test-title-parity.cjs')], env=env, capture_output=True, text=True, timeout=30, check=True)
            print(checked.stdout)
            comparisons = json.loads((work/'result.json').read_text())
        report = {'version':VERSION, 'publicDeploymentVerified':True, 'entryPages':results,
                  'deployedRendererChecks':comparisons, 'privateOriginsFetched':False,
                  'elapsedSeconds':round(time.monotonic()-started,1)}
        Path(os.environ.get('TITLE_PARITY_LIVE_REPORT','title-parity-live.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print('TITLE_PARITY_LIVE_PASS '+json.dumps({'version':VERSION,'entryPages':len(results),'projects':len(projects),'rows':comparisons['rows'],'renderedTitles':comparisons['renderedTitles'],'privateOriginsFetched':False}))
        break
    except Exception as error:
        errors.append(str(error))
        print('PUBLICATION_CHECK '+str(attempt+1)+': '+str(error),flush=True)
        if attempt == 15 or time.monotonic()-started > 300:
            raise SystemExit('Production title parity was not verified: '+errors[-1])
        time.sleep(15)
