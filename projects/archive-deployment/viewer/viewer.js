/* SOFTM Archive Viewer v1.0.0 — original files stay in the current authenticated origin. */
(() => {
  'use strict';
  const script = document.currentScript;
  if (!script || window.__softmArchiveViewer) return;
  window.__softmArchiveViewer = true;
  const assetBase = new URL('.', script.src);
  const recordBase = new URL('.', document.baseURI);
  const VERSION = '1.0.0';
  const types = {
    image: 'jpg jpeg png webp gif avif svg bmp ico heic heif tif tiff',
    video: 'mp4 webm mov m4v ogv mkv avi mpg mpeg 3gp',
    audio: 'mp3 m4a wav wave ogg oga opus flac aac aif aiff wma',
    pdf: 'pdf', word: 'docx', sheet: 'xlsx xls xlsb ods csv tsv',
    package: 'pptx odt odp hwpx epub', zip: 'zip',
    markdown: 'md markdown', html: 'html htm',
    text: 'txt log json jsonl ndjson xml yaml yml ini cfg conf toml srt vtt ass ssa js mjs cjs ts tsx jsx css scss py sh sql java kt c cpp h rs go rb php bat ps1 dockerfile gitignore',
  };
  const classify = name => Object.entries(types).find(([, exts]) => exts.split(' ').includes(name.split('.').pop().toLowerCase()))?.[0] || 'download';
  const labels = {image:'이미지',video:'동영상',audio:'음성',pdf:'PDF',word:'문서',sheet:'표·스프레드시트',package:'구조 미리보기',zip:'압축목록',markdown:'Markdown',html:'HTML',text:'텍스트',download:'원본 파일'};
  const el = (tag, text, attrs={}) => { const n=document.createElement(tag); if(text!==null) n.textContent=text; for(const [k,v] of Object.entries(attrs)) n.setAttribute(k,v); return n; };
  const button=(text,fn)=>{const b=el('button',text,{type:'button'});b.addEventListener('click',fn);return b;};
  const sizeLabel=n=> n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(1)} MB`;
  const safeURL=(path)=>{
    const u=new URL(path,recordBase);
    if(u.origin!==location.origin || !u.pathname.startsWith(recordBase.pathname) || u.username || u.password || u.search || u.hash) throw Error('안전하지 않은 자료 경로입니다.');
    return u;
  };
  const deps={};
  function dependency(name) {
    if(deps[name]) return deps[name];
    deps[name]=new Promise((resolve,reject)=>{
      const s=el('script',null,{src:new URL(`vendor/${name}`,assetBase).href});
      s.onload=resolve; s.onerror=()=>reject(Error('문서 뷰어 모듈을 불러오지 못했습니다. 원본 열기를 이용해 주세요.'));
      document.head.append(s);
    });
    return deps[name];
  }
  const host=el('section',null,{'data-archive-viewer':VERSION});
  const shadow=host.attachShadow({mode:'open'});
  const css=`:host{display:block;font:15px/1.6 system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;color:#243145;margin:24px auto;max-width:1100px;padding:0 16px}*{box-sizing:border-box}h2{font-size:20px;margin:12px 0}p{margin:8px 0}button,select,input{font:inherit}button,a.link{cursor:pointer;border:1px solid #cbd5e1;background:#fff;color:#1d4a75;border-radius:7px;padding:6px 11px;min-height:36px;text-decoration:none}button:hover,a.link:hover{background:#edf3fa}button:focus-visible,a:focus-visible{outline:3px solid #397ab7;outline-offset:2px}button:disabled{cursor:default;opacity:.45}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0}.muted{font-size:13px;color:#67758a}.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:9px}.card{border:1px solid #dae1e9;border-radius:10px;padding:12px;background:#fafbfd;min-width:0}.name{font-size:14px;font-weight:650;overflow-wrap:anywhere}.card img{display:block;width:100%;height:150px;object-fit:contain;cursor:zoom-in;background:#f0f3f7;margin-bottom:8px}.card .toolbar{margin-bottom:0}.banner{border-top:1px solid #dce3eb;padding-top:10px}.filter{padding:7px 10px;border:1px solid #cbd5e1;border-radius:7px;max-width:100%;width:300px}dialog{width:min(1200px,97vw);height:min(900px,96dvh);max-width:97vw;max-height:96dvh;padding:0;border:1px solid #8797aa;border-radius:12px;color:#243145;background:white}dialog::backdrop{background:rgb(12 20 35 / .72)}.dialog-layout{height:100%;display:flex;flex-direction:column;min-width:0}.dialog-head{padding:10px 14px;border-bottom:1px solid #dce3eb;flex-shrink:0}.dialog-title{font-size:15px;overflow-wrap:anywhere;font-weight:700;margin:0}.controls{padding:0 12px;flex-shrink:0}.stage{position:relative;overflow:auto;flex:1;min-height:80px;background:#f1f4f8;padding:12px;overscroll-behavior:contain}.stage img{max-width:none;display:block;margin:0 auto;touch-action:pan-x pan-y}.stage video{width:100%;max-height:70dvh;display:block;background:#111}.stage audio{width:100%;margin:30px 0}.stage iframe{width:100%;height:100%;min-height:65dvh;border:0;background:white}.stage canvas{display:block;margin:auto;background:white;box-shadow:0 1px 8px #b9c2ce;max-width:none}.stage pre{margin:0;tab-size:4;white-space:pre-wrap;overflow-wrap:anywhere;background:#fff;padding:16px;font:14px/1.65 ui-monospace,monospace;min-height:100%}.stage table{border-collapse:collapse;background:white;font-size:13px}.stage th,.stage td{padding:6px 10px;border:1px solid #dce3eb;max-width:400px;overflow-wrap:anywhere;white-space:pre-wrap}.stage .sheet-wrap{overflow:auto}.stage .error{padding:16px;background:#fff6ed;border:1px solid #ead1b0;border-radius:8px}.stage .package-section{padding:14px;background:white;margin:10px 0;border:1px solid #dce3eb}.stage .package-section img{max-width:100%;height:auto}.stage .list-row{display:flex;gap:10px;border-bottom:1px solid #dce3eb;padding:8px;overflow-wrap:anywhere;align-items:center}.stage .list-row span{flex:1}.status{font-size:13px;margin:0;color:#68778b}.source-note{padding:7px 12px;border-top:1px solid #e0e5ec;font-size:12px;color:#617188;flex-shrink:0}@media(max-width:600px){:host{padding:0 8px}.cards{grid-template-columns:1fr}dialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0}.dialog-head{padding:8px}.stage{padding:6px}.toolbar{gap:6px}button,a.link{padding:5px 8px}.dialog-title{font-size:13px}}`;
  shadow.append(el('style',css));
  const panel=el('div',null,{class:'banner'});
  panel.append(el('h2','첨부 자료 · 뷰어 / 플레이어'));
  const filter=el('input',null,{type:'search',placeholder:'파일명 또는 형식 검색',class:'filter','aria-label':'첨부파일 검색'});
  const info=el('p','자료 목록을 읽는 중입니다.',{class:'muted','aria-live':'polite'});
  const cards=el('div',null,{class:'cards'});
  panel.append(filter,info,cards);shadow.append(panel);
  const target=document.querySelector('[data-archive-viewer-mount]') || document.querySelector('main') || document.body;
  target.append(host);
  const dialog=el('dialog',null,{'aria-label':'첨부파일 뷰어'});
  const layout=el('div',null,{class:'dialog-layout'}), head=el('div',null,{class:'dialog-head'});
  const title=el('h3','',{class:'dialog-title'}), nav=el('div',null,{class:'toolbar'}), status=el('p','',{class:'status','aria-live':'polite'});
  const controls=el('div',null,{class:'controls toolbar'}), stage=el('div',null,{class:'stage'}), note=el('div','원본은 변경하지 않습니다. 뷰어에서 지원하지 않는 내용은 원본 파일로 확인하세요.',{class:'source-note'});
  head.append(title,nav,status);layout.append(head,controls,stage,note);dialog.append(layout);shadow.append(dialog);
  let files=[],selected=0,controller=null,cleanup=[],generation=0,lastFocus=null;
  function clear(){controller?.abort();controller=new AbortController();generation++;for(const f of cleanup){try{f();}catch{}}cleanup=[];stage.replaceChildren();controls.replaceChildren();status.textContent='';return generation;}
  function onClose(){clear();document.body.style.overflow=previousOverflow;lastFocus?.focus?.();}
  let previousOverflow='';dialog.addEventListener('close',onClose);
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;if(e.key==='ArrowLeft'&&files[selected]?.kind==='image'){e.preventDefault();show((selected-1+files.length)%files.length);}if(e.key==='ArrowRight'&&files[selected]?.kind==='image'){e.preventDefault();show((selected+1)%files.length);}});
  async function read(file,limit=24*1048576){
    if(file.size>limit)throw Error(`이 형식의 미리보기 한도는 ${sizeLabel(limit)}입니다. 원본 다운로드를 이용해 주세요.`);
    const r=await fetch(file.url,{credentials:'same-origin',cache:'no-store',signal:controller.signal});
    if(!r.ok)throw Error(`자료를 불러오지 못했습니다 (HTTP ${r.status}). 인증 상태와 원본 링크를 확인해 주세요.`);
    if(+r.headers.get('content-length')>limit)throw Error('미리보기 용량 한도를 초과합니다.');
    const reader=r.body.getReader();const chunks=[];let length=0;
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw Error('미리보기 용량 한도를 초과합니다.');}chunks.push(value);}
    const out=new Uint8Array(length);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;
  }
  function fail(message){stage.replaceChildren(el('p',message,{class:'error'}));status.textContent='미리보기 제한 · 원본 열기/다운로드 가능';}
  function sourceLinks(file){const original=el('a','원본 열기',{href:file.url,class:'link',target:'_blank',rel:'noopener noreferrer'});const download=el('a','다운로드',{href:file.url,class:'link',download:file.name});return [original,download];}
  async function show(index){
    selected=index;const file=files[index];if(!file)return;
    if(!dialog.open){lastFocus=shadow.activeElement||document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}
    const g=clear(); title.textContent=file.name;
    nav.replaceChildren(button('이전 파일',()=>show((selected-1+files.length)%files.length)),button('다음 파일',()=>show((selected+1)%files.length)),...sourceLinks(file),button('닫기',()=>dialog.close()));
    status.textContent=`${index+1} / ${files.length} · ${labels[file.kind]} · ${sizeLabel(file.size)} · 읽는 중`;
    try{await render(file,g);if(g===generation && !status.textContent.includes('제한'))status.textContent=`${index+1} / ${files.length} · ${labels[file.kind]} · ${sizeLabel(file.size)}`;}
    catch(e){if(g===generation && e.name!=='AbortError')fail(e.message||'미리보기에 실패했습니다. 원본을 이용해 주세요.');}
  }
  function frameHTML(body,base){
    const safe=DOMPurify.sanitize(body,{FORBID_TAGS:['script','iframe','object','embed','form','input','button','meta','base','link'],FORBID_ATTR:['srcset'],ADD_ATTR:['target']});
    const d=new DOMParser().parseFromString(safe,'text/html');
    for(const n of d.querySelectorAll('[src],[href]'))for(const a of ['src','href'])if(n.hasAttribute(a)){
      const v=n.getAttribute(a);if(v.startsWith('#'))continue;
      try{const u=new URL(v,base);if(u.origin!==location.origin){n.removeAttribute(a);continue;}n.setAttribute(a,u.href);if(a==='href'){n.setAttribute('target','_blank');n.setAttribute('rel','noopener noreferrer');}}catch{n.removeAttribute(a);}
    }
    const f=el('iframe',null,{title:'안전한 문서 미리보기',sandbox:'allow-same-origin allow-popups'});
    f.srcdoc=`<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${location.origin} data: blob:; style-src 'unsafe-inline'; font-src data: blob:; media-src ${location.origin} blob:; form-action 'none'"><style>body{font:15px/1.75 system-ui;margin:20px;color:#243145;overflow-wrap:anywhere}img,video{max-width:100%}pre{white-space:pre-wrap}table{border-collapse:collapse;max-width:100%}th,td{border:1px solid #ccd6e2;padding:7px}blockquote{border-left:3px solid #6285ac;margin:12px 0;padding:10px;background:#f0f4f8}</style>${d.body.innerHTML}`;
    stage.append(f);return f;
  }
  async function zipFrom(file){await dependency('jszip.min.js');const z=await JSZip.loadAsync(await read(file));
    const entries=Object.values(z.files);if(entries.length>1500)throw Error('압축 항목 1,500개 한도 초과. 원본을 이용해 주세요.');
    let total=0;for(const p of entries){if(p.name.includes('..')||p.name.startsWith('/')||p.name.includes('\\'))throw Error('안전하지 않은 압축 경로입니다.');const n=p._data?.uncompressedSize||0;if(n>32*1048576)throw Error('압축 내 단일 파일이 너무 큽니다.');total+=n;if(total>120*1048576)throw Error('압축 해제 용량 한도 초과.');}return z;
  }
  async function render(file,g){
    if(file.kind==='image'){
      const img=el('img',null,{src:file.preview?new URL(file.preview,recordBase).href:file.url,alt:file.name});stage.append(img);
      let zoom=1,angle=0;const fit=()=>{img.style.width=`${Math.round(Math.min(img.naturalWidth||900,stage.clientWidth-24)*zoom)}px`;img.style.height='auto';img.style.transform=`rotate(${angle}deg)`;};
      controls.append(button('−',()=>{zoom=Math.max(.2,zoom/1.25);fit();}),button('+',()=>{zoom=Math.min(6,zoom*1.25);fit();}),button('화면 맞춤',()=>{zoom=1;angle=0;fit();}),button('회전',()=>{angle=(angle+90)%360;fit();}));
      img.addEventListener('load',fit,{once:true});img.addEventListener('error',()=>{if(g===generation)fail('이 이미지 형식은 현재 브라우저에서 표시할 수 없습니다. 원본 파일을 이용해 주세요.');},{once:true});return;
    }
    if(file.kind==='audio'||file.kind==='video'){
      const media=el(file.kind,null,{src:file.url,controls:'',preload:'metadata',playsinline:''});
      controls.append(button('−10초',()=>media.currentTime=Math.max(0,media.currentTime-10)),button('+10초',()=>{if(Number.isFinite(media.duration))media.currentTime=Math.min(media.duration,media.currentTime+10);}));
      const speed=el('select',null,{'aria-label':'재생 속도'});for(const n of [.5,.75,1,1.25,1.5,2]){const o=el('option',`${n}배속`,{value:n});o.selected=n===1;speed.append(o);}speed.onchange=()=>media.playbackRate=+speed.value;controls.append(speed);
      const sub=files.find(x=>x.name.replace(/\.[^.]+$/,'')===file.name.replace(/\.[^.]+$/,'')&&x.name.endsWith('.vtt'));
      if(sub&&file.kind==='video')media.append(el('track',null,{kind:'subtitles',src:sub.url,srclang:'ko',label:'자막',default:''}));
      stage.append(media,el('p','재생되지 않으면 브라우저/코덱 지원을 확인하고 원본 파일을 이용해 주세요.',{class:'muted'}));
      media.onerror=()=>{if(g===generation)status.textContent='재생 제한 · 이 브라우저에서 지원하지 않는 코덱이거나 파일 오류입니다.';};cleanup.push(()=>{media.pause();media.removeAttribute('src');media.load();});return;
    }
    if(file.kind==='pdf'){
      let pdf;
      try{const lib=await import(new URL('vendor/pdf.mjs',assetBase));lib.GlobalWorkerOptions.workerSrc=new URL('vendor/pdf.worker.mjs',assetBase).href;
        const task=lib.getDocument({data:await read(file,60*1048576),isEvalSupported:false,standardFontDataUrl:new URL('vendor/standard_fonts/',assetBase).href,cMapUrl:new URL('vendor/cmaps/',assetBase).href,cMapPacked:true,wasmUrl:new URL('vendor/wasm/',assetBase).href});cleanup.push(()=>task.destroy());pdf=await task.promise;
      }catch(e){if(g!==generation)return;stage.append(el('iframe',null,{src:file.url,title:'브라우저 PDF 뷰어'}));controls.append(el('span','브라우저 기본 PDF 뷰어',{class:'muted'}));return;}
      if(g!==generation)return;
      let page=1,scale=1,rotation=0,running=null;const count=el('span','',{class:'muted'}),canvas=el('canvas',null,{'aria-label':'PDF 페이지'});stage.append(canvas);
      async function draw(){try{running?.cancel();const p=await pdf.getPage(page);if(g!==generation)return;const v=p.getViewport({scale:1,rotation});const zoom=Math.min(2,(stage.clientWidth-28)/v.width)*scale;const viewport=p.getViewport({scale:zoom,rotation});const dpr=Math.min(devicePixelRatio||1,2);canvas.width=viewport.width*dpr;canvas.height=viewport.height*dpr;canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';count.textContent=`${page} / ${pdf.numPages}쪽`;running=p.render({canvasContext:canvas.getContext('2d'),viewport,transform:dpr===1?null:[dpr,0,0,dpr,0,0]});await running.promise;}catch(e){if(e.name!=='RenderingCancelledException'&&g===generation)fail('PDF 페이지 렌더링에 실패했습니다. 원본 열기를 이용해 주세요.');}}
      controls.append(button('이전 쪽',()=>{page=Math.max(1,page-1);draw();}),count,button('다음 쪽',()=>{page=Math.min(pdf.numPages,page+1);draw();}),button('−',()=>{scale=Math.max(.3,scale/1.2);draw();}),button('+',()=>{scale=Math.min(4,scale*1.2);draw();}),button('회전',()=>{rotation=(rotation+90)%360;draw();}),button('화면 맞춤',()=>{scale=1;draw();}));await draw();return;
    }
    if(['text','markdown','html'].includes(file.kind)){
      const bytes=await read(file,8*1048576);if(g!==generation)return;
      await Promise.all([dependency('purify.min.js'),...(file.kind==='markdown'?[dependency('marked.umd.js')]:[])]);
      if(g!==generation)return;
      const encoding=el('select',null,{'aria-label':'텍스트 인코딩'});for(const v of ['utf-8','euc-kr','utf-16le'])encoding.append(el('option',v,{value:v}));
      let raw=false,wrap=true,text='';const output=()=>{stage.replaceChildren();text=new TextDecoder(encoding.value).decode(bytes);if(file.name.toLowerCase().endsWith('.json'))try{text=JSON.stringify(JSON.parse(text),null,2);}catch{}
        if(!raw&&file.kind==='markdown')frameHTML(marked.parse(text),file.url);
        else if(!raw&&file.kind==='html')frameHTML(text,file.url);
        else{const pre=el('pre',text);pre.style.whiteSpace=wrap?'pre-wrap':'pre';stage.append(pre);}};
      encoding.onchange=output;controls.append(encoding,button('줄바꿈',()=>{wrap=!wrap;raw=true;output();}),button('복사',async()=>{try{await navigator.clipboard.writeText(text);status.textContent='텍스트를 복사했습니다.';}catch{status.textContent='복사 권한이 없습니다. 텍스트를 선택해 복사해 주세요.';}}));
      if(file.kind!=='text')controls.append(button('본문 / 원문',()=>{raw=!raw;output();}));output();return;
    }
    if(file.kind==='word'){
      const zip=await zipFrom(file);
      for(const p of Object.values(zip.files).filter(p=>p.name.endsWith('.rels'))){let xml=await p.async('string');const d=new DOMParser().parseFromString(xml,'application/xml');for(const n of [...d.getElementsByTagNameNS('*','Relationship')])if(n.getAttribute('TargetMode')==='External')n.remove();zip.file(p.name,new XMLSerializer().serializeToString(d));}
      await dependency('docx-preview.min.js');if(g!==generation)return;
      const frame=el('iframe',null,{title:'DOCX 문서 미리보기',sandbox:'allow-same-origin'});
      frame.srcdoc=`<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data: blob:"><style>body{margin:0;overflow:auto;background:#edf1f5}.docx-wrapper{padding:8px!important}.docx-wrapper>section.docx{max-width:100%;box-sizing:border-box}table{max-width:100%}</style><div id="doc"></div>`;
      const loaded=new Promise(r=>frame.onload=r);stage.append(frame);await loaded;if(g!==generation)return;
      await docx.renderAsync(await zip.generateAsync({type:'arraybuffer'}),frame.contentDocument.getElementById('doc'),null,{inWrapper:true,ignoreWidth:true,ignoreHeight:true,renderAltChunks:false,renderComments:false,useBase64URL:true,breakPages:true});
      controls.append(el('span','DOCX 읽기용 미리보기 · 정확한 서식/서명은 원본 PDF 또는 문서로 확인',{class:'muted'}));return;
    }
    if(file.kind==='sheet'){
      await dependency('xlsx.full.min.js');const bytes=await read(file);if(g!==generation)return;
      const workbook=XLSX.read(bytes,{type:'array',cellHTML:false,cellFormula:false,sheetRows:10001});
      const select=el('select',null,{'aria-label':'시트 선택'});for(const name of workbook.SheetNames)select.append(el('option',name,{value:name}));let offset=0;const counter=el('span','',{class:'muted'});
      function draw(){stage.replaceChildren();const rows=XLSX.utils.sheet_to_json(workbook.Sheets[select.value],{header:1,raw:false,defval:''});const table=el('table',null);rows.slice(offset,offset+200).forEach((row,i)=>{const tr=el('tr',null);tr.append(el('th',String(offset+i+1)));row.slice(0,100).forEach(c=>tr.append(el('td',String(c))));table.append(tr);});stage.append(table);counter.textContent=`${offset+1}–${Math.min(offset+200,rows.length)}행 / 최대 10,000행·100열 미리보기`;}
      select.onchange=()=>{offset=0;draw();};controls.append(select,button('이전 행',()=>{offset=Math.max(0,offset-200);draw();}),button('다음 행',()=>{offset=Math.min(9800,offset+200);draw();}),counter);draw();return;
    }
    if(file.kind==='zip'||file.kind==='package'){
      const zip=await zipFrom(file);if(g!==generation)return;const entries=Object.values(zip.files).filter(p=>!p.dir);
      if(file.kind==='zip'){
        const table=el('div',null);entries.forEach(p=>{const row=el('div',null,{class:'list-row'});row.append(el('span',p.name),el('small',sizeLabel(p._data?.uncompressedSize||0)));
          if(['text','markdown','html','image','pdf','audio','video'].includes(classify(p.name)))row.append(button('내용 보기',async()=>{try{const data=await p.async('uint8array');const ext=p.name.split('.').pop().toLowerCase();const mime={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',mp3:'audio/mpeg',wav:'audio/wav',mp4:'video/mp4',webm:'video/webm'}[ext]||'text/plain';const url=URL.createObjectURL(new Blob([data],{type:mime}));cleanup.push(()=>URL.revokeObjectURL(url));stage.replaceChildren();controls.replaceChildren(button('압축목록으로',()=>show(selected)));await render({name:p.name,url,size:data.length,kind:classify(p.name)},generation);}catch(e){fail(e.message);}}));table.append(row);});stage.append(el('p',`압축 내부 ${entries.length}개 파일 · 자동 전체 해제/실행 없음`,{class:'muted'}),table);return;
      }
      controls.append(el('span','텍스트·내장 이미지 중심의 구조 미리보기입니다. 원본 레이아웃·애니메이션은 재현하지 않습니다.',{class:'muted'}));
      const ext=file.name.split('.').pop().toLowerCase();const pattern=ext==='pptx'?/^ppt\/slides\/slide\d+\.xml$/:ext==='hwpx'?/^Contents\/section\d+\.xml$/:ext==='epub'?/\.(xhtml|html|htm)$/:/^content\.xml$/;
      const sections=entries.filter(p=>pattern.test(p.name)).sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).slice(0,100);
      for(const p of sections){const text=await p.async('string');if(g!==generation)return;const d=new DOMParser().parseFromString(text,'application/xml');const s=el('section',null,{class:'package-section'});s.append(el('h3',p.name));const nodes=[...d.getElementsByTagName('*')].filter(n=>['t','p','h'].includes(n.localName));const seen=new Set();for(const n of nodes){if(nodes.some(a=>a!==n&&a.contains(n)))continue;const t=n.textContent.trim();if(t&&!seen.has(t)){s.append(el('p',t));seen.add(t);}}stage.append(s);}
      for(const p of entries.filter(p=>/\.(png|jpe?g|webp|gif)$/i.test(p.name)).slice(0,30)){const bytes=await p.async('uint8array');const url=URL.createObjectURL(new Blob([bytes],{type:/png$/i.test(p.name)?'image/png':/gif$/i.test(p.name)?'image/gif':/webp$/i.test(p.name)?'image/webp':'image/jpeg'}));cleanup.push(()=>URL.revokeObjectURL(url));const box=el('section',null,{class:'package-section'});box.append(el('img',null,{src:url,alt:p.name}),el('p',p.name,{class:'muted'}));stage.append(box);}if(!stage.children.length)fail('지원하는 텍스트·내장 이미지가 없습니다. 원본 파일을 이용해 주세요.');return;
    }
    fail('이 형식은 현재 뷰어에서 직접 해석하지 못합니다. 원본 열기/다운로드로 해당 프로그램에서 확인해 주세요.');
  }
  function drawCards(){cards.replaceChildren();const term=filter.value.toLowerCase();files.forEach((f,i)=>{if(term&&!`${f.name} ${labels[f.kind]}`.toLowerCase().includes(term))return;const card=el('div',null,{class:'card'});if(f.kind==='image'){const img=el('img',null,{src:f.preview?new URL(f.preview,recordBase).href:f.url,alt:f.name,loading:'lazy',tabindex:0});img.onclick=()=>show(i);img.onkeydown=e=>{if(e.key==='Enter')show(i);};card.append(img);}card.append(el('div',f.name,{class:'name'}),el('div',`${labels[f.kind]} · ${sizeLabel(f.size)}`,{class:'muted'}));const actions=el('div',null,{class:'toolbar'});actions.append(button(f.kind==='download'?'파일 정보':'미리보기',()=>show(i)),...sourceLinks(f));card.append(actions);cards.append(card);});}
  filter.addEventListener('input',drawCards);
  fetch(new URL(script.dataset.avManifest||'viewer-manifest.json',recordBase),{credentials:'same-origin',cache:'no-store'}).then(r=>{if(!r.ok)throw Error('자료 목록을 불러오지 못했습니다.');return r.json();}).then(data=>{
    files=data.files.map(f=>({...f,url:safeURL(f.url).href,kind:classify(f.name)}));
    info.textContent=`원본 ${files.length}개 · 파일을 선택하면 같은 페이지에서 열립니다. · 뷰어 ${VERSION}`;drawCards();
    document.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;const a=e.target.closest?.('a');if(!a||a.hasAttribute('download')||a.hasAttribute('data-av-original'))return;const idx=files.findIndex(f=>f.url===a.href);if(idx>=0){e.preventDefault();show(idx);}});
    document.querySelectorAll('img').forEach(img=>{const idx=files.findIndex(f=>f.url===img.src);if(idx>=0){img.style.cursor='zoom-in';img.addEventListener('click',()=>show(idx));}});
    window.SoftmArchiveViewer={version:VERSION,open:show,getFiles:()=>files.map(({name,kind,size})=>({name,kind,size}))};
  }).catch(e=>{info.textContent=e.message+' 기존 원본 링크를 이용해 주세요.';});
})();
