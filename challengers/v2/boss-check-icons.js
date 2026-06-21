(() => {
  'use strict';

  if (window.__kirakiBossCheckIconsLoaded) return;
  window.__kirakiBossCheckIconsLoaded = true;

  function bossMap() {
    const data = window.CHALLENGERS_DATA;
    if (!Array.isArray(data?.bossMissions)) return new Map();
    return new Map(data.bossMissions.map((boss) => [boss.id, boss]));
  }

  function installStyles() {
    if (document.querySelector('#kirakiBossCheckIconStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiBossCheckIconStyles';
    style.textContent = `
.boss-check.has-boss-icon{align-items:center;gap:8px;min-height:76px}.boss-check.has-boss-icon input{align-self:center;margin:0}.boss-check.has-boss-icon .boss-photo-icon{margin-right:1px;border-radius:9px}.boss-check.has-boss-icon .boss-copy{align-self:center}.boss-check.has-boss-icon.checked .boss-photo-icon{border-color:color-mix(in srgb,var(--accent) 48%,var(--line));box-shadow:0 4px 10px rgba(91,85,232,.18)}@media(max-width:620px){.boss-check.has-boss-icon{min-height:70px;padding:10px}.boss-check.has-boss-icon .boss-photo-icon{--boss-icon-size:30px}}`;
    document.head.append(style);
  }

  function decorateBossChecks() {
    if (typeof window.kirakiBossIconHtml !== 'function') return;
    const bosses = bossMap();
    if (!bosses.size) return;

    document.querySelectorAll('[data-boss-card]').forEach((card) => {
      if (card.querySelector('.boss-photo-icon')) return;
      const boss = bosses.get(card.dataset.bossCard);
      const input = card.querySelector('[data-boss-checkbox]');
      if (!boss || !input) return;
      input.insertAdjacentHTML('afterend', window.kirakiBossIconHtml(boss, 34));
      card.classList.add('has-boss-icon');
    });
  }

  function boot() {
    installStyles();
    decorateBossChecks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
