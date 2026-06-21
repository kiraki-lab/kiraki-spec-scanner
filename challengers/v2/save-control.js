(() => {
  'use strict';

  if (window.__kirakiSaveControlLoaded) return;
  window.__kirakiSaveControlLoaded = true;

  const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;
  let dirty = false;
  let lastReason = '';
  let statusTimer = null;

  function status(text) {
    if (!el?.saveStatus) return;
    el.saveStatus.textContent = text;
  }

  function setButtonDirty(button) {
    if (!button) return;
    button.classList.toggle('primary', dirty);
    button.classList.toggle('ghost', !dirty);
    button.textContent = dirty ? '수동 저장 필요' : '수동 저장';
  }

  function manualButton() {
    let button = document.querySelector('#manualSaveButton');
    if (button) return button;

    const popover = document.querySelector('.utility-popover');
    if (!popover) return null;

    button = document.createElement('button');
    button.type = 'button';
    button.id = 'manualSaveButton';
    button.className = 'button ghost small';
    button.textContent = '수동 저장';
    button.addEventListener('click', () => flushSave('수동 저장됨'));
    popover.prepend(button);
    return button;
  }

  function flushSave(message = '저장됨') {
    const button = manualButton();
    if (!canStore) {
      status('브라우저 저장 제한');
      return false;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      dirty = false;
      lastReason = '';
      setButtonDirty(button);
      status(message);
      clearTimeout(statusTimer);
      statusTimer = setTimeout(() => status('5분 자동 저장 · 수동 저장 가능'), 1800);
      return true;
    } catch {
      status('저장 실패 · 백업 권장');
      return false;
    }
  }

  function markDirty(message = '변경됨') {
    dirty = true;
    lastReason = message;
    setButtonDirty(manualButton());
    status('변경됨 · 수동 저장 필요');
  }

  save = function controlledSave(message = '변경됨') {
    markDirty(message);
  };

  manualButton();
  setButtonDirty(document.querySelector('#manualSaveButton'));
  status('5분 자동 저장 · 수동 저장 가능');

  function flushBeforePageLeaves() {
    if (!dirty || !canStore) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      dirty = false;
      lastReason = '';
    } catch {}
  }

  window.addEventListener('pagehide', flushBeforePageLeaves);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushBeforePageLeaves();
  });

  setInterval(() => {
    if (!dirty) return;
    flushSave(lastReason ? `5분 자동 저장됨 · ${lastReason}` : '5분 자동 저장됨');
  }, AUTO_SAVE_INTERVAL);
})();
