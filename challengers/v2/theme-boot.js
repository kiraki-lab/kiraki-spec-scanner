(() => {
  const key = 'kiraki-challengers-theme';
  let theme = 'clean';
  try {
    if (localStorage.getItem(key) === 'kiraki') theme = 'kiraki';
  } catch {}
  document.documentElement.classList.add(theme === 'kiraki' ? 'theme-kiraki' : 'theme-clean');
  document.documentElement.dataset.theme = theme;
})();
