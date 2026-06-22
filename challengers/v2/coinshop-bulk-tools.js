(() => {
  'use strict';

  if (window.__kirakiCoinShopBulkToolsLoaded) return;
  window.__kirakiCoinShopBulkToolsLoaded = true;

  const NORMAL_BOSS_COINS = new Map([
    [100, 100], [200, 100], [250, 200], [300, 200], [400, 200], [500, 200],
    [1000, 300], [1500, 400], [2000, 600], [2500, 600], [3000, 1000],
    [5000, 1200], [6000, 1400], [7000, 2000], [9000, 3000]
  ]);
  const SPECIAL_BOSS_COINS = new Map([[5000, 10], [6000, 20], [7000, 30], [9000, 60]]);
  const nf = new Intl.NumberFormat('ko-KR');
  let refreshQueued = false;
  let bulkRunning = false;

  const esc = typeof escapeHtml === 'function'
    ? escapeHtml
    : (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function installStyles() {
    if (document.querySelector('#kirakiCoinShopBulkToolsStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiCoinShopBulkToolsStyles';
    style.textContent = `
.coinshop-quick-tools{display:grid;gap:10px;padding:13px;border:1px solid color-mix(in srgb,#7c3aed 24%,var(--line));border-radius:13px;background:linear-gradient(135deg,color-mix(in srgb,#f5f3ff 70%,var(--surface)),var(--surface))}.coinshop-quick-tools-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.coinshop-quick-tools-head strong{font-size:.92rem;font-weight:950;line-height:1.35}.coinshop-quick-tools-head span{color:var(--muted);font-size:.7rem;font-weight:850;line-height:1.45}.coinshop-quick-tools-actions{display:flex;flex-wrap:wrap;gap:7px}.coinshop-quick-tools-actions .button{min-height:34px}.coinshop-bulk-bar{display:grid;gap:9px;padding:12px;border:1px solid var(--line);border-radius:13px;background:var(--soft)}.coinshop-bulk-bar-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.coinshop-bulk-bar-head strong{font-size:.9rem;font-weight:950}.coinshop-bulk-bar-head span{color:var(--muted);font-size:.7rem;font-weight:850}.coinshop-bulk-bar-actions{display:flex;flex-wrap:wrap;gap:7px}.coinshop-qty.bulk-ready{grid-template-columns:32px 68px 32px 42px 42px auto}.coinshop-quick-qty{min-height:34px!important;padding:0 8px!important;font-size:.67rem!important}.coinshop-boss-detail{display:grid;gap:10px;margin-top:12px;padding:12px;border:1px solid color-mix(in srgb,#38bdf8 34%,var(--line));border-radius:13px;background:color-mix(in srgb,#eff6ff 62%,var(--surface))}.coinshop-boss-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.coinshop-boss-detail-head strong{font-size:.9rem;font-weight:950;line-height:1.35}.coinshop-boss-detail-head span{color:#036985;font-size:.7rem;font-weight:900}.coinshop-boss-detail-list{display:flex;flex-wrap:wrap;gap:6px}.coinshop-boss-chip{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:4px 8px;border:1px solid var(--line);border-radius:999px;background:var(--surface);font-size:.7rem;font-weight:850}.coinshop-boss-chip strong{font-size:.7rem}.coinshop-boss-chip em{color:#036985;font-style:normal;font-weight:950}.coinshop-boss-empty{color:var(--muted);font-size:.76rem;font-weight:800;line-height:1.55}.boss-coin-sync-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin:12px 0;padding:12px;border:1px solid color-mix(in srgb,#38bdf8 32%,var(--line));border-radius:13px;background:linear-gradient(135deg,color-mix(in srgb,#eff6ff 72%,var(--surface)),var(--surface))}.boss-coin-sync-copy{display:grid;gap:5px}.boss-coin-sync-copy strong{font-size:.9rem;font-weight:950}.boss-coin-sync-copy span{color:var(--muted);font-size:.74rem;font-weight:850;line-height:1.45}.boss-coin-sync-metrics{display:flex;flex-wrap:wrap;gap:6px}.boss-coin-sync-metrics em{display:inline-flex;align-items:center;min-height:25px;padding:3px 8px;border-radius:999px;background:var(--surface);border:1px solid var(--line);color:var(--ink);font-style:normal;font-size:.68rem;font-weight:950}.boss-coin-sync-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}@media(max-width:900px){.coinshop-qty.bulk-ready{grid-template-columns:34px minmax(66px,1fr) 34px 42px 42px}.coinshop-line-total{grid-column:1/-1}.boss-coin-sync-card{grid-template-columns:1fr}.boss-coin-sync-actions{justify-content:stretch}.boss-coin-sync-actions .button{width:100%}}@media(max-width:520px){.coinshop-quick-tools-head,.coinshop-bulk-bar-head,.coinshop-boss-detail-head{display:grid}.coinshop-quick-tools-actions,.coinshop-bulk-bar-actions{display:grid;grid-template-columns:1fr 1fr}.coinshop-quick-tools-actions .button,.coinshop-bulk-bar-actions .button{width:100%}.coinshop-qty.bulk-ready{grid-template-columns:34px minmax(64px,1fr) 34px}.coinshop-quick-qty{grid-row:2}.coinshop-boss-detail-list{display:grid}.coinshop-boss-chip{justify-content:space-between;border-radius:10px}.boss-coin-sync-metrics{display:grid;grid-template-columns:1fr 1fr}.boss-coin-sync-metrics em{justify-content:center}}
`;
    document.head.append(style);
  }

  function data() {
    return window.CHALLENGERS_DATA || (typeof DATA !== 'undefined' ? DATA : null);
  }

  function profile() {
    try { return typeof activeProfile === 'function' ? activeProfile() : null; } catch { return null; }
  }

  function bossName(boss) {
    return `${boss.difficulty} ${boss.shortBoss || boss.boss}`;
  }

  function selectedBosses() {
    const source = data();
    const current = profile();
    if (!source || !current) return [];
    const byId = new Map((source.bossMissions || []).map((boss) => [boss.id, boss]));
    return [...new Set(current.clearedBossIds || [])]
      .map((id) => byId.get(id))
      .filter(Boolean)
      .sort((a, b) => a.points - b.points || bossName(a).localeCompare(bossName(b), 'ko'));
  }

  function bossCoinData() {
    const bosses = selectedBosses().map((boss) => ({
      ...boss,
      normalCoins: NORMAL_BOSS_COINS.get(Number(boss.points) || 0) || 0,
      specialCoins: SPECIAL_BOSS_COINS.get(Number(boss.points) || 0) || 0
    }));
    return {
      bosses,
      normal: bosses.reduce((sum, boss) => sum + boss.normalCoins, 0),
      special: bosses.reduce((sum, boss) => sum + boss.specialCoins, 0)
    };
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

  function currentLevel() {
    return Math.min(Math.max(Math.round(Number(profile()?.level) || Number(document.querySelector('#levelInput')?.value) || 260), 260), 290);
  }

  function parseNumber(text) {
    return Number(String(text || '').replace(/[^0-9-]/g, '')) || 0;
  }

  function dispatchInput(input) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setManualNormalBudget(value) {
    const input = document.querySelector('#coinShopNormalBudget');
    if (!input) return;
    input.value = String(Math.max(0, Math.round(Number(value) || 0)));
    dispatchInput(input);
  }

  function ensureQuickTools() {
    const income = document.querySelector('.coinshop-income-card');
    if (!income || document.querySelector('#coinShopQuickTools')) return;
    const tools = document.createElement('div');
    tools.id = 'coinShopQuickTools';
    tools.className = 'coinshop-quick-tools';
    tools.innerHTML = `
      <div class="coinshop-quick-tools-head">
        <div><strong>코인 수급 프리셋</strong><span>보스는 현재 보스체크 상태 그대로 계산합니다.</span></div>
        <span>레벨·시즌·보스 분리 계산</span>
      </div>
      <div class="coinshop-quick-tools-actions">
        <button type="button" class="button secondary small" data-coinshop-season-all>시즌 미션 올클</button>
        <button type="button" class="button ghost small" data-coinshop-season-reset>시즌 미션 초기화</button>
        <button type="button" class="button primary small" data-coinshop-full-nonboss>보스 제외 풀수급</button>
        <button type="button" class="button ghost small" data-coinshop-refresh-boss>보스체크 반영</button>
      </div>`;
    const seasonPanel = income.querySelector('.coinshop-season-panel');
    if (seasonPanel) income.insertBefore(tools, seasonPanel);
    else income.append(tools);
  }

  function ensureBulkBar() {
    const tabs = document.querySelector('.coinshop-category-tabs');
    if (!tabs || document.querySelector('#coinShopBulkBar')) return;
    const bar = document.createElement('div');
    bar.id = 'coinShopBulkBar';
    bar.className = 'coinshop-bulk-bar';
    bar.innerHTML = `
      <div class="coinshop-bulk-bar-head"><strong>구매 수량 빠른 조정</strong><span>제한 수량이 있는 품목만 MAX가 적용됩니다.</span></div>
      <div class="coinshop-bulk-bar-actions">
        <button type="button" class="button secondary small" data-coinshop-tab-max>현재 탭 MAX</button>
        <button type="button" class="button ghost small" data-coinshop-tab-min>현재 탭 MIN</button>
        <button type="button" class="button secondary small" data-coinshop-all-max>전체 MAX</button>
        <button type="button" class="button ghost small" data-coinshop-all-min>전체 MIN</button>
      </div>`;
    tabs.insertAdjacentElement('afterend', bar);
  }

  function ensureBossDetail() {
    const incomeMain = document.querySelector('.coinshop-income-main');
    if (!incomeMain || document.querySelector('#coinShopBossDetail')) return;
    const detail = document.createElement('div');
    detail.id = 'coinShopBossDetail';
    detail.className = 'coinshop-boss-detail';
    detail.innerHTML = `
      <div class="coinshop-boss-detail-head"><strong>보스체크 코인 상세</strong><span id="coinShopBossDetailTotal">0 / 0</span></div>
      <div class="coinshop-boss-detail-list" id="coinShopBossDetailList"></div>
      <div class="coinshop-quick-tools-actions"><button type="button" class="button ghost small" data-go-boss-check>보스체크 열기</button></div>`;
    incomeMain.insertAdjacentElement('afterend', detail);
  }

  function renderBossDetail() {
    const list = document.querySelector('#coinShopBossDetailList');
    const total = document.querySelector('#coinShopBossDetailTotal');
    if (!list || !total) return;
    const info = bossCoinData();
    total.textContent = `일반 ${nf.format(info.normal)} · 상급 ${nf.format(info.special)}`;
    if (!info.bosses.length) {
      list.innerHTML = '<span class="coinshop-boss-empty">보스체크에서 미션을 선택하면 보스별 코인이 여기에 표시됩니다.</span>';
      return;
    }
    list.innerHTML = info.bosses.map((boss) => `
      <span class="coinshop-boss-chip"><strong>${esc(bossName(boss))}</strong><em>+${nf.format(boss.normalCoins)}</em>${boss.specialCoins ? `<em>상급 +${nf.format(boss.specialCoins)}</em>` : ''}</span>`).join('');
  }

  function enhanceQuantityRows() {
    document.querySelectorAll('.coinshop-qty').forEach((row) => {
      if (row.querySelector('[data-coinshop-row-max]')) return;
      const input = row.querySelector('[data-coinshop-qty]');
      const plus = row.querySelector('[data-coinshop-plus]');
      if (!input || !plus) return;
      row.classList.add('bulk-ready');
      const min = document.createElement('button');
      min.type = 'button';
      min.className = 'coinshop-quick-qty';
      min.dataset.coinshopRowMin = input.dataset.coinshopQty;
      min.textContent = 'MIN';
      min.setAttribute('aria-label', '구매 수량 0으로 설정');
      const max = document.createElement('button');
      max.type = 'button';
      max.className = 'coinshop-quick-qty';
      max.dataset.coinshopRowMax = input.dataset.coinshopQty;
      max.textContent = 'MAX';
      max.setAttribute('aria-label', '구매 수량 최대로 설정');
      plus.insertAdjacentElement('afterend', min);
      min.insertAdjacentElement('afterend', max);
    });
  }

  function desiredQuantity(input, mode) {
    if (mode === 'min') return 0;
    const max = Number(input.getAttribute('max'));
    if (Number.isFinite(max) && max >= 0) return max;
    return Math.max(0, Math.round(Number(input.value) || 0));
  }

  function setInputQuantity(input, mode) {
    const value = desiredQuantity(input, mode);
    input.value = String(value);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setCurrentListQuantities(mode, done, guard = 0) {
    if (guard > 80) { done?.(); return; }
    const inputs = [...document.querySelectorAll('#coinShopList [data-coinshop-qty]')];
    const target = inputs.find((input) => Math.round(Number(input.value) || 0) !== desiredQuantity(input, mode));
    if (!target) {
      done?.();
      scheduleRefresh();
      return;
    }
    setInputQuantity(target, mode);
    setTimeout(() => setCurrentListQuantities(mode, done, guard + 1), 0);
  }

  function activeCategory() {
    return document.querySelector('[data-coinshop-category].active')?.dataset.coinshopCategory || 'normal';
  }

  function selectCategory(category) {
    const button = document.querySelector(`[data-coinshop-category="${category}"]`);
    if (button && !button.classList.contains('active')) button.click();
  }

  function setAllCategoryQuantities(mode) {
    if (bulkRunning) return;
    bulkRunning = true;
    const initial = activeCategory();
    const categories = ['normal', 'special'];
    let index = 0;
    function nextCategory() {
      if (index >= categories.length) {
        selectCategory(initial);
        bulkRunning = false;
        scheduleRefresh();
        if (typeof toast === 'function') toast(mode === 'max' ? '전체 코인샵 수량을 MAX로 맞췄습니다.' : '전체 코인샵 수량을 MIN으로 맞췄습니다.');
        return;
      }
      selectCategory(categories[index]);
      index += 1;
      setTimeout(() => setCurrentListQuantities(mode, nextCategory), 0);
    }
    nextCategory();
  }

  function setSeasonMissions(complete, done, guard = 0) {
    if (guard > 80) { done?.(); return; }
    const selects = [...document.querySelectorAll('#coinShopSeasonMissions [data-season-mission]')];
    const target = selects.find((select) => {
      const wanted = complete ? select.options[select.options.length - 1]?.value : '-1';
      return select.value !== wanted;
    });
    if (!target) {
      done?.();
      scheduleRefresh();
      return;
    }
    target.value = complete ? target.options[target.options.length - 1].value : '-1';
    target.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(() => setSeasonMissions(complete, done, guard + 1), 0);
  }

  function applyFullNonBossPreset() {
    const level = currentLevel();
    const levelGap = Math.max(0, levelCoinTotal(290) - levelCoinTotal(level));
    setManualNormalBudget(levelGap);
    setSeasonMissions(true, () => {
      scheduleRefresh();
      if (typeof toast === 'function') toast(`보스 제외 풀수급을 적용했습니다. Lv.${level}→290 차액 ${nf.format(levelGap)}코인을 보정했습니다.`);
    });
  }

  function ensureBossCoinSyncCard() {
    const filter = document.querySelector('.boss-filter-panel');
    if (!filter || document.querySelector('#bossCoinSyncCard')) return;
    const card = document.createElement('article');
    card.id = 'bossCoinSyncCard';
    card.className = 'boss-coin-sync-card';
    card.innerHTML = `
      <div class="boss-coin-sync-copy">
        <strong>보스 코인샵 연동</strong>
        <span>체크한 보스 미션 기준으로 챌린저스 코인과 상급 코인을 계산합니다.</span>
        <div class="boss-coin-sync-metrics" id="bossCoinSyncMetrics"></div>
      </div>
      <div class="boss-coin-sync-actions">
        <button type="button" class="button secondary small" data-boss-sync-refresh>계산 새로고침</button>
        <button type="button" class="button primary small" data-go-coinshop>코인샵에서 보기</button>
      </div>`;
    filter.insertAdjacentElement('afterend', card);
  }

  function renderBossCoinSyncCard() {
    const metrics = document.querySelector('#bossCoinSyncMetrics');
    if (!metrics) return;
    const info = bossCoinData();
    metrics.innerHTML = `
      <em>체크 ${nf.format(info.bosses.length)}종</em>
      <em>챌섭 ${nf.format(info.normal)}개</em>
      <em>상급 ${nf.format(info.special)}개</em>`;
  }

  function renderCorrectCoinTotals() {
    const levelNode = document.querySelector('#coinShopLevelCoins');
    const totalNode = document.querySelector('#coinShopEstimatedTotal');
    const normalSummary = document.querySelector('#coinShopNormalSummary');
    if (!levelNode || !totalNode) return;
    const levelCoins = levelCoinTotal(currentLevel());
    const boss = bossCoinData();
    const seasonCoins = parseNumber(document.querySelector('#coinShopSeasonCoins')?.textContent);
    const adjustCoins = parseNumber(document.querySelector('#coinShopAdjustCoins')?.textContent);
    const spent = parseNumber((normalSummary?.textContent || '').split('/')[0]);
    const total = levelCoins + boss.normal + seasonCoins + adjustCoins;
    levelNode.textContent = nf.format(levelCoins);
    document.querySelector('#coinShopBossCoins') && (document.querySelector('#coinShopBossCoins').textContent = nf.format(boss.normal));
    document.querySelector('#coinShopBossSpecialCoins') && (document.querySelector('#coinShopBossSpecialCoins').textContent = nf.format(boss.special));
    totalNode.textContent = nf.format(total);
    if (normalSummary) {
      const left = total - spent;
      normalSummary.textContent = `${nf.format(spent)} / ${nf.format(left)}`;
      normalSummary.classList.toggle('negative', left < 0);
    }
    const meta = document.querySelector('#coinShopEstimatedMeta');
    if (meta) meta.textContent = `시즌 미션 ${document.querySelectorAll('#coinShopSeasonMissions select:not([value="-1"])').length || ''}개 · 상급 ${nf.format(boss.special)}개`;
  }

  function refresh() {
    ensureQuickTools();
    ensureBulkBar();
    ensureBossDetail();
    ensureBossCoinSyncCard();
    enhanceQuantityRows();
    renderBossDetail();
    renderBossCoinSyncCard();
    renderCorrectCoinTotals();
  }

  function scheduleRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      refresh();
    });
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const rowMax = event.target.closest?.('[data-coinshop-row-max]');
      const rowMin = event.target.closest?.('[data-coinshop-row-min]');
      if (rowMax || rowMin) {
        const id = (rowMax || rowMin).dataset.coinshopRowMax || (rowMax || rowMin).dataset.coinshopRowMin;
        const input = document.querySelector(`[data-coinshop-qty="${CSS.escape(id)}"]`);
        if (input) setInputQuantity(input, rowMax ? 'max' : 'min');
        scheduleRefresh();
        return;
      }
      if (event.target.closest?.('[data-coinshop-tab-max]')) return setCurrentListQuantities('max', () => toast?.('현재 탭 수량을 MAX로 맞췄습니다.'));
      if (event.target.closest?.('[data-coinshop-tab-min]')) return setCurrentListQuantities('min', () => toast?.('현재 탭 수량을 MIN으로 맞췄습니다.'));
      if (event.target.closest?.('[data-coinshop-all-max]')) return setAllCategoryQuantities('max');
      if (event.target.closest?.('[data-coinshop-all-min]')) return setAllCategoryQuantities('min');
      if (event.target.closest?.('[data-coinshop-season-all]')) return setSeasonMissions(true, () => toast?.('시즌 미션을 올클 기준으로 반영했습니다.'));
      if (event.target.closest?.('[data-coinshop-season-reset]')) return setSeasonMissions(false, () => toast?.('시즌 미션 입력을 초기화했습니다.'));
      if (event.target.closest?.('[data-coinshop-full-nonboss]')) return applyFullNonBossPreset();
      if (event.target.closest?.('[data-coinshop-refresh-boss],[data-boss-sync-refresh]')) {
        if (typeof render === 'function') render();
        scheduleRefresh();
        return toast?.('보스체크 기준 코인을 다시 계산했습니다.');
      }
      if (event.target.closest?.('[data-go-boss-check]')) return typeof setView === 'function' && setView('bosses', { scroll: true });
      if (event.target.closest?.('[data-go-coinshop]')) return typeof setView === 'function' && setView('coinshop', { scroll: true });
    }, true);

    document.addEventListener('change', (event) => {
      if (event.target.closest?.('[data-boss-checkbox],.coinshop-panel,#levelInput')) scheduleRefresh();
    }, true);
    document.addEventListener('input', (event) => {
      if (event.target.closest?.('.coinshop-panel,#levelInput')) scheduleRefresh();
    }, true);
  }

  function wrapRenderers() {
    if (typeof render === 'function' && !window.__kirakiCoinShopBulkRenderWrapped) {
      window.__kirakiCoinShopBulkRenderWrapped = true;
      const baseRender = render;
      render = function coinShopBulkAwareRender(...args) {
        const result = baseRender.apply(this, args);
        scheduleRefresh();
        return result;
      };
    }
    if (typeof renderBosses === 'function' && !window.__kirakiCoinShopBulkBossRenderWrapped) {
      window.__kirakiCoinShopBulkBossRenderWrapped = true;
      const baseRenderBosses = renderBosses;
      renderBosses = function coinShopBulkAwareBossRender(...args) {
        const result = baseRenderBosses.apply(this, args);
        scheduleRefresh();
        return result;
      };
    }
    if (typeof setView === 'function' && !window.__kirakiCoinShopBulkSetViewWrapped) {
      window.__kirakiCoinShopBulkSetViewWrapped = true;
      const baseSetView = setView;
      setView = function coinShopBulkAwareSetView(...args) {
        const result = baseSetView.apply(this, args);
        scheduleRefresh();
        return result;
      };
    }
    if (typeof setAdminUnlocked === 'function' && !window.__kirakiCoinShopBulkAdminWrapped) {
      window.__kirakiCoinShopBulkAdminWrapped = true;
      const baseSetAdminUnlocked = setAdminUnlocked;
      setAdminUnlocked = function coinShopBulkAwareAdmin(...args) {
        const result = baseSetAdminUnlocked.apply(this, args);
        scheduleRefresh();
        return result;
      };
    }
  }

  function boot() {
    installStyles();
    bindEvents();
    wrapRenderers();
    scheduleRefresh();
    setTimeout(scheduleRefresh, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
