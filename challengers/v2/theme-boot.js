(() => {
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = './favicon.svg?v=20260621a';
  document.head.append(favicon);

  const key = 'kiraki-challengers-theme';
  let theme = 'clean';
  try {
    if (localStorage.getItem(key) === 'kiraki') theme = 'kiraki';
  } catch {}
  document.documentElement.classList.add(theme === 'kiraki' ? 'theme-kiraki' : 'theme-clean');
  document.documentElement.dataset.theme = theme;
})();
