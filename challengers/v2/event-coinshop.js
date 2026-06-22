(() => {
  'use strict';

  if (window.__kirakiEventCoinShopLoaded) return;
  window.__kirakiEventCoinShopLoaded = true;

  const STORAGE_KEY = 'kiraki-event-coinshop:v1';
  const VIEW_ID = 'eventCoinshop';
  const nf = typeof number !== 'undefined' ? number : new Intl.NumberFormat('ko-KR');
  const esc = typeof escapeHtml === 'function'
    ? escapeHtml
    : (value) => String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const DEFAULT_ITEMS = [
    { id: 'sol-erda', name: '솔 에르다', group: 'HEXA', cost: 2000, limit: 5, priority: true },
    { id: 'sol-erda-fragment', name: '솔 에르다 조각', group: 'HEXA', cost: 50, limit: 500, priority: true },
    { id: 'exp-coupon', name: '경험치 쿠폰', group: '성장', cost: 100, limit: 30 },
    { id: 'vip-buff', name: 'VIP 버프', group: '성장', cost: 30, limit: null },
    { id: 'symbol-selector', name: '심볼/성장 선택권', group: '성장', cost: 100, limit: 100 },
    { id: 'black-cube', name: '블랙 큐브', group: '큐브', cost: 100, limit: 20 },
    { id: 'additional-cube', name: '에디셔널 큐브', group: '큐브', cost: 150, limit: 20 },
    { id: 'flame', name: '환생의 불꽃', group: '강화', cost: 50, limit: 50 },
    { id: 'starforce-scroll', name: '스타포스/주문서 선택권', group: '강화', cost: 1000, limit: 5 }
  ];

  const PRESETS = [
    {
      id: 'hexa-first',
      name: 'HEXA 우선',
      note: '솔 에르다와 조각을 먼저 담습니다.',
      quantities: { 'sol-erda': 5, 'sol-erda-fragment': 300 }
    },
    {
      id: 'growth-first',
      name: '육성 우선',
      note: '경험치와 성장 재화를 먼저 담습니다.',
      quantities: { 'exp-coupon': 30, 'vip-buff': 40, 'symbol-selector': 60 }
    },
    {
      id: 'upgrade-first',
      name: '스펙업 우선',
      note: '큐브와 강화 재화를 먼저 담습니다.',
      quantities: { 'black-cube': 20, 'additional-cube': 20, 'flame': 50, 'starforce-scroll': 2 }
    },
    {
      id: 'balanced',
      name: '균형안',
      note: '성장과 강화 재화를 절반씩 잡습니다.',
      quantities: { 'sol-erda': 3, 'sol-erda-fragment': 150, 'exp-coupon': 20, 'black-cube': 10, 'flame': 30 }
    }
  ];

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const positiveInt = (value, fallback = 0) => Math.max(0, Math.round(Number(value) || fallback));
  let saveTimer = null;

  function defaultItem(item) {
    return { ...item, cost: positiveInt(item.cost), limit: item.limit === null ? null : positiveInt(item.limit), qty: 0, fixed: true };
  }

  function defaultState() {
    return {
      currentWeek: 1,
      totalWeeks: 12,
      weeklyCoins: 2000,
      heldCoins: 0,
      bonusCoins: 0,
      budgetMode: 'current',
      items: DEFAULT_ITEMS.map(defaultItem),
      memo: ''
    };
  }

  function normalizeItem(raw, fallback = {}) {
    const id = typeof raw?.id === 'string' && raw.id ? raw.id : fallback.id;
    if (!id) return null;
    const limitSource = raw?.limit === '' || raw?.limit === null || raw?.limit === undefined ? null : raw.limit;
    const limit = limitSource === null ? null : positiveInt(limitSource);
    const item = {
      id,
      name: String(raw?.name || fallback.name || '직접 입력').slice(0, 40),
      group: String(raw?.group || fallback.group || '기타').slice(0, 20),
      cost: positiveInt(raw?.cost ?? fallback.cost),
      limit,
      qty: positiveInt(raw?.qty),
      priority: Boolean(raw?.priority ?? fallback.priority),
      fixed: Boolean(raw?.fixed ?? fallback.fixed)
    };
    if (item.limit !== null) item.qty = Math.min(item.qty, item.limit);
    return item;
  }

  function loadState() {
    const base = defaultState();
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return base;
      const savedItems = Array.isArray(parsed.items) ? parsed.items : [];
      const savedById = new Map(savedItems.map((item) => [item.id, item]));
      const mergedDefaults = DEFAULT_ITEMS
        .map((item) => normalizeItem({ ...defaultItem(item), ...(savedById.get(item.id) || {}) }, defaultItem(item)))
        .filter(Boolean);
      const defaultIds = new Set(DEFAULT_ITEMS.map((item) => item.id));
      const customItems = savedItems
        .filter((item) => item?.id && !defaultIds.has(item.id))
        .map((item) => normalizeItem(item, { fixed: false }))
        .filter(Boolean);

      const totalWeeks = clamp(positiveInt(parsed.totalWeeks, base.totalWeeks), 1, 52);
      const currentWeek = clamp(positiveInt(parsed.currentWeek, base.currentWeek), 1, totalWeeks);
      return {
        currentWeek,
        totalWeeks,
        weeklyCoins: positiveInt(parsed.weeklyCoins, base.weeklyCoins),
        heldCoins: positiveInt(parsed.heldCoins),
        bonusCoins: positiveInt(parsed.bonusCoins),
        budgetMode: parsed.budgetMode === 'full' ? 'full' : 'current',
        items: [...mergedDefaults, ...customItems],
        memo: typeof parsed.memo === 'string' ? parsed.memo : ''
      };
    } catch {
      return base;
    }
  }

  let state = loadState();

  function saveStateSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveStateNow, 350);
  }

  function saveStateNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function currentBudget() {
    return state.heldCoins + state.bonusCoins + state.currentWeek * state.weeklyCoins;
  }

  function fullBudget() {
    return state.heldCoins + state.bonusCoins + state.totalWeeks * state.weeklyCoins;
  }

  function activeBudget() {
    return state.budgetMode === 'full' ? fullBudget() : currentBudget();
  }

  function spentTotal() {
    return state.items.reduce((sum, item) => sum + item.cost * item.qty, 0);
  }

  function itemById(id) {
    return state.items.find((item) => item.id === id) || null;
  }

  function setItemQty(id, value) {
    const item = itemById(id);
    if (!item) return;
    item.qty = positiveInt(value);
    if (item.limit !== null) item.qty = Math.min(item.qty, item.limit);
  }

  function installStyles() {
    if (document.querySelector('#kirakiEventCoinShopStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiEventCoinShopStyles';
    style.textContent = `
.event-coinshop-panel{display:grid;gap:14px}.event-coinshop-panel *{box-sizing:border-box}.event-shop-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.event-shop-head h2{margin:0 0 5px;font-size:1.35rem;font-weight:950}.event-shop-head p{margin:0;color:var(--muted);font-size:.84rem}.event-shop-badge{display:inline-flex;align-items:center;min-height:30px;padding:5px 10px;border:1px solid color-mix(in srgb,#38bdf8 36%,var(--line));border-radius:999px;background:color-mix(in srgb,#e0f7ff 72%,var(--surface));color:#036985;font-size:.72rem;font-weight:950;white-space:nowrap}.event-shop-grid{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(300px,.92fr);gap:12px}.event-shop-card{padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.event-shop-card.tint{background:linear-gradient(135deg,color-mix(in srgb,#e0f7ff 70%,var(--surface)),var(--surface));border-color:color-mix(in srgb,#38bdf8 35%,var(--line))}.event-shop-card h3{margin:0 0 12px;font-size:1rem;font-weight:950}.event-shop-form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.event-shop-field{display:grid;gap:6px;color:var(--ink);font-size:.75rem;font-weight:850}.event-shop-field input,.event-shop-field textarea{width:100%;min-height:42px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--ink);font:inherit;font-weight:850;outline:none}.event-shop-field textarea{min-height:96px;padding:10px;line-height:1.55;resize:vertical}.event-shop-field input:focus,.event-shop-field textarea:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.16)}.event-shop-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.event-shop-actions .active-budget{border-color:#38bdf8;background:#e0f7ff;color:#036985}.event-shop-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.event-shop-metric{display:grid;gap:4px;min-height:70px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}.event-shop-metric span{color:var(--muted);font-size:.68rem;font-weight:850}.event-shop-metric strong{font-size:1.06rem;font-weight:950}.event-shop-metric.primary strong{color:#036985}.event-shop-metric .negative{color:var(--danger)}.event-preset-list{display:grid;gap:8px}.event-preset{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--soft)}.event-preset strong{font-size:.84rem;font-weight:950}.event-preset span{display:block;margin-top:3px;color:var(--muted);font-size:.68rem;font-weight:750}.event-shop-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.event-shop-toolbar h3{margin:0;font-size:1rem;font-weight:950}.event-shop-item-list{display:grid;gap:8px}.event-shop-item{display:grid;grid-template-columns:minmax(180px,1fr) 88px 78px 96px auto;gap:8px;align-items:end;padding:11px;border:1px solid var(--line);border-radius:13px;background:var(--surface)}.event-shop-item.priority{border-color:color-mix(in srgb,#38bdf8 48%,var(--line));box-shadow:inset 3px 0 0 #38bdf8}.event-shop-item label{display:grid;gap:5px;color:var(--muted);font-size:.63rem;font-weight:850}.event-shop-item input{width:100%;min-height:36px;padding:0 8px;border:1px solid var(--line);border-radius:8px;background:var(--soft);color:var(--ink);font:inherit;font-size:.76rem;font-weight:850;outline:none}.event-shop-item input:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.14)}.event-shop-item-name input{font-size:.82rem;color:var(--ink);font-weight:950}.event-shop-line-total{display:grid;gap:5px;min-width:86px;color:var(--muted);font-size:.63rem;font-weight:850;text-align:right}.event-shop-line-total strong{color:#036985;font-size:.82rem;font-weight:950}.event-shop-qty-buttons{display:flex;gap:4px}.event-shop-qty-buttons button{width:30px;min-height:36px;border:1px solid var(--line);border-radius:8px;background:var(--soft);color:var(--ink);font-weight:950;cursor:pointer}.event-shop-qty-buttons button:hover{border-color:#38bdf8;color:#036985}.event-shop-remove{color:var(--danger)!important}.event-shop-note{margin:0;color:var(--muted);font-size:.72rem;line-height:1.55}.event-shop-footer{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.55fr);gap:12px}
@media(max-width:980px){.event-shop-grid,.event-shop-footer{grid-template-columns:1fr}.event-shop-form-grid,.event-shop-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.event-shop-item{grid-template-columns:minmax(160px,1fr) 88px 78px 96px}.event-shop-line-total{grid-column:1/-1;text-align:left}.event-shop-qty-buttons{justify-content:flex-start}}
@media(max-width:640px){.event-shop-head{display:grid}.event-shop-form-grid,.event-shop-metrics{grid-template-columns:1fr}.event-shop-item{grid-template-columns:1fr 1fr}.event-shop-item-name{grid-column:1/-1}.event-shop-line-total{grid-column:1/-1}.event-shop-actions{display:grid}.event-shop-actions .button{width:100%}.event-preset{grid-template-columns:1fr}.event-shop-toolbar{display:grid}.event-shop-toolbar .button{width:100%}}
`;
    document.head.append(style);
  }

  function insertUi() {
    const nav = document.querySelector('.view-tabs');
    const footer = document.querySelector('.page-note');
    if (!nav || !footer || document.querySelector(`[data-view-button="${VIEW_ID}"]`)) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'view-tab';
    tab.dataset.viewButton = VIEW_ID;
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = '이벤트 코인샵';
    nav.append(tab);

    const panel = document.createElement('section');
    panel.className = 'view-panel';
    panel.dataset.viewPanel = VIEW_ID;
    panel.hidden = true;
    panel.innerHTML = `
      <section class="panel event-coinshop-panel" aria-labelledby="eventCoinShopTitle">
        <div class="event-shop-head">
          <div>
            <p class="section-kicker">주차 계획</p>
            <h2 id="eventCoinShopTitle">이벤트 코인샵</h2>
            <p>주차별 수급과 구매 수량을 합쳐 시즌 예산을 잡습니다.</p>
          </div>
          <span class="event-shop-badge">로드맵 저장</span>
        </div>

        <div class="event-shop-grid">
          <article class="event-shop-card tint">
            <h3>코인 수급</h3>
            <div class="event-shop-form-grid">
              <label class="event-shop-field"><span>현재 주차</span><input id="eventCoinCurrentWeek" type="number" min="1" max="52" step="1" inputmode="numeric" /></label>
              <label class="event-shop-field"><span>전체 주차</span><input id="eventCoinTotalWeeks" type="number" min="1" max="52" step="1" inputmode="numeric" /></label>
              <label class="event-shop-field"><span>주차당 코인</span><input id="eventCoinWeekly" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label class="event-shop-field"><span>현재 보유</span><input id="eventCoinHeld" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label class="event-shop-field"><span>추가 보정</span><input id="eventCoinBonus" type="number" min="0" step="1" inputmode="numeric" /></label>
            </div>
            <div class="event-shop-actions">
              <button type="button" class="button secondary small" id="eventCoinApplyCurrent">현재주차까지 적용</button>
              <button type="button" class="button primary small" id="eventCoinApplyFull">전체 코인 적용</button>
            </div>
            <div class="event-shop-metrics">
              <div class="event-shop-metric primary"><span>적용 예산</span><strong id="eventCoinActiveBudget">0</strong></div>
              <div class="event-shop-metric"><span>현재주차까지</span><strong id="eventCoinCurrentBudget">0</strong></div>
              <div class="event-shop-metric"><span>시즌 전체</span><strong id="eventCoinFullBudget">0</strong></div>
              <div class="event-shop-metric"><span>구매 후 잔여</span><strong id="eventCoinLeftBudget">0</strong></div>
            </div>
          </article>

          <article class="event-shop-card">
            <h3>구매 프리셋</h3>
            <div class="event-preset-list" id="eventCoinPresetList"></div>
            <div class="event-shop-actions">
              <button type="button" class="button ghost small" id="eventCoinClearQuantities">수량 초기화</button>
            </div>
          </article>
        </div>

        <article class="event-shop-card">
          <div class="event-shop-toolbar">
            <div><h3>구매 계획</h3><p class="event-shop-note">품목명, 가격, 한도는 직접 조정할 수 있습니다.</p></div>
            <div class="event-shop-actions">
              <button type="button" class="button secondary small" id="eventCoinAddItem">품목 추가</button>
              <button type="button" class="button ghost small" id="eventCoinResetItems">기본값 복원</button>
            </div>
          </div>
          <div class="event-shop-item-list" id="eventCoinItemList"></div>
        </article>

        <div class="event-shop-footer">
          <article class="event-shop-card">
            <h3>메모</h3>
            <label class="event-shop-field"><span>계획 메모</span><textarea id="eventCoinMemo"></textarea></label>
          </article>
          <article class="event-shop-card">
            <h3>요약</h3>
            <div class="event-shop-metrics">
              <div class="event-shop-metric"><span>총 구매</span><strong id="eventCoinSpentTotal">0</strong></div>
              <div class="event-shop-metric"><span>선택 품목</span><strong id="eventCoinItemCount">0</strong></div>
            </div>
            <p class="event-shop-note">해방일지와 아이템버닝 기록은 이후 이 로드맵 화면에 이어 붙일 수 있습니다.</p>
          </article>
        </div>
      </section>`;
    footer.parentNode.insertBefore(panel, footer);
    tab.addEventListener('click', () => setView(VIEW_ID, { scroll: true }));
  }

  function setText(selector, text) {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }

  function renderSettings() {
    const pairs = [
      ['#eventCoinCurrentWeek', state.currentWeek],
      ['#eventCoinTotalWeeks', state.totalWeeks],
      ['#eventCoinWeekly', state.weeklyCoins],
      ['#eventCoinHeld', state.heldCoins],
      ['#eventCoinBonus', state.bonusCoins],
      ['#eventCoinMemo', state.memo]
    ];
    pairs.forEach(([selector, value]) => {
      const node = document.querySelector(selector);
      if (node && node.value !== String(value)) node.value = value;
    });
    document.querySelector('#eventCoinApplyCurrent')?.classList.toggle('active-budget', state.budgetMode === 'current');
    document.querySelector('#eventCoinApplyFull')?.classList.toggle('active-budget', state.budgetMode === 'full');
  }

  function renderSummary() {
    const spent = spentTotal();
    const left = activeBudget() - spent;
    setText('#eventCoinActiveBudget', nf.format(activeBudget()));
    setText('#eventCoinCurrentBudget', nf.format(currentBudget()));
    setText('#eventCoinFullBudget', nf.format(fullBudget()));
    setText('#eventCoinSpentTotal', nf.format(spent));
    setText('#eventCoinItemCount', nf.format(state.items.filter((item) => item.qty > 0).length));
    const leftNode = document.querySelector('#eventCoinLeftBudget');
    if (leftNode) {
      leftNode.textContent = nf.format(left);
      leftNode.classList.toggle('negative', left < 0);
    }
  }

  function renderPresets() {
    const wrap = document.querySelector('#eventCoinPresetList');
    if (!wrap) return;
    wrap.innerHTML = PRESETS.map((preset) => `
      <div class="event-preset">
        <div><strong>${esc(preset.name)}</strong><span>${esc(preset.note)}</span></div>
        <button type="button" class="button secondary small" data-event-coin-preset="${esc(preset.id)}">적용</button>
      </div>`).join('');
  }

  function renderItems() {
    const list = document.querySelector('#eventCoinItemList');
    if (!list) return;
    list.innerHTML = state.items.map((item) => `
      <article class="event-shop-item${item.priority ? ' priority' : ''}" data-event-coin-item="${esc(item.id)}">
        <label class="event-shop-item-name"><span>품목</span><input value="${esc(item.name)}" data-event-item-name="${esc(item.id)}" /></label>
        <label><span>가격</span><input type="number" min="0" step="1" inputmode="numeric" value="${item.cost}" data-event-item-cost="${esc(item.id)}" /></label>
        <label><span>한도</span><input type="number" min="0" step="1" inputmode="numeric" value="${item.limit === null ? '' : item.limit}" placeholder="무제한" data-event-item-limit="${esc(item.id)}" /></label>
        <label><span>수량</span><input type="number" min="0" ${item.limit === null ? '' : `max="${item.limit}"`} step="1" inputmode="numeric" value="${item.qty}" data-event-item-qty="${esc(item.id)}" /></label>
        <div class="event-shop-line-total"><span>합계</span><strong>${nf.format(item.cost * item.qty)}</strong></div>
        <div class="event-shop-qty-buttons">
          <button type="button" data-event-item-minus="${esc(item.id)}" aria-label="${esc(item.name)} 수량 감소">−</button>
          <button type="button" data-event-item-plus="${esc(item.id)}" aria-label="${esc(item.name)} 수량 증가">＋</button>
          ${item.fixed ? '' : `<button type="button" class="event-shop-remove" data-event-item-remove="${esc(item.id)}" aria-label="${esc(item.name)} 삭제">삭제</button>`}
        </div>
      </article>`).join('');
    renderSummary();
  }

  function renderAll() {
    renderSettings();
    renderPresets();
    renderItems();
    renderSummary();
  }

  function updateSetting(id, value) {
    const next = positiveInt(value);
    if (id === 'eventCoinTotalWeeks') {
      state.totalWeeks = clamp(next || 1, 1, 52);
      state.currentWeek = clamp(state.currentWeek, 1, state.totalWeeks);
    } else if (id === 'eventCoinCurrentWeek') {
      state.currentWeek = clamp(next || 1, 1, state.totalWeeks);
    } else if (id === 'eventCoinWeekly') state.weeklyCoins = next;
    else if (id === 'eventCoinHeld') state.heldCoins = next;
    else if (id === 'eventCoinBonus') state.bonusCoins = next;
    saveStateSoon();
    renderSettings();
    renderSummary();
  }

  function applyPreset(id) {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) return;
    state.items.forEach((item) => { item.qty = 0; });
    Object.entries(preset.quantities).forEach(([itemId, qty]) => setItemQty(itemId, qty));
    saveStateNow();
    renderItems();
    if (typeof toast === 'function') toast(`${preset.name}을 적용했습니다.`);
  }

  function addItem() {
    state.items.push({
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`,
      name: '직접 입력',
      group: '기타',
      cost: 0,
      limit: null,
      qty: 0,
      priority: false,
      fixed: false
    });
    saveStateNow();
    renderItems();
  }

  function bindUi() {
    document.querySelector('.event-coinshop-panel')?.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;
      if (target.id && ['eventCoinCurrentWeek', 'eventCoinTotalWeeks', 'eventCoinWeekly', 'eventCoinHeld', 'eventCoinBonus'].includes(target.id)) {
        updateSetting(target.id, target.value);
        return;
      }
      if (target.id === 'eventCoinMemo') {
        state.memo = target.value;
        saveStateSoon();
        return;
      }
      const qtyId = target.dataset.eventItemQty;
      if (qtyId) {
        setItemQty(qtyId, target.value);
        saveStateSoon();
        renderItems();
      }
    });

    document.querySelector('.event-coinshop-panel')?.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const nameId = target.dataset.eventItemName;
      const costId = target.dataset.eventItemCost;
      const limitId = target.dataset.eventItemLimit;
      if (nameId) {
        const item = itemById(nameId);
        if (item) item.name = target.value.trim().slice(0, 40) || '직접 입력';
      } else if (costId) {
        const item = itemById(costId);
        if (item) item.cost = positiveInt(target.value);
      } else if (limitId) {
        const item = itemById(limitId);
        if (item) {
          item.limit = target.value === '' ? null : positiveInt(target.value);
          if (item.limit !== null) item.qty = Math.min(item.qty, item.limit);
        }
      } else return;
      saveStateNow();
      renderItems();
    });

    document.querySelector('.event-coinshop-panel')?.addEventListener('click', (event) => {
      const target = event.target;
      const presetButton = target.closest?.('[data-event-coin-preset]');
      if (presetButton) return applyPreset(presetButton.dataset.eventCoinPreset);

      if (target.closest?.('#eventCoinApplyCurrent')) {
        state.budgetMode = 'current';
        saveStateNow();
        renderAll();
        return;
      }
      if (target.closest?.('#eventCoinApplyFull')) {
        state.budgetMode = 'full';
        saveStateNow();
        renderAll();
        return;
      }
      if (target.closest?.('#eventCoinClearQuantities')) {
        state.items.forEach((item) => { item.qty = 0; });
        saveStateNow();
        renderItems();
        return;
      }
      if (target.closest?.('#eventCoinAddItem')) return addItem();
      if (target.closest?.('#eventCoinResetItems')) {
        if (!window.confirm('이벤트 코인샵 품목을 기본값으로 되돌릴까요? 구매 수량도 초기화됩니다.')) return;
        state.items = DEFAULT_ITEMS.map(defaultItem);
        saveStateNow();
        renderItems();
        return;
      }

      const minus = target.closest?.('[data-event-item-minus]');
      const plus = target.closest?.('[data-event-item-plus]');
      const remove = target.closest?.('[data-event-item-remove]');
      if (minus) setItemQty(minus.dataset.eventItemMinus, (itemById(minus.dataset.eventItemMinus)?.qty || 0) - 1);
      else if (plus) setItemQty(plus.dataset.eventItemPlus, (itemById(plus.dataset.eventItemPlus)?.qty || 0) + 1);
      else if (remove) state.items = state.items.filter((item) => item.id !== remove.dataset.eventItemRemove);
      else return;
      saveStateNow();
      renderItems();
    });
  }

  function wrapSetView() {
    if (window.__kirakiEventCoinShopSetViewWrapped || typeof setView !== 'function') return;
    window.__kirakiEventCoinShopSetViewWrapped = true;
    const baseSetView = setView;
    setView = function eventCoinShopAwareSetView(nextView, options = {}) {
      if (nextView !== VIEW_ID) return baseSetView(nextView, options);
      document.querySelectorAll('[data-view-button]').forEach((button) => {
        const active = button.dataset.viewButton === VIEW_ID;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('[data-view-panel]').forEach((panel) => {
        const active = panel.dataset.viewPanel === VIEW_ID;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
      try { if (typeof VIEW_SESSION_KEY !== 'undefined') sessionStorage.setItem(VIEW_SESSION_KEY, VIEW_ID); } catch {}
      if (options.scroll) document.querySelector('.view-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      renderAll();
    };
  }

  function boot() {
    installStyles();
    insertUi();
    bindUi();
    wrapSetView();
    renderAll();
    try {
      if (typeof VIEW_SESSION_KEY !== 'undefined' && sessionStorage.getItem(VIEW_SESSION_KEY) === VIEW_ID) {
        setTimeout(() => setView(VIEW_ID), 0);
      }
    } catch {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();