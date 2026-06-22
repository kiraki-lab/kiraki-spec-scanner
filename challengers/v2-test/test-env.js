(() => {
  'use strict';

  if (window.__kirakiV2TestEnvLoaded) return;
  window.__kirakiV2TestEnvLoaded = true;
  window.__KIRAKI_TEST_MODE__ = true;

  const PREFIX = 'kiraki-v2-test:';
  const shouldMap = (key) => typeof key === 'string' && key.startsWith('kiraki-') && !key.startsWith(PREFIX);
  const mapKey = (key) => shouldMap(key) ? `${PREFIX}${key}` : key;

  function patchStorage(storage) {
    if (!storage || storage.__kirakiV2TestPatched) return;
    const original = {
      getItem: storage.getItem.bind(storage),
      setItem: storage.setItem.bind(storage),
      removeItem: storage.removeItem.bind(storage),
      key: storage.key.bind(storage)
    };

    storage.getItem = (key) => original.getItem(mapKey(String(key)));
    storage.setItem = (key, value) => original.setItem(mapKey(String(key)), value);
    storage.removeItem = (key) => original.removeItem(mapKey(String(key)));
    storage.key = (index) => original.key(index);
    Object.defineProperty(storage, '__kirakiV2TestPatched', { value: true });
  }

  try { patchStorage(window.localStorage); } catch {}
  try { patchStorage(window.sessionStorage); } catch {}

  function installBanner() {
    if (document.querySelector('#kirakiV2TestBanner')) return;
    const style = document.createElement('style');
    style.textContent = `
#kirakiV2TestBanner{position:sticky;top:0;z-index:9999;display:flex;align-items:center;justify-content:center;gap:8px;min-height:34px;padding:6px 12px;background:#0f766e;color:#fff;font:800 12px/1.35 "Noto Sans KR",system-ui,sans-serif;letter-spacing:0;box-shadow:0 2px 10px rgba(15,118,110,.18)}
#kirakiV2TestBanner span{opacity:.86;font-weight:700}.site-header{top:34px!important}
`;
    document.head.append(style);
    const banner = document.createElement('div');
    banner.id = 'kirakiV2TestBanner';
    banner.innerHTML = '<strong>TEST VERSION</strong><span>공개판과 저장소가 분리된 테스트 환경입니다.</span>';
    document.body.prepend(banner);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBanner, { once: true });
  else installBanner();
})();