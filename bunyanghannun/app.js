/* 분양한눈 — 순수 JavaScript, 공개 JSON 기반. 비밀키를 브라우저에 보관하지 않습니다. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const DATA = { offer: [], transfer: [] };
  const META = { offer: {}, transfer: {} };
  const URLS = { offer: './data/offerings.json', transfer: './data/transfers.json' };
  const K = { saved: 'bunyanghannun.saved.v1', alert: 'bunyanghannun.alert.v1', seen: 'bunyanghannun.seen.v1' };
  const state = { kind: 'offer', demo: false, savedOnly: false, mobile: 'list', filtered: [], selected: null };
  let map, markers, toastTimer;
  const loadLocal = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };
  const saveLocal = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };
  let saved = loadLocal(K.saved, []);
  let alertRule = loadLocal(K.alert, { region: '', offer: true, transfer: true, days: 3 });
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attr = esc;
  const date = v => v ? String(v).slice(0, 10) : '';
  const dayValue = v => { const s = date(v); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00').getTime() : NaN; };
  const delta = v => Math.ceil((dayValue(v) - new Date(new Date().toDateString()).getTime()) / 86400000);
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
  const displayDate = v => { const s = date(v); return s ? s.replaceAll('-', '.') : '미제공'; };
  const money = v => { const n = Number(v); if (!Number.isFinite(n) || n <= 0) return '가격 미제공'; const u = Math.floor(n / 10000), r = n % 10000; return u ? (u + '억' + (r ? ' ' + r.toLocaleString('ko-KR') + '만' : '')) + '원' : n.toLocaleString('ko-KR') + '만원'; };
  const site = (kind) => kind === 'offer' ? 'https://www.applyhome.co.kr/' : 'https://rt.molit.go.kr/';
  const safeUrl = (s, kind) => { try { const u = new URL(String(s)); return u.protocol === 'https:' ? u.href : site(kind); } catch (_) { return site(kind); } };
  const toKey = item => item.kind + ':' + item.id;
  const isSaved = item => saved.includes(toKey(item));
  const toast = msg => { $('toast').textContent = msg; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3200); };

  function initMap() {
    if (!window.L) { $('mapFallback').hidden = false; return; }
    map = L.map('map', { zoomControl: false }).setView([36.36, 127.83], 7);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    markers = L.layerGroup().addTo(map);
    map.on('moveend', () => { if ($('withinMap').checked) render(); });
    $('mapHome').addEventListener('click', () => { map.setView([36.36,127.83],7); });
    $('mapLocate').addEventListener('click', () => {
      if (!navigator.geolocation) { toast('이 브라우저는 현재 위치 기능을 제공하지 않습니다.'); return; }
      navigator.geolocation.getCurrentPosition(pos => { map.setView([pos.coords.latitude, pos.coords.longitude], 12); toast('현재 위치로 이동했습니다.'); }, () => toast('위치 권한을 허용하거나 검색 필터를 이용하세요.'), { enableHighAccuracy: false, timeout: 10000 });
    });
  }
  function normalized(raw, kind) {
    if (!raw || typeof raw !== 'object' || !raw.id || !raw.title) return null;
    const lat = Number(raw.lat), lng = Number(raw.lng);
    const coordinates = raw.lat != null && raw.lng != null && Number.isFinite(lat) && Number.isFinite(lng) && lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
    return {
      id: String(raw.id), kind, title: String(raw.title), region: String(raw.region || ''), address: String(raw.address || ''),
      stage: String(raw.stage || (kind === 'transfer' ? '거래' : '미확인')), noticeDate: date(raw.noticeDate), startDate: date(raw.startDate),
      endDate: date(raw.endDate), dealDate: date(raw.dealDate), price: Number(raw.price) || 0, units: Number(raw.units) || 0,
      area: String(raw.area || ''), floor: raw.floor == null ? '' : String(raw.floor),
      source: String(raw.source || (kind === 'offer' ? '한국부동산원 청약홈' : '국토교통부 분양권 실거래')),
      sourceUrl: safeUrl(raw.sourceUrl, kind), updatedAt: String(raw.updatedAt || ''), lat: coordinates ? lat : null,
      lng: coordinates ? lng : null, demo: Boolean(raw.demo), locationQuality: String(raw.locationQuality || (coordinates ? 'verified' : 'unavailable'))
    };
  }
  function demoData() {
    return {
      offer: [
        { id:'sample-apt-a',title:'샘플 청약단지 A (가상)',region:'경기',address:'경기도 부천시 · 가상 위치',stage:'예정',noticeDate:addDays(-2),startDate:addDays(3),endDate:addDays(6),price:54000,units:420,area:'84㎡',lat:37.50,lng:126.80 },
        { id:'sample-apt-b',title:'샘플 무순위 단지 B (가상)',region:'인천',address:'인천광역시 · 가상 위치',stage:'무순위',noticeDate:addDays(-1),startDate:addDays(1),endDate:addDays(2),price:43000,units:50,area:'59㎡',lat:37.46,lng:126.67 },
        { id:'sample-apt-c',title:'샘플 접수 단지 C (가상)',region:'서울',address:'서울특별시 · 가상 위치',stage:'접수중',noticeDate:addDays(-10),startDate:addDays(-1),endDate:addDays(2),price:93000,units:280,area:'74㎡',lat:37.55,lng:127.00 }
      ].map(x => normalized(Object.assign(x,{demo:true,source:'가상 예시 데이터',sourceUrl:site('offer')}),'offer')),
      transfer: [
        { id:'sample-transfer-a',title:'샘플 분양권 거래 A (가상)',region:'경기',address:'경기도 광명시 · 가상 위치',stage:'거래',dealDate:addDays(-7),price:78000,area:'84㎡',floor:12,lat:37.47,lng:126.86 },
        { id:'sample-transfer-b',title:'샘플 분양권 거래 B (가상)',region:'충남',address:'충청남도 서산시 · 가상 위치',stage:'거래',dealDate:addDays(-15),price:31000,area:'59㎡',floor:8,lat:36.78,lng:126.45 }
      ].map(x => normalized(Object.assign(x,{demo:true,source:'가상 예시 데이터',sourceUrl:site('transfer')}),'transfer'))
    };
  }
  function currentItems() { return state.demo ? demoData()[state.kind] : DATA[state.kind]; }
  function matches(item) {
    const q = $('keyword').value.trim().toLocaleLowerCase('ko-KR');
    const region = $('region').value, stage = $('status').value;
    if (q && !(item.title + ' ' + item.address + ' ' + item.region).toLocaleLowerCase('ko-KR').includes(q)) return false;
    if (region && item.region !== region) return false;
    if (stage && item.stage !== stage) return false;
    if ($('savedOnly').checked && !isSaved(item)) return false;
    if (map && $('withinMap').checked && item.lat != null && !map.getBounds().contains([item.lat,item.lng])) return false;
    if (map && $('withinMap').checked && item.lat == null) return false;
    return true;
  }
  function getFiltered() {
    const items = currentItems().filter(matches);
    const sort = $('sort').value;
    if (sort === 'name') items.sort((a,b) => a.title.localeCompare(b.title,'ko'));
    else if (sort === 'soon' && state.kind === 'offer') items.sort((a,b) => (dayValue(a.startDate)||Infinity) - (dayValue(b.startDate)||Infinity));
    else items.sort((a,b) => (dayValue(state.kind==='offer'?b.noticeDate:b.dealDate)||0) - (dayValue(state.kind==='offer'?a.noticeDate:a.dealDate)||0));
    return items;
  }
  function card(item) {
    const transfer = item.kind === 'transfer';
    const stageClass = transfer ? 'amber' : item.stage === '마감' ? 'gray' : '';
    const priceLabel = transfer ? '신고 거래금액' : '분양가(제공값)';
    const when = transfer ? '거래 ' + displayDate(item.dealDate) : '접수 ' + displayDate(item.startDate) + ' ~ ' + displayDate(item.endDate);
    return '<article class="listing-card' + (state.selected===toKey(item)?' selected':'') + '" data-open="' + attr(toKey(item)) + '" tabindex="0" role="button" aria-label="' + attr(item.title) + ' 상세보기">' +
      '<div class="card-top"><span class="pill ' + stageClass + '">' + esc(item.demo?'예시 · ':'') + esc(item.stage) + '</span><button type="button" class="save-icon ' + (isSaved(item)?'active':'') + '" aria-label="관심 저장" data-save="' + attr(toKey(item)) + '">' + (isSaved(item)?'★':'☆') + '</button></div>' +
      '<h2>' + esc(item.title) + '</h2><p class="card-addr">⌖ ' + esc(item.address || item.region || '위치 미확인') + (!item.lat?' · 좌표 미확인':'') + '</p>' +
      '<div class="card-metrics"><span>' + esc(priceLabel) + '</span><strong>' + esc(money(item.price)) + '</strong>' + (item.area?'<span> · '+esc(item.area)+'</span>':'') + '</div>' +
      '<div class="card-bottom"><span>' + esc(when) + '</span><span>상세 보기 ›</span></div></article>';
  }
  function renderCards() {
    const items = state.filtered;
    const count = state.demo ? '가상 예시 ' + items.length + '건' : items.length + '건';
    $('resultDesc').textContent = count + ' · ' + (state.kind==='offer'?'모집공고 기준':'신고된 실거래 기준');
    $('savedCount').textContent = saved.length;
    if (!items.length) {
      const hasReal = DATA[state.kind].length > 0;
      $('cards').innerHTML = '<div class="empty"><span class="illus">' + (hasReal?'⌕':'🏙️') + '</span><b>' + (hasReal?'검색 조건에 맞는 결과가 없습니다.':state.demo?'예시 조건에 맞는 결과가 없습니다.':'아직 연결된 공식 데이터가 없습니다.') + '</b><p>' +
        (hasReal?'지역·상태 필터를 변경해 보세요.':'API 키와 수집기를 연동하면 이곳에 실제 공고·거래가 표시됩니다. 현재 수치는 0건이며 실거래가 없다는 의미가 아닙니다.') +
        '</p><button type="button" id="emptyAction">' + (state.demo?'필터 초기화': '예시 화면 둘러보기') + '</button></div>';
      $('emptyAction').addEventListener('click', () => { if (state.demo) resetFilters(); else { state.demo=true; render(); } });
    } else $('cards').innerHTML = items.map(card).join('');
    $('cards').querySelectorAll('[data-save]').forEach(btn => btn.addEventListener('click', event => {
      event.stopPropagation(); const key = btn.dataset.save; saved = saved.includes(key)? saved.filter(x=>x!==key): saved.concat([key]); saveLocal(K.saved,saved); toast(saved.includes(key)?'관심 단지로 저장했습니다.':'관심 단지에서 제외했습니다.'); render();
    }));
    $('cards').querySelectorAll('[data-open]').forEach(node => {
      node.addEventListener('click', () => openDetail(node.dataset.open));
      node.addEventListener('keydown', e => { if (e.key==='Enter' && e.target===node) openDetail(node.dataset.open); });
    });
  }
  function renderMarkers() {
    if (!map || !markers) return;
    markers.clearLayers();
    let plotted=0;
    for (const item of state.filtered) {
      if (item.lat == null) continue;
      const amber = item.kind==='transfer'?' amber':'';
      const html='<div class="map-pin' + amber + '"><span>' + (item.kind==='transfer'?'₩':'집') + '</span></div>';
      const marker=L.marker([item.lat,item.lng],{icon:L.divIcon({className:'pin-icon',html:html,iconSize:[37,37],iconAnchor:[18,37]})});
      marker.bindTooltip(esc(item.title),{direction:'top',offset:[0,-33]});
      marker.on('click',()=>openDetail(toKey(item)));
      markers.addLayer(marker); plotted++;
    }
    $('mapCount').textContent='지도에 ' + plotted + '건' + (state.demo?' (예시)':'') + (state.filtered.length>plotted?' · 위치 미확인 '+(state.filtered.length-plotted)+'건':'');
  }
  function renderBanner() {
    const meta = META[state.kind];
    const banner = $('statusBanner');
    banner.className='status-banner'+(state.demo?' demo':(meta.status!=='ok'?' warn':''));
    let message;
    if(state.demo) message='이 화면은 <b>가상 예시</b>이며 실제 단지·가격·일정이 아닙니다.';
    else if(meta.status==='ok') message='공식 수집 데이터 · 마지막 수집 ' + esc(meta.generatedAt?new Date(meta.generatedAt).toLocaleString('ko-KR'):'미기록');
    else if(meta.status==='error') message='데이터를 불러오지 못했습니다. 연결 상태를 확인해 주세요.';
    else message='공식 데이터 연동 대기 중 · 실제 분양·거래가 없는 것으로 해석하지 마세요.';
    banner.innerHTML = message + '<button type="button" id="toggleDemo">' + (state.demo?'실제 데이터로 돌아가기':'예시 데이터 보기') + '</button>';
    $('toggleDemo').addEventListener('click',()=>{state.demo=!state.demo;resetFilters();render();});
    const o=META.offer,t=META.transfer;
    $('sourceStatus').textContent='청약: '+(o.status==='ok'?'연동':'미연동')+' · 분양권: '+(t.status==='ok'?'연동':'미연동')+' · 표시 기준: '+(state.demo?'가상 예시':'공식 데이터만');
  }
  function render() {
    state.filtered=getFiltered();
    $('listTitle').textContent = state.kind === 'offer' ? '청약·분양 정보' : '분양권 전매 실거래';
    renderBanner(); renderCards(); renderMarkers();
  }
  function changeKind(kind) {
    state.kind=kind; state.selected=null; closeDetail();
    for(const [k,el] of [['offer',$('tabOffer')],['transfer',$('tabTransfer')]]) { el.classList.toggle('active',k===kind);el.setAttribute('aria-selected',String(k===kind)); }
    $('statusLabel').textContent=kind==='offer'?'접수 상태':'거래 상태';
    $('status').innerHTML=kind==='offer'?'<option value="">상태 전체</option><option>예정</option><option>접수중</option><option>마감</option><option>무순위</option>':'<option value="">거래 전체</option><option value="거래">신고된 거래</option>';
    $('quickFilters').hidden=kind==='transfer';
    $('status').value='';
    $('sort').querySelector('option[value="soon"]').hidden=kind==='transfer';
    if ($('sort').value==='soon' && kind==='transfer') $('sort').value='recent';
    render();
  }
  function resetFilters() { $('keyword').value='';$('region').value='';$('status').value='';$('savedOnly').checked=false;$('withinMap').checked=false;$('sort').value='recent';syncQuick();render(); }
  function syncQuick() { $('quickFilters').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.filter===$('status').value)); }
  function openDetail(key) {
    const item=currentItems().find(x=>toKey(x)===key);
    if(!item)return;
    state.selected=key;
    const details = item.kind==='offer' ? [
      ['접수 상태',item.stage],['모집공고일',displayDate(item.noticeDate)],['청약 시작',displayDate(item.startDate)],['접수 마감',displayDate(item.endDate)],
      ['분양가',money(item.price)],['공급 세대',item.units?item.units.toLocaleString('ko-KR')+'세대':'미제공'],['면적',item.area||'미제공']
    ] : [['거래 종류','분양권 전매 (신고 자료)'],['계약일',displayDate(item.dealDate)],['거래금액',money(item.price)],['면적',item.area||'미제공'],['층',item.floor?item.floor+'층':'미제공'],['매물 상태','현재 매물 여부 확인 불가']];
    details.push(['주소',item.address||'미제공'],['지도 좌표',item.lat!=null?item.locationQuality==='verified'?'확인된 위치':'참고 위치':'확인되지 않음'],['출처',item.source],['갱신 시각',item.updatedAt?String(item.updatedAt).replace('T',' ').slice(0,19):'미제공']);
    $('detailBody').innerHTML='<div class="detail-content"><span class="pill '+(item.kind==='transfer'?'amber':'')+'">'+esc(item.demo?'예시 · ':'')+esc(item.stage)+'</span><h2>'+esc(item.title)+'</h2><p>⌖ '+esc(item.address||item.region||'주소 미확인')+'</p>'+
      (item.demo?'<p class="status-banner demo">가상 데이터입니다. 실제 청약·거래 정보가 아닙니다.</p>':'')+
      '<table class="detail-table"><tbody>'+details.map(row=>'<tr><th>'+esc(row[0])+'</th><td>'+esc(row[1])+'</td></tr>').join('')+'</tbody></table>'+
      '<div class="detail-actions"><button type="button" id="detailSave">'+(isSaved(item)?'★ 관심 해제':'☆ 관심 저장')+'</button><a href="'+attr(item.sourceUrl)+'" target="_blank" rel="noopener noreferrer">공식 출처 ↗</a></div>'+
      '<p class="fine">제공기관 원문과 신고정보를 최종 확인하세요. 개인별 청약 자격과 전매 가능 여부는 이 화면에서 판정하지 않습니다.</p></div>';
    $('detailSave').onclick=()=>{saved=isSaved(item)?saved.filter(x=>x!==key):saved.concat([key]);saveLocal(K.saved,saved);openDetail(key);renderCards();};
    $('detail').classList.add('open');$('detail').setAttribute('aria-hidden','false');$('scrim').hidden=false;
    if(map && item.lat!=null && window.innerWidth>690) map.panTo([item.lat,item.lng]);
  }
  function closeDetail() {$('detail').classList.remove('open');$('detail').setAttribute('aria-hidden','true');$('scrim').hidden=true;state.selected=null;}
  function openCalendar() {
    const items=(state.demo?demoData().offer:DATA.offer).filter(x=>Number.isFinite(dayValue(x.startDate)) && delta(x.startDate)>=0 && delta(x.startDate)<=45).sort((a,b)=>dayValue(a.startDate)-dayValue(b.startDate));
    $('calendarList').innerHTML=items.length?items.slice(0,30).map(x=>'<div class="calendar-row"><div><b>'+esc(x.title)+'</b><small>'+esc(x.region)+' · 접수 '+esc(displayDate(x.startDate))+(x.demo?' · 가상 예시':'')+'</small></div><button type="button" data-calendar="'+attr(toKey(x))+'">상세</button></div>').join(''):'<p>현재 연결된 향후 45일 청약 일정이 없습니다. 공식 데이터 미연동일 수 있습니다.</p>';
    $('dialogCalendar').showModal();
    $('calendarList').querySelectorAll('[data-calendar]').forEach(b=>b.onclick=()=>{ $('dialogCalendar').close();changeKind('offer');openDetail(b.dataset.calendar); });
  }
  function openAlerts() {
    $('alertRegion').value=alertRule.region || '';
    $('alertOffer').checked=Boolean(alertRule.offer);
    $('alertTransfer').checked=Boolean(alertRule.transfer);
    $('alertDays').value=String(alertRule.days||3);
    $('alertMessage').textContent='현재 브라우저 권한: '+(!('Notification' in window)?'미지원':Notification.permission==='granted'?'허용':Notification.permission==='denied'?'차단':'미설정');
    $('dialogAlert').showModal();
  }
  function checkAlertNotifications(kind,items) {
    if (state.demo || META[kind].status!=='ok') return;
    const key=K.seen+'.'+kind, prev=loadLocal(key,null);
    const keys=items.map(toKey);
    saveLocal(key,keys);
    if (!Array.isArray(prev)||!('Notification' in window)||Notification.permission!=='granted'||!alertRule[kind]) return;
    const unseen=items.filter(x=>!prev.includes(toKey(x)) && (!alertRule.region||alertRule.region===x.region));
    if(!unseen.length)return;
    const candidate=unseen[0];
    const title=kind==='offer'?'분양한눈 · 새로운 청약 정보':'분양한눈 · 신규 분양권 거래';
    new Notification(title,{body:candidate.title+(unseen.length>1?' 외 '+(unseen.length-1)+'건':'')});
  }
  async function loadData() {
    for(const kind of ['offer','transfer']) {
      try {
        const response=await fetch(URLS[kind],{cache:'no-store'});
        if(!response.ok)throw Error('HTTP '+response.status);
        const json=await response.json();
        if(!json||!Array.isArray(json.items)) throw Error('invalid feed');
        DATA[kind]=json.items.map(x=>normalized(x,kind)).filter(Boolean);
        META[kind]={status:json.status||'unconfigured',generatedAt:json.generatedAt||null};
        checkAlertNotifications(kind,DATA[kind]);
      } catch(error) { META[kind]={status:'error',message:String(error)}; }
    }
    render();
  }
  function bindUI() {
    $('tabOffer').onclick=()=>changeKind('offer');$('tabTransfer').onclick=()=>changeKind('transfer');
    for(const id of ['keyword','region','status','sort','withinMap','savedOnly']) $(id).addEventListener(id==='keyword'?'input':'change',()=>{syncQuick();render();});
    $('clearKeyword').onclick=()=>{$('keyword').value='';render();};
    $('quickFilters').querySelectorAll('button').forEach(b=>b.onclick=()=>{$('status').value=b.dataset.filter;syncQuick();render();});
    $('resetFilters').onclick=resetFilters;
    $('btnAlerts').onclick=openAlerts;$('btnCalendar').onclick=openCalendar;
    $('btnSaved').onclick=()=>{$('savedOnly').checked=!$('savedOnly').checked;render();toast($('savedOnly').checked?'관심 정보만 표시합니다.':'전체 정보를 표시합니다.');};
    $('closeDetail').onclick=closeDetail;$('scrim').onclick=closeDetail;
    window.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetail();});
    $('saveAlert').onclick=()=>{
      if(!$('alertOffer').checked&&!$('alertTransfer').checked){$('alertMessage').textContent='알림 종류를 하나 이상 선택하세요.';return;}
      alertRule={region:$('alertRegion').value,offer:$('alertOffer').checked,transfer:$('alertTransfer').checked,days:Number($('alertDays').value)};
      saveLocal(K.alert,alertRule);$('dialogAlert').close();toast('알림 조건을 이 브라우저에 저장했습니다. 종료 상태 푸시는 아직 제공되지 않습니다.');
    };
    $('btnNotifyPermission').onclick=async()=>{
      if(!('Notification' in window)){ $('alertMessage').textContent='이 브라우저는 알림을 지원하지 않습니다.';return; }
      try {const p=await Notification.requestPermission();$('alertMessage').textContent='브라우저 알림 권한: '+p;}catch(_){$('alertMessage').textContent='브라우저에서 알림 권한을 변경하세요.';}
    };
    $('viewList').onclick=()=>{state.mobile='list';$('workspace').classList.remove('map-mobile');$('viewList').classList.add('active');$('viewMap').classList.remove('active');};
    $('viewMap').onclick=()=>{state.mobile='map';$('workspace').classList.add('map-mobile');$('viewMap').classList.add('active');$('viewList').classList.remove('active');if(map)setTimeout(()=>map.invalidateSize(),80);};
    const url=new URL(window.location.href);
    if(url.searchParams.get('kind')==='transfer')changeKind('transfer');
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadData();});
    setInterval(()=>{if(!document.hidden)loadData();},15*60*1000);
  }
  function boot(){initMap();bindUI();loadData();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();