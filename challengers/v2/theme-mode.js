(() => {
  const key = 'kiraki-challengers-theme';
  const root = document.documentElement;
  const button = document.querySelector('#themeToggle');
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme, persist = true) {
    const kiraki = theme === 'kiraki';
    root.classList.toggle('theme-kiraki', kiraki);
    root.classList.toggle('theme-clean', !kiraki);
    root.dataset.theme = kiraki ? 'kiraki' : 'clean';

    if (button) {
      const main = button.querySelector('.theme-toggle-main');
      const sub = button.querySelector('small');
      if (main) main.textContent = kiraki ? '현재: 핑크모드' : '현재: 하얀모드';
      if (sub) sub.textContent = kiraki ? '하얀모드로 전환' : '핑크모드로 전환';
      button.setAttribute('aria-label', kiraki ? '현재 핑크모드, 하얀모드로 전환' : '현재 하얀모드, 핑크모드로 전환');
    }

    if (metaTheme) metaTheme.setAttribute('content', kiraki ? '#ff8fc5' : '#ffffff');
    if (persist) {
      try { localStorage.setItem(key, kiraki ? 'kiraki' : 'clean'); } catch {}
    }
  }

  function loadCoinShop() {
    if (document.querySelector('script[data-kiraki-coinshop]')) return;
    const script = document.createElement('script');
    script.src = './coinshop.js?v=0.1.0';
    script.dataset.kirakiCoinshop = 'true';
    script.async = false;
    document.body.append(script);
  }

  const initialTheme = root.classList.contains('theme-kiraki') ? 'kiraki' : 'clean';
  applyTheme(initialTheme, false);
  button?.addEventListener('click', () => applyTheme(root.classList.contains('theme-kiraki') ? 'clean' : 'kiraki'));

  if (document.readyState === 'complete') loadCoinShop();
  else window.addEventListener('load', loadCoinShop, { once: true });
})();
