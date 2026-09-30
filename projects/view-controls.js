/* Shared icon-only view controls. Existing view state and sorting are untouched. */
(function () {
  'use strict';
  const VERSION = '20260930-view-icons-v1';
  const MODES = {
    cards: { label: '카드형', shape: '<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>' },
    list: { label: '목록형', shape: '<path d="M9 5h12M9 12h12M9 19h12"/><path d="M3 5h1M3 12h1M3 19h1"/>' },
    table: { label: '표형', shape: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 9v12M15 9v12"/>' },
    gallery: { label: '갤러리형', shape: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>' }
  };
  function icon(mode) {
    const entry = Object.hasOwn(MODES, mode) ? MODES[mode] : null;
    return entry ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + entry.shape + '</svg>' : '';
  }
  function enhance(root) {
    let groups = 0;
    root.querySelectorAll('.view-switch').forEach(group => {
      group.querySelectorAll('button[data-view]').forEach(button => {
        const mode = button.dataset.view;
        if (!Object.hasOwn(MODES, mode)) return;
        const entry = MODES[mode];
        button.classList.add('view-icon-button');
        button.setAttribute('aria-label', entry.label);
        button.setAttribute('title', entry.label);
        if (!button.querySelector('svg')) button.innerHTML = icon(mode);
      });
      if (group.querySelector('.view-icon-button')) {
        group.classList.add('view-switch--icons');
        groups++;
      }
    });
    if (groups) root.ownerDocument.documentElement.dataset.viewControls = VERSION;
    return groups;
  }
  function start() {
    const root = document.getElementById('app');
    if (!root || enhance(root)) return;
    // project-home.js mounts the toolbar after fetching the public catalog.
    // Stop observing as soon as that toolbar is available; do not observe record renders.
    const observer = new MutationObserver(() => {
      if (enhance(root)) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VERSION, MODES, icon, enhance };
    return;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
/* Known-error link guard. The catalog, private originals and authentication are not changed. */
(function () {
  'use strict';
  const VERSION = '20260930-private-link-guard-v1';
  const FATHER = 'father-hospital-treatment-private.vercel.app';
  const LAND = 'hwagok-land-permit-private.vercel.app';
  const FATHER_RECORDS = new Set([
    '20260923-seosan-medical-record-ha-correction',
    '20260911-seosan-medical-center-response-review',
    '20260908-teacher-mutual-aid-adl-documents',
    '20260819-teacher-mutual-aid-insurance-complaint',
    '20260811-seosan-medical-record-complaint',
    '20260807-seosan-medical-record-correction',
    '20260703-neuro-ophthalmology-visual-field'
  ]);
  const LAND_PATHS = new Set(['/case/appeal', '/case/prosecution-outlook', '/case/nonprosecution-appeal', '/asset/archive-20260926.html', '/asset/appeals-20260922/staging.html']);
  function classify(raw) {
    let url;
    try { url = new URL(raw); } catch { return null; }
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search) return null;
    const pathname = url.pathname.replace(/\/$/, '');
    const slug = pathname.split('/').pop();
    if (url.hostname === FATHER && pathname === '/archive/' + slug && FATHER_RECORDS.has(slug)) {
      return {
        id: 'father', code: 'confirmed-404', checkedAt: '2026-09-30',
        message: '비공개 웹 주소 404 확인. 아래 연결은 웹 복구가 아니라 접근 권한이 필요한 GitHub 원본입니다.',
        href: 'https://github.com/softm/father-hospital-treatment-private/blob/main/archive/' + slug + '/index.html',
        repo: 'https://github.com/softm/father-hospital-treatment-private',
        label: 'GitHub HTML 원본 확인', original: url.href
      };
    }
    if (url.hostname === LAND && LAND_PATHS.has(pathname)) {
      return {
        id: 'land', code: 'deployment-repository-mismatch', checkedAt: '2026-09-30',
        message: '최근 Vercel 배포에 다른 프로젝트 저장소가 연결되고 ERROR가 발생했습니다. 올바른 서버 재배포 전까지 이 웹 연결을 정상으로 표시하지 않습니다.',
        href: '#private-link-audit-notice-land',
        repo: 'https://github.com/softm/hwagok-land-permit-private',
        label: '연결 오류 확인', original: url.href
      };
    }
    return null;
  }
  function element(doc, tag, text, className) {
    const node = doc.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function anchor(doc, href, label) {
    const node = element(doc, 'a', label, 'button');
    node.href = href; node.rel = 'noreferrer';
    return node;
  }
  function notice(root, issue) {
    const doc = root.ownerDocument, id = 'private-link-audit-notice-' + issue.id;
    if (doc.getElementById(id)) return;
    const box = element(doc, 'aside', '', 'private-link-audit-notice');
    box.id = id; box.tabIndex = -1; box.setAttribute('role', 'status');
    box.append(element(doc, 'strong', '비공개 자료 연결 점검 · ' + issue.checkedAt));
    box.append(element(doc, 'p', issue.id === 'father'
      ? '등록된 비공개 기록 7개의 웹 주소가 모두 404를 반환했습니다. 제목과 열기 버튼은 존재를 확인한 각 기록의 비공개 GitHub HTML 원본으로 연결합니다. Vercel 웹 복구는 아직 완료되지 않았습니다.'
      : issue.message));
    box.append(element(doc, 'p', '공개 프로젝트 목차는 로그인 없이 열립니다. 비공개 원문은 서버에서 인증 후 제공해야 하며, GitHub 원본 확인도 해당 저장소 접근 권한이 필요합니다.'));
    box.append(anchor(doc, issue.repo, '해당 프로젝트 비공개 저장소'));
    box.append(doc.createTextNode(' '));
    box.append(anchor(doc, '/projects/LINK-AUDIT-20260930.md', '전체 조사 범위·미해결 항목'));
    root.prepend(box);
  }
  function enhance(root) {
    const doc = root.ownerDocument;
    let changed = 0;
    root.querySelectorAll('.record-card[data-record], tr[data-record]').forEach(row => {
      if (row.dataset.privateLinkGuard === VERSION) return;
      const isPrivate = row.classList.contains('private') || Boolean(row.querySelector('.lock-label'));
      if (!isPrivate) return;
      const raw = row.dataset.record;
      let target;
      try { target = new URL(raw); } catch { return; }
      if (target.protocol !== 'https:' || target.username || target.password) return;
      const issue = classify(raw);
      row.dataset.privateLinkGuard = VERSION;
      const host = row.tagName === 'TR' ? row.cells[1] : row.querySelector('.record-body') || row;
      if (!host) return;
      if (!issue) {
        row.querySelectorAll('a[href]').forEach(link => {
          if (link.href === target.href && !link.closest('h3,strong')) link.title = '비공개 원문: 인증 서버로 이동합니다. 인증 후 원문·미디어 열람 검증과는 별개입니다.';
        });
        return;
      }
      notice(root, issue);
      row.dataset.linkState = issue.code;
      row.querySelectorAll('a[href]').forEach(link => {
        if (link.href !== target.href) return;
        link.dataset.originalTarget = raw;
        link.href = issue.href;
        link.title = issue.message;
        if (!link.closest('h3,strong')) link.textContent = issue.label;
      });
      const details = element(doc, 'details', '', 'private-link-audit-details');
      details.append(element(doc, 'summary', issue.id === 'father' ? '웹 연결 오류(404) · 원본 보존' : '저장소 연결 오류 · 재배포 필요'));
      details.append(element(doc, 'p', issue.message));
      details.append(anchor(doc, issue.original, '기존 웹 주소 다시 확인 (복구 미확인)'));
      details.append(doc.createTextNode(' '));
      details.append(anchor(doc, issue.repo, '비공개 저장소 확인'));
      host.append(details);
      changed++;
    });
    return changed;
  }
  function start() {
    if (window.SOFTMPrivateLinkGuardStarted) return;
    window.SOFTMPrivateLinkGuardStarted = true;
    const root = document.getElementById('app');
    if (!root) return;
    const style = element(document, 'style');
    style.textContent = '.private-link-audit-notice{padding:18px 20px;margin:20px 0;border:1px solid #d8b868;border-radius:12px;background:#fff8e5;color:#493818;overflow-wrap:anywhere}.private-link-audit-notice p{margin:8px 0}.private-link-audit-details{margin:12px 0;color:#72511a;font-size:14px}.private-link-audit-details summary{cursor:pointer}.private-link-audit-details a{display:inline-block;margin:5px 4px 5px 0}.private-link-audit-notice:focus{outline:3px solid #b5811b;outline-offset:3px}';
    document.head.append(style);
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        observer.disconnect();
        enhance(root);
        scheduled = false;
        observer.observe(root, { childList: true, subtree: true });
      });
    });
    enhance(root);
    observer.observe(root, { childList: true, subtree: true });
  }
  const api = { VERSION, classify, enhance };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.privateLinkGuard = api;
    return;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
