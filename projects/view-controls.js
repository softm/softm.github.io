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
