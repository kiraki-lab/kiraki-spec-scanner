(() => {
  'use strict';

  if (window.__kirakiEventCoinShopPolishLoaded) return;
  window.__kirakiEventCoinShopPolishLoaded = true;

  const STORAGE_KEY = 'kiraki-event-coinshop:v1';
  const nf = typeof number !== 'undefined' ? number : new Intl.NumberFormat('ko-KR');

  const items = [
    { id: 'karma-bronze-additional-cube', shop: 'upgrade', cost: 100, limit: 100 },
    { id: 'karma-silver-cube', shop: 'upgrade', cost: 100, limit: 100 },
    { id: 'epic-potential-scroll-100', shop: 'upgrade', cost: 300, limit: 5 },
    { id: 'special-additional-potential-scroll-100', shop: 'upgrade', cost: 300, limit: 5 },
    { id: 'innocent-scroll-100', shop: 'upgrade', cost: 100, limit: 20 },
    { id: 'pet-equipment-scroll-selector', shop: 'upgrade', cost: 500, limit: 20 },
    { id: 'clean-slate-scroll-100', shop: 'upgrade', cost: 200, limit: 10 },
    { id: 'event-ring-selector', shop: 'upgrade', cost: 3000, limit: 3 },
    { id: 'event-ring-gold-cube', shop: 'upgrade', cost: 150, limit: 50 },
    { id: 'event-ring-legendary-potential-scroll-100', shop: 'upgrade', cost: 4000, limit: 3 },
    { id: 'karma-unique-potential-scroll-100', shop: 'upgrade', cost: 3000, limit: 4 },
    { id: 'karma-additional-epic-potential-scroll-100', shop: 'upgrade', cost: 3000, limit: 4 },
    { id: 'karma-special-heart-scroll-selector', shop: 'upgrade', cost: 2000, limit: 10 },
    { id: 'ap-reset-scroll', shop: 'growth', cost: 50, limit: 3 },
    { id: 'sp-reset-scroll', shop: 'growth', cost: 50, limit: 3 },
    { id: 'trait-growth-potion', shop: 'growth', cost: 300, limit: 20 },
    { id: 'slot-8-expansion-coupon', shop: 'growth', cost: 100, limit: 15 },
    { id: 'infinite-fatigue-recovery', shop: 'growth', cost: 10, limit: 5 },
    { id: 'exp-core-gemstone', shop: 'growth', cost: 150, limit: 200 },
    { id: 'chaos-circulator', shop: 'growth', cost: 800, limit: 20 },
    { id: 'black-circulator', shop: 'growth', cost: 1500, limit: 10 },
    { id: 'legendary-circulator', shop: 'growth', cost: 2000, limit: 3 },
    { id: 'spiegelmann-golden-strawberry-farm-ticket', shop: 'growth', cost: 200, limit: 5 },
    { id: 'extreme-growth-potion', shop: 'growth', cost: 70, limit: 200 },
    { id: 'growth-potion-200-249', shop: 'growth', cost: 5000, limit: 2 },
    { id: 'growth-potion-200-259', shop: 'growth', cost: 10000, limit: 1 },
    { id: 'sol-erda-event', shop: 'growth', cost: 8000, limit: 3 }
  ];

  const presets = [
    { id: 'event-ring', quantities: { 'event-ring-selector': 3, 'event-ring-gold-cube': 50, 'event-ring-legendary-potential-scroll-100': 3 } },
    { id: 'hexa-growth', quantities: { 'sol-erda-event': 3, 'exp-core-gemstone': 200 } },
    { id: 'growth-potion', quantities: { 'extreme-growth-potion': 200, 'growth-potion-200-249': 2, 'growth-potion-200-259': 1 } },
    { id: 'potential', quantities: { 'karma-bronze-additional-cube': 100, 'karma-silver-cube': 100, 'epic-potential-scroll-100': 5, 'special-additional-potential-scroll-100': 5, 'karma-unique-potential-scroll-100': 4, 'karma-additional-epic-potential-scroll-100': 4 } }
  ];

  const byId = new Map(items.map((item) => [item.id, item]));
  const toInt = (value) => Math.max(0, Math.round(Number(value) || 0));

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function loadAuxiliaryScripts() {
    const scripts = [
      { src: './event-coin-week-presets.js?v=0.1.0', flag: '__kirakiEventCoinWeekPresetsLoaded' },
      { src: './roadmap-journal.js?v=0.1.0', flag: '__kirakiRoadmapJournalLoaded' }
    ];
    scripts.forEach(({ src, flag }) => {
      if (window[flag] || document.querySelector(`script[src="${src}"]`)) return;
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      document.head.append(script);
    });
  }

  function migrateWeeklyCoins() {
    const state = readState();
    if (Number(state.weeklyCoins) === 2000 && !state.weeklyCoinsMigrated4000) {
      state.weeklyCoins = 4000;
      state.weeklyCoinsMigrated4000 = true;
      writeState(state);
    }

    const input = document.querySelector('#eventCoinWeekly');
    if (input && Number(input.value) === 2000) {
      input.value = '4000';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function installStyles() {
    if (document.querySelector('#kirakiEventCoinShopPolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiEventCoinShopPolishStyles';
    style.textContent = `
.event-roadmap-card{padding:15px;border:1px solid color-mix(in srgb,#38bdf8 36%,var(--line));border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,#e0f7ff 72%,var(--surface)),var(--surface))}.event-roadmap-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.event-roadmap-head strong{font-size:1rem;font-weight:950}.event-roadmap-head span{color:#036985;font-size:.72rem;font-weight:900}.event-roadmap-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.event-roadmap-metric{display:grid;gap:5px;min-height:78px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}.event-roadmap-metric span{color:var(--muted);font-size:.67rem;font-weight:850}.event-roadmap-metric strong{font-size:1rem;font-weight:950}.event-roadmap-metric small{color:var(--muted);font-size:.65rem;font-weight:760;line-height:1.35}.event-roadmap-metric.good strong{color:#047857}.event-roadmap-metric.bad strong{color:var(--danger)}.event-preset-budget{display:flex!important;flex-wrap:wrap;gap:5px;margin-top:7px}.event-preset-budget em{display:inline-flex;align-items:center;min-height:21px;padding:2px 7px;border-radius:999px;background:var(--surface);border:1px solid var(--line);color:var(--muted);font-style:normal;font-size:.62rem;font-weight:900}.event-preset-budget em.good{border-color:#86efac;background:#ecfdf5;color:#047857}.event-preset-budget em.bad{border-color:#fecaca;background:#fff1f2;color:#be123c}@media(max-width:900px){.event-roadmap-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.event-roadmap-grid{grid-template-columns:1fr}.event-roadmap-head{display:grid}}
`;
    document.head.append(style);
  }

  function valueOf(selector) {
    return toInt(document.querySelector(selector)?.value);
  }

  function mergedState() {
    const state = readState();
    const costs = { ...(state.costs || {}) };
    const limits = { ...(state.limits || {}) };
    const quantities = { ...(state.quantities || {}) };

    document.querySelectorAll('[data-event-item-cost]').forEach((input) => { costs[input.dataset.eventItemCost] = input.value; });
    document.querySelectorAll('[data-event-item-limit]').forEach((input) => { limits[input.dataset.eventItemLimit] = input.value === '' ? null : input.value; });
    document.querySelectorAll('[data-event-item-qty]').forEach((input) => { quantities[input.dataset.eventItemQty] = input.value; });

    return { costs, limits, quantities };
  }

  function costFor(state, id) {
    return toInt(state.costs[id] ?? byId.get(id)?.cost);
  }

  function limitFor(state, id) {
    const value = state.limits[id];
    if (value === null || value === '' || value === undefined) return byId.get(id)?.limit ?? null;
    return toInt(value);
  }

  function qtyFor(state, id, rawQty) {
    const qty = toInt(rawQty ?? state.quantities[id]);
    const limit = limitFor(state, id);
    return limit === null ? qty : Math.min(qty, limit);
  }

  function spentForQuantities(state, quantities) {
    return Object.entries(quantities || {}).reduce((sum, [id, qty]) => sum + costFor(state, id) * qtyFor(state, id, qty), 0);
  }

  function currentBudget() {
    return valueOf('#eventCoinHeld') + valueOf('#eventCoinBonus') + valueOf('#eventCoinCurrentWeek') * valueOf('#eventCoinWeekly');
  }

  function fullBudget() {
    return valueOf('#eventCoinHeld') + valueOf('#eventCoinBonus') + valueOf('#eventCoinTotalWeeks') * valueOf('#eventCoinWeekly');
  }

  function shopLimitCost(state, shop) {
    return items
      .filter((item) => item.shop === shop)
      .reduce((sum, item) => sum + costFor(state, item.id) * (limitFor(state, item.id) ?? 0), 0);
  }

  function selectedCost(state) {
    return items.reduce((sum, item) => sum + costFor(state, item.id) * qtyFor(state, item.id), 0);
  }

  function statusText(left) {
    return left >= 0 ? `${nf.format(left)} 남음` : `${nf.format(Math.abs(left))} 부족`;
  }

  function metric(label, value, detail, good) {
    return `<div class="event-roadmap-metric ${good ? 'good' : 'bad'}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`;
  }

  function ensureRoadmapCard() {
    const grid = document.querySelector('.event-shop-grid');
    if (!grid || document.querySelector('#eventCoinRoadmapCard')) return;
    const card = document.createElement('article');
    card.id = 'eventCoinRoadmapCard';
    card.className = 'event-roadmap-card';
    card.innerHTML = '<div class="event-roadmap-head"><strong>사전 계획 요약</strong><span>현재주차/시즌전체 예산 비교</span></div><div class="event-roadmap-grid" id="eventCoinRoadmapGrid"></div>';
    grid.insertAdjacentElement('afterend', card);
  }

  function renderRoadmap() {
    ensureRoadmapCard();
    const wrap = document.querySelector('#eventCoinRoadmapGrid');
    if (!wrap) return;
    const state = mergedState();
    const spent = selectedCost(state);
    const currentLeft = currentBudget() - spent;
    const fullLeft = fullBudget() - spent;
    const upgradeAll = shopLimitCost(state, 'upgrade');
    const growthAll = shopLimitCost(state, 'growth');

    wrap.innerHTML = [
      metric('현재주차 기준', statusText(currentLeft), `예산 ${nf.format(currentBudget())} / 구매 ${nf.format(spent)}`, currentLeft >= 0),
      metric('시즌 전체 기준', statusText(fullLeft), `예산 ${nf.format(fullBudget())} / 구매 ${nf.format(spent)}`, fullLeft >= 0),
      metric('강화 전체 한도', nf.format(upgradeAll), `전체 예산 대비 ${statusText(fullBudget() - upgradeAll)}`, fullBudget() >= upgradeAll),
      metric('성장 전체 한도', nf.format(growthAll), `전체 예산 대비 ${statusText(fullBudget() - growthAll)}`, fullBudget() >= growthAll)
    ].join('');
  }

  function renderPresetBudgets() {
    const state = mergedState();
    presets.forEach((preset) => {
      const button = document.querySelector(`[data-event-coin-preset="${preset.id}"]`);
      const card = button?.closest('.event-preset');
      if (!card) return;
      const cost = spentForQuantities(state, preset.quantities);
      const currentOk = currentBudget() >= cost;
      const fullOk = fullBudget() >= cost;
      let budget = card.querySelector('.event-preset-budget');
      if (!budget) {
        budget = document.createElement('span');
        budget.className = 'event-preset-budget';
        card.querySelector('div')?.append(budget);
      }
      budget.innerHTML = `<em>비용 ${nf.format(cost)}</em><em class="${currentOk ? 'good' : 'bad'}">현재 ${currentOk ? '가능' : '부족'}</em><em class="${fullOk ? 'good' : 'bad'}">전체 ${fullOk ? '가능' : '부족'}</em>`;
    });
  }

  let queued = false;
  function scheduleRender() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      migrateWeeklyCoins();
      installStyles();
      renderRoadmap();
      renderPresetBudgets();
    });
  }

  function boot() {
    loadAuxiliaryScripts();
    migrateWeeklyCoins();
    installStyles();
    scheduleRender();

    document.addEventListener('input', (event) => {
      if (event.target.closest?.('.event-coinshop-panel')) scheduleRender();
    }, true);
    document.addEventListener('change', (event) => {
      if (event.target.closest?.('.event-coinshop-panel')) scheduleRender();
    }, true);
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('.event-coinshop-panel,[data-view-button="eventCoinshop"]')) setTimeout(scheduleRender, 0);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();