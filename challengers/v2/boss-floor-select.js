(() => {
  'use strict';

  if (window.__kirakiBossFloorSelectLoaded) return;
  window.__kirakiBossFloorSelectLoaded = true;

  function installStyles() {
    if (document.querySelector('#kirakiBossFloorSelectStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiBossFloorSelectStyles';
    style.textContent = `
.boss-floor-toggle{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 10px;flex:0 0 auto;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:10px;background:color-mix(in srgb,var(--accent2) 52%,var(--surface));color:var(--accent);font-size:.74rem;font-weight:900;white-space:nowrap;cursor:pointer;user-select:none}.boss-floor-toggle:hover{border-color:var(--accent);background:var(--accent2)}.boss-floor-toggle.checked{border-color:var(--accent);background:var(--accent);color:#fff}.boss-floor-toggle.indeterminate{border-color:color-mix(in srgb,var(--accent) 58%,var(--line));background:color-mix(in srgb,var(--accent2) 75%,var(--surface));color:var(--accent)}.boss-floor-toggle small{color:inherit;font-size:.68rem;font-weight:900;opacity:.82}
@media(max-width:700px){.boss-floor-toggle{margin-left:auto}.boss-group-toggle + .boss-floor-toggle{margin-left:0}}
@media(max-width:430px){.boss-floor-toggle{width:100%;order:3}.boss-group-toggle{order:4}}
`;
    document.head.append(style);
  }

  function idsAtOrBelow(points) {
    return DATA.bossMissions.filter((boss) => boss.points <= points).map((boss) => boss.id);
  }

  function selectedSet() {
    return new Set(activeProfile().clearedBossIds || []);
  }

  function buttonState(points) {
    const ids = idsAtOrBelow(points);
    const selected = selectedSet();
    const completed = ids.filter((id) => selected.has(id)).length;
    return {
      ids,
      completed,
      all: ids.length > 0 && completed === ids.length,
      partial: completed > 0 && completed < ids.length
    };
  }

  function syncButton(button) {
    const points = Number(button.dataset.bossFloorToggle);
    const state = buttonState(points);
    const label = button.querySelector('[data-boss-floor-label]');
    button.classList.toggle('checked', state.all);
    button.classList.toggle('indeterminate', state.partial);
    button.setAttribute('aria-pressed', String(state.all));
    button.title = state.all
      ? `${number.format(points)}점 이하 보스 미션 전체 해제`
      : `${number.format(points)}점 이하 보스 미션 전체 선택`;
    if (label) label.textContent = state.all ? '이하 해제' : '이하 선택';
  }

  function syncButtons() {
    document.querySelectorAll('[data-boss-floor-toggle]').forEach(syncButton);
  }

  function installButtons() {
    document.querySelectorAll('[data-boss-group]').forEach((group) => {
      const points = Number(group.dataset.points);
      const summary = group.querySelector('summary');
      if (!summary || summary.querySelector('[data-boss-floor-toggle]')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'boss-floor-toggle';
      button.dataset.bossFloorToggle = String(points);
      button.innerHTML = `<span data-boss-floor-label>이하 선택</span><small>${number.format(points)}점</small>`;

      const groupToggle = summary.querySelector('[data-boss-group-toggle-control]');
      if (groupToggle) summary.insertBefore(button, groupToggle);
      else summary.append(button);
    });
    syncButtons();
  }

  function applyFloor(points) {
    const state = buttonState(points);
    let nextIds = [...activeProfile().clearedBossIds];

    if (state.all) {
      state.ids.forEach((id) => {
        nextIds = removeBossAndHigher(nextIds, id);
      });
    } else {
      nextIds = normalizeBosses([...nextIds, ...state.ids]);
    }

    patchProfile(
      { clearedBossIds: nextIds },
      state.all ? `${number.format(points)}점 이하 전체 해제됨` : `${number.format(points)}점 이하 전체 체크됨`
    );
    render();
  }

  function bindEvents() {
    el.bossGroups?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-boss-floor-toggle]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      applyFloor(Number(button.dataset.bossFloorToggle));
    });
  }

  function levelCoinReward(level) {
    if (level === 260) return 3000;
    if (level <= 269) return 300;
    if (level <= 274) return 600;
    if (level <= 279) return 900;
    if (level <= 284) return 1200;
    if (level <= 289) return 1500;
    return 2500;
  }

  function levelCoinTotal(level) {
    const capped = Math.min(Math.max(Math.round(Number(level) || 260), 260), 290);
    let total = 0;
    for (let current = 260; current <= capped; current += 1) total += levelCoinReward(current);
    return total;
  }

  function parseCoinText(value) {
    return Number(String(value || '').replace(/[^0-9-]/g, '')) || 0;
  }

  function setTextIfChanged(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  let coinCorrectionQueued = false;
  let coinCorrectionActive = false;

  function correctCoinShopLevelCoins() {
    if (coinCorrectionActive) return;
    const levelNode = document.querySelector('#coinShopLevelCoins');
    const totalNode = document.querySelector('#coinShopEstimatedTotal');
    const normalSummary = document.querySelector('#coinShopNormalSummary');
    if (!levelNode || !totalNode || typeof activeProfile !== 'function') return;

    coinCorrectionActive = true;
    try {
      const correctLevelCoins = levelCoinTotal(activeProfile().level);
      const bossCoins = parseCoinText(document.querySelector('#coinShopBossCoins')?.textContent);
      const seasonCoins = parseCoinText(document.querySelector('#coinShopSeasonCoins')?.textContent);
      const adjustCoins = parseCoinText(document.querySelector('#coinShopAdjustCoins')?.textContent);
      const correctTotal = correctLevelCoins + bossCoins + seasonCoins + adjustCoins;

      setTextIfChanged(levelNode, number.format(correctLevelCoins));
      setTextIfChanged(totalNode, number.format(correctTotal));

      if (normalSummary) {
        const spent = parseCoinText(normalSummary.textContent.split('/')[0]);
        const left = correctTotal - spent;
        setTextIfChanged(normalSummary, `${number.format(spent)} / ${number.format(left)}`);
        normalSummary.classList.toggle('negative', left < 0);
      }
    } finally {
      coinCorrectionActive = false;
    }
  }

  function scheduleCoinShopLevelCorrection() {
    if (coinCorrectionQueued) return;
    coinCorrectionQueued = true;
    setTimeout(() => {
      coinCorrectionQueued = false;
      correctCoinShopLevelCoins();
    }, 0);
  }

  function installCoinShopLevelCoinCorrection() {
    if (window.__kirakiCoinShopLevelCoinCorrectionInstalled) return;
    window.__kirakiCoinShopLevelCoinCorrectionInstalled = true;

    if (typeof render === 'function') {
      const baseRender = render;
      render = function levelCoinAwareRender(...args) {
        const result = baseRender.apply(this, args);
        scheduleCoinShopLevelCorrection();
        return result;
      };
    }

    if (typeof setView === 'function') {
      const baseSetView = setView;
      setView = function levelCoinAwareSetView(...args) {
        const result = baseSetView.apply(this, args);
        scheduleCoinShopLevelCorrection();
        return result;
      };
    }

    document.addEventListener('input', (event) => {
      if (event.target.closest?.('.coinshop-panel,#levelInput')) scheduleCoinShopLevelCorrection();
    }, true);
    document.addEventListener('change', (event) => {
      if (event.target.closest?.('.coinshop-panel,#levelInput,[data-boss-checkbox]')) scheduleCoinShopLevelCorrection();
    }, true);
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('.coinshop-panel,[data-boss-floor-toggle],[data-apply-preset]')) scheduleCoinShopLevelCorrection();
    }, true);

    scheduleCoinShopLevelCorrection();
    setTimeout(scheduleCoinShopLevelCorrection, 120);
  }

  function boot() {
    installStyles();
    installButtons();
    bindEvents();
    installCoinShopLevelCoinCorrection();

    if (typeof renderBosses === 'function' && !window.__kirakiBossFloorRenderWrapped) {
      window.__kirakiBossFloorRenderWrapped = true;
      const baseRenderBosses = renderBosses;
      renderBosses = function floorAwareRenderBosses(forceOpen = false) {
        const result = baseRenderBosses(forceOpen);
        installButtons();
        syncButtons();
        scheduleCoinShopLevelCorrection();
        return result;
      };
    }

    syncButtons();
    scheduleCoinShopLevelCorrection();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
