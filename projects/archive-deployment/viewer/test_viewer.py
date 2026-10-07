#!/usr/bin/env python3
"""Run against localhost only. Print types/counts, never private document contents."""
import asyncio, base64, contextlib, functools, hashlib, http.server, json, math, os, shutil, socketserver, struct, subprocess, tempfile, threading, wave, zipfile
from pathlib import Path
from urllib.parse import quote
from playwright.async_api import async_playwright

ROOT=Path.cwd(); ARCHIVE=ROOT/'archive'
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

async def run():
    handler=functools.partial(Quiet,directory=str(ROOT))
    server=socketserver.ThreadingTCPServer(('127.0.0.1',0),handler); server.daemon_threads=True
    threading.Thread(target=server.serve_forever,daemon=True).start()
    origin=f'http://127.0.0.1:{server.server_address[1]}'
    results=[]; failures=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,args=['--autoplay-policy=no-user-gesture-required'])
        page=await browser.new_page(viewport={'width':1280,'height':900}); page.set_default_timeout(12000)
        external=[]
        async def guard(route):
            if not route.request.url.startswith((origin,'blob:','data:')):
                external.append(route.request.url.split('?')[0]);await route.abort()
            else:await route.continue_()
        await page.route('**/*',guard)
        for mf in sorted(ARCHIVE.glob('*/viewer-manifest.json')):
            data=json.loads(mf.read_text()); slug=mf.parent.name
            for f in data['files']:
                raw=mf.parent/f['path'];assert raw.is_file()
                assert hashlib.sha256(raw.read_bytes()).hexdigest()==f['sha256'], 'source changed'
            await page.goto(origin+'/archive/'+quote(slug)+'/viewer.html')
            await page.wait_for_function('!!window.SoftmArchiveViewer',timeout=20000)
            known=await page.evaluate('SoftmArchiveViewer.getFiles()')
            assert len(known)==len(data['files'])
            for i,file in enumerate(known):
                kind=file['kind']; print(json.dumps({'testing':slug,'index':i,'kind':kind}),flush=True)
                try:
                    await page.evaluate('(i)=>SoftmArchiveViewer.open(i)',i)
                    await page.wait_for_function("!document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('.status').textContent.includes('읽는 중')",timeout=30000)
                    root=page.locator('[data-archive-viewer]')
                    if kind=='image':
                        await page.wait_for_function("(()=>{const i=document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('.stage img');return i&&i.naturalWidth>0})()")
                        await root.get_by_role('button',name='회전',exact=True).click()
                    elif kind=='pdf':
                        await page.wait_for_function("(()=>{const c=document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('canvas');return c&&c.width>0&&c.height>0})()",timeout=30000)
                        await root.get_by_role('button',name='회전',exact=True).click()
                    elif kind=='word':
                        await page.wait_for_function("(()=>{const f=document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('.stage iframe');return f?.contentDocument?.getElementById('doc')?.textContent.trim().length>10})()",timeout=30000)
                    elif kind in ['markdown','html']:
                        await page.wait_for_function("(()=>{const f=document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('.stage iframe');return f?.contentDocument?.body?.textContent.trim().length>10})()",timeout=30000)
                    elif kind=='zip':
                        assert await root.locator('.stage .list-row').count()>0
                    assert await root.locator('.stage .error').count()==0, 'viewer error'
                    await root.get_by_role('button',name='닫기',exact=True).click()
                    response=await page.request.get(origin+'/archive/'+quote(slug)+'/'+data['files'][i]['url'])
                    assert response.ok,'source link failed'
                    results.append({'record':slug,'kind':kind,'ok':True})
                except Exception as e:
                    diag=await page.evaluate("(()=>{const s=document.querySelector('[data-archive-viewer]')?.shadowRoot;return {error:s?.querySelector('.stage .error')?.textContent,status:s?.querySelector('.status')?.textContent,iframe:!!s?.querySelector('.stage iframe'),open:s?.querySelector('dialog')?.open}})()")
                    print(json.dumps({'failed':slug,'index':i,'kind':kind,'errorType':type(e).__name__,'diagnostic':diag},ensure_ascii=False),flush=True)
                    failures.append({'record':slug,'kind':kind,'error':type(e).__name__,'diagnostic':diag})
                    await page.goto(origin+'/archive/'+quote(slug)+'/viewer.html')
                    await page.wait_for_function('!!window.SoftmArchiveViewer')
            await page.set_viewport_size({'width':390,'height':844})
            assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'),'mobile body overflow'
            await page.evaluate('SoftmArchiveViewer.open(0)')
            assert await page.evaluate("(()=>{const r=document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('dialog').getBoundingClientRect();return r.width<=innerWidth+2&&r.height<=innerHeight+2})()"),'mobile dialog overflow'
            await page.keyboard.press('Escape');await page.set_viewport_size({'width':1280,'height':900})
        # Disposable format fixtures are not committed to the archive.
        fixture=ROOT/'.viewer-test-fixtures';fixture.mkdir(exist_ok=True)
        try:
            (fixture/'sample.txt').write_text('Text viewer\n  spaces preserved\n한글 녹취',encoding='utf-8')
            (fixture/'sample.json').write_text('{"hello":"world"}',encoding='utf-8')
            (fixture/'sample.csv').write_text('name,value\n"a,b",12\n한글,34',encoding='utf-8')
            (fixture/'sample.md').write_text('# Markdown\n\n|A|B|\n|-|-|\n|1|2|\n\n> Quote\n\n<script>parent.__av_xss=1</script>\n<img src="https://example.invalid/private" onerror="parent.__av_xss=1">',encoding='utf-8')
            (fixture/'sample.html').write_text('<h1>Safe HTML preview</h1><script>parent.__av_xss=1</script><img src="https://example.invalid/private" onerror="parent.__av_xss=1">',encoding='utf-8')
            with zipfile.ZipFile(fixture/'sample.pptx','w') as z:z.writestr('ppt/slides/slide1.xml','<p:sld xmlns:p="p" xmlns:a="a"><a:p><a:r><a:t>Test slide</a:t></a:r></a:p></p:sld>')
            with zipfile.ZipFile(fixture/'sample.hwpx','w') as z:z.writestr('Contents/section0.xml','<s:sec xmlns:s="s" xmlns:h="h"><h:p><h:run><h:t>Test HWPX</h:t></h:run></h:p></s:sec>')
            with wave.open(str(fixture/'sample.wav'),'wb') as w:
                w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000);w.writeframes(b''.join(struct.pack('<h',int(3000*math.sin(2*math.pi*440*n/16000))) for n in range(16000)))
            if shutil.which('ffmpeg'):
                subprocess.run(['ffmpeg','-y','-f','lavfi','-i','color=c=black:s=160x90:r=10','-t','1','-c:v','libvpx','-an',str(fixture/'sample.webm')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
            (fixture/'unsupported.hwp').write_bytes(b'unsupported format test')
            raw=[x for x in sorted(fixture.iterdir()) if x.is_file()]
            entries=[{'name':x.name,'url':quote(x.name),'size':x.stat().st_size} for x in raw]
            (fixture/'viewer-manifest.json').write_text(json.dumps({'files':entries}),encoding='utf-8')
            (fixture/'index.html').write_text('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><main></main><script defer data-av-manifest="viewer-manifest.json" src="../archive/_viewer/viewer.js"></script>',encoding='utf-8')
            await page.goto(origin+'/.viewer-test-fixtures/')
            await page.wait_for_function('!!window.SoftmArchiveViewer')
            for i,f in enumerate(entries):
                print(json.dumps({'fixture':f['name']}),flush=True)
                await page.evaluate('(i)=>SoftmArchiveViewer.open(i)',i)
                if f['name'].endswith(('.wav','.webm')):
                    await page.wait_for_function("(()=>{const m=document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('audio,video');return m&&m.readyState>=2})()",timeout=15000)
                    await page.evaluate("document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('audio,video').play()")
                    await page.wait_for_function("document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('audio,video').currentTime>0")
                if f['name'].endswith(('.md','.html')):
                    print(await page.evaluate("(()=>{const s=document.querySelector('[data-archive-viewer]').shadowRoot;return {error:s.querySelector('.stage .error')?.textContent,status:s.querySelector('.status').textContent,iframe:!!s.querySelector('.stage iframe')}})()"),flush=True)
                    await page.wait_for_function("!!document.querySelector('[data-archive-viewer]').shadowRoot.querySelector('.stage iframe')")
                    assert not await page.evaluate('Boolean(window.__av_xss)')
                if f['name'].endswith('.csv'):assert await page.locator('[data-archive-viewer] .stage table').count()==1
                await page.locator('[data-archive-viewer]').get_by_role('button',name='닫기',exact=True).click()
                results.append({'fixture':f['name'].split('.')[-1],'ok':True})
        finally:shutil.rmtree(fixture,ignore_errors=True)
        # The original pages remain readable and carry the same viewer panel.
        for mf in sorted(ARCHIVE.glob('*/viewer-manifest.json')):
            await page.goto(origin+'/archive/'+quote(mf.parent.name)+'/')
            await page.wait_for_function('!!window.SoftmArchiveViewer')
            assert await page.locator('h1').count()>0
        assert not external, 'Viewer attempted external requests'
        await browser.close()
    server.shutdown()
    report={'tests':results,'failures':failures,'externalRequests':len(external),'originalHashesVerified':True}
    (ARCHIVE/'_viewer'/'browser-test-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':len(results),'failed':len(failures),'externalRequests':len(external),'failures':failures},ensure_ascii=False))
    if failures:raise SystemExit(1)

if __name__=='__main__':asyncio.run(run())
