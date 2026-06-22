(() => {
  'use strict';

  if (window.__kirakiEventCoinShopLoaded) return;
  window.__kirakiEventCoinShopLoaded = true;

  const EVENT_COIN_SHOP_PUBLIC = false;
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

  const SHOP_ITEMS = [
    { id: 'karma-bronze-additional-cube', shop: 'upgrade', name: '카르마 브론즈 에디셔널 큐브', cost: 100, limit: 100 },
    { id: 'karma-silver-cube', shop: 'upgrade', name: '카르마 실버 큐브', cost: 100, limit: 100 },
    { id: 'epic-potential-scroll-100', shop: 'upgrade', name: '에픽 잠재능력 부여 스크롤 100%', cost: 300, limit: 5 },
    { id: 'special-additional-potential-scroll-100', shop: 'upgrade', name: '스페셜 에디셔널 잠재능력 부여 스크롤 100%', cost: 300, limit: 5 },
    { id: 'innocent-scroll-100', shop: 'upgrade', name: '이노센트 주문서 100%', cost: 100, limit: 20 },
    { id: 'pet-equipment-scroll-selector', shop: 'upgrade', name: '펫장비 주문서 선택권', cost: 500, limit: 20 },
    { id: 'clean-slate-scroll-100', shop: 'upgrade', name: '순백의 주문서 100%', cost: 200, limit: 10 },
    { id: 'event-ring-selector', shop: 'upgrade', name: '이벤트 링 선택권', cost: 3000, limit: 3 },
    { id: 'event-ring-gold-cube', shop: 'upgrade', name: '이벤트 링 전용 골드 큐브', cost: 150, limit: 50 },
    { id: 'event-ring-legendary-potential-scroll-100', shop: 'upgrade', name: '이벤트 링 전용 레전드리 잠재능력 부여 스크롤 100%', cost: 4000, limit: 3 },
    { id: 'karma-unique-potential-scroll-100', shop: 'upgrade', name: '카르마 유니크 잠재능력 부여 스크롤 100%', cost: 3000, limit: 4 },
    { id: 'karma-additional-epic-potential-scroll-100', shop: 'upgrade', name: '카르마 에디셔널 에픽 잠재능력 부여 스크롤 100%', cost: 3000, limit: 4 },
    { id: 'karma-special-heart-scroll-selector', shop: 'upgrade', name: '카르마 스페셜 하트 주문서 선택권', cost: 2000, limit: 10 },
    { id: 'ap-reset-scroll', shop: 'growth', name: 'AP 초기화 주문서', cost: 50, limit: 3 },
    { id: 'sp-reset-scroll', shop: 'growth', name: 'SP 초기화 주문서', cost: 50, limit: 3 },
    { id: 'trait-growth-potion', shop: 'growth', name: '성향 성장의 비약', cost: 300, limit: 20 },
    { id: 'slot-8-expansion-coupon', shop: 'growth', name: '선택 슬롯 8칸 확장권', cost: 100, limit: 15 },
    { id: 'infinite-fatigue-recovery', shop: 'growth', name: '무한의 피로회복제', cost: 10, limit: 5 },
    { id: 'exp-core-gemstone', shop: 'growth', name: '경험의 코어 젬스톤', cost: 150, limit: 200 },
    { id: 'chaos-circulator', shop: 'growth', name: '카오스 서큘레이터', cost: 800, limit: 20 },
    { id: 'black-circulator', shop: 'growth', name: '블랙 서큘레이터', cost: 1500, limit: 10 },
    { id: 'legendary-circulator', shop: 'growth', name: '레전드리 서큘레이터', cost: 2000, limit: 3 },
    { id: 'spiegelmann-golden-strawberry-farm-ticket', shop: 'growth', name: '슈피겔라의 황금 딸기 농장 1회 입장권', cost: 200, limit: 5 },
    { id: 'extreme-growth-potion', shop: 'growth', name: '익스트림 성장의 비약', cost: 70, limit: 200 },
    { id: 'growth-potion-200-249', shop: 'growth', name: '성장의 비약 (200~249)', cost: 5000, limit: 2 },
    { id: 'growth-potion-200-259', shop: 'growth', name: '성장의 비약 (200~259)', cost: 10000, limit: 1 },
    { id: 'sol-erda-event', shop: 'growth', name: '솔 에르다', cost: 8000, limit: 3 }
  ];

  const PRESETS = [
    { id: 'event-ring', name: '이벤트 링 세팅', quantities: { 'event-ring-selector': 3, 'event-ring-gold-cube': 50, 'event-ring-legendary-potential-scroll-100': 3 } },
    { id: 'hexa-growth', name: '솔 에르다·코젬', quantities: { 'sol-erda-event': 3, 'exp-core-gemstone': 200 } },
    { id: 'growth-potion', name: '성장 비약 우선', quantities: { 'extreme-growth-potion': 200, 'growth-potion-200-249': 2, 'growth-potion-200-259': 1 } },
    { id: 'potential', name: '잠재/에디 강화', quantities: { 'karma-bronze-additional-cube': 100, 'karma-silver-cube': 100, 'epic-potential-scroll-100': 5, 'special-additional-potential-scroll-100': 5, 'karma-unique-potential-scroll-100': 4, 'karma-additional-epic-potential-scroll-100': 4 } }
  ];

  const positiveInt = (value, fallback = 0) => Math.max(0, Math.round(Number(value) || fallback));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  let saveTimer = null;
  let pendingEventCoinShopView = false;

  function defaultState() {
    return {
      currentWeek: 1,
      totalWeeks: 12,
      weeklyCoins: 2000,
      heldCoins: 0,
      bonusCoins: 0,
      budgetMode: 'current',
      category: 'upgrade',
      costs: Object.fromEntries(SHOP_ITEMS.map((item) => [item.id, item.cost])),
      limits: Object.fromEntries(SHOP_ITEMS.map((item) => [item.id, item.limit])),
      quantities: {},
      memo: ''
    };
  }

  function loadState() {
    const base = defaultState();
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return base;
      const totalWeeks = clamp(positiveInt(parsed.totalWeeks, base.totalWeeks), 1, 52);
      const currentWeek = clamp(positiveInt(parsed.currentWeek, base.currentWeek), 1, totalWeeks);
      return {
        currentWeek,
        totalWeeks,
        weeklyCoins: positiveInt(parsed.weeklyCoins, base.weeklyCoins),
        heldCoins: positiveInt(parsed.heldCoins),
        bonusCoins: positiveInt(parsed.bonusCoins),
        budgetMode: parsed.budgetMode === 'full' ? 'full' : 'current',
        category: parsed.category === 'growth' ? 'growth' : 'upgrade',
        costs: { ...base.costs, ...(parsed.costs || {}) },
        limits: { ...base.limits, ...(parsed.limits || {}) },
        quantities: parsed.quantities && typeof parsed.quantities === 'object' ? parsed.quantities : {},
        memo: typeof parsed.memo === 'string' ? parsed.memo : ''
      };
    } catch {
      return base;
    }
  }

  let state = loadState();

  function canAccess() {
    return EVENT_COIN_SHOP_PUBLIC || (typeof isAdminUnlocked === 'function' && isAdminUnlocked());
  }

  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 400);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function costFor(id) {
    return positiveInt(state.costs[id], SHOP_ITEMS.find((item) => item.id === id)?.cost || 0);
  }

  function limitFor(id) {
    const value = state.limits[id];
    return value === null || value === '' || value === undefined ? null : positiveInt(value);
  }

  function qtyFor(id) {
    const limit = limitFor(id);
    const qty = positiveInt(state.quantities[id]);
    return limit === null ? qty : Math.min(qty, limit);
  }

  function setQty(id, value) {
    state.quantities[id] = qtyForValue(id, value);
  }

  function qtyForValue(id, value) {
    const limit = limitFor(id);
    const qty = positiveInt(value);
    return limit === null ? qty : Math.min(qty, limit);
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
    return SHOP_ITEMS.reduce((sum, item) => sum + costFor(item.id) * qtyFor(item.id), 0);
  }

  function installStyles() {
    if (document.querySelector('#kirakiEventCoinShopStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiEventCoinShopStyles';
    style.textContent = `
.event-coinshop-panel{display:grid;gap:14px}.event-coinshop-panel *{box-sizing:border-box}.event-shop-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.event-shop-head h2{margin:0 0 5px;font-size:1.35rem;font-weight:950}.event-shop-head p{margin:0;color:var(--muted);font-size:.84rem}.event-shop-badge{display:inline-flex;align-items:center;min-height:30px;padding:5px 10px;border:1px solid #ead49a;border-radius:999px;background:#fff7dd;color:#795500;font-size:.72rem;font-weight:950;white-space:nowrap}.event-shop-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(300px,.95fr);gap:12px}.event-shop-card{padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.event-shop-card.tint{background:linear-gradient(135deg,color-mix(in srgb,#e0f7ff 70%,var(--surface)),var(--surface));border-color:color-mix(in srgb,#38bdf8 35%,var(--line))}.event-shop-card h3{margin:0 0 12px;font-size:1rem;font-weight:950}.event-shop-form-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.event-shop-field{display:grid;gap:6px;color:var(--ink);font-size:.75rem;font-weight:850}.event-shop-field input,.event-shop-field textarea{width:100%;min-height:42px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--ink);font:inherit;font-weight:850;outline:none}.event-shop-field textarea{min-height:96px;padding:10px;line-height:1.55;resize:vertical}.event-shop-field input:focus,.event-shop-field textarea:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.16)}.event-shop-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.event-shop-actions .active-budget{border-color:#38bdf8;background:#e0f7ff;color:#036985}.event-shop-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.event-shop-metric{display:grid;gap:4px;min-height:70px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}.event-shop-metric span{color:var(--muted);font-size:.68rem;font-weight:850}.event-shop-metric strong{font-size:1.04rem;font-weight:950}.event-shop-metric.primary strong{color:#036985}.event-shop-metric .negative{color:var(--danger)}.event-preset-list{display:grid;gap:8px}.event-preset{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--soft)}.event-preset strong{font-size:.84rem;font-weight:950}.event-preset span{display:block;margin-top:3px;color:var(--muted);font-size:.68rem;font-weight:750}.event-shop-category-tabs{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;padding:5px;border:1px solid var(--line);border-radius:12px;background:var(--soft)}.event-shop-category-tab{min-height:40px;border:0;border-radius:8px;background:transparent;color:var(--muted);font-weight:900;cursor:pointer}.event-shop-category-tab.active{background:var(--surface);color:var(--ink);box-shadow:0 5px 13px rgba(31,41,55,.07)}.event-shop-item-list{display:grid;gap:8px}.event-shop-item{display:grid;grid-template-columns:minmax(190px,1fr) 88px 78px 96px 92px;gap:8px;align-items:end;padding:11px;border:1px solid var(--line);border-radius:13px;background:var(--surface)}.event-shop-item label{display:grid;gap:5px;color:var(--muted);font-size:.63rem;font-weight:850}.event-shop-item input{width:100%;min-height:36px;padding:0 8px;border:1px solid var(--line);border-radius:8px;background:var(--soft);color:var(--ink);font:inherit;font-size:.76rem;font-weight:850;outline:none}.event-shop-item input:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.14)}.event-shop-item-name strong{display:block;color:var(--ink);font-size:.84rem;font-weight:950;line-height:1.35}.event-shop-item-name span{display:block;margin-top:3px;color:var(--muted);font-size:.68rem;font-weight:800}.event-shop-line-total{display:grid;gap:5px;color:var(--muted);font-size:.63rem;font-weight:850;text-align:right}.event-shop-line-total strong{color:#036985;font-size:.82rem;font-weight:950}.event-shop-qty-buttons{display:flex;gap:4px}.event-shop-qty-buttons button{width:30px;min-height:36px;border:1px solid var(--line);border-radius:8px;background:var(--soft);color:var(--ink);font-weight:950;cursor:pointer}.event-shop-qty-buttons button:hover{border-color:#38bdf8;color:#036985}.event-shop-note{margin:0;color:var(--muted);font-size:.72rem;line-height:1.55}.event-shop-footer{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.55fr);gap:12px}.event-shop-hidden-tab[hidden]{display:none!important}
@media(max-width:980px){.event-shop-grid,.event-shop-footer{grid-template-columns:1fr}.event-shop-form-grid,.event-shop-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.event-shop-item{grid-template-columns:minmax(160px,1fr) 88px 78px 96px}.event-shop-line-total{grid-column:1/-1;text-align:left}.event-shop-qty-buttons{justify-content:flex-start}}
@media(max-width:640px){.event-shop-head{display:grid}.event-shop-form-grid,.event-shop-metrics{grid-template-columns:1fr}.event-shop-item{grid-template-columns:1fr 1fr}.event-shop-item-name{grid-column:1/-1}.event-shop-line-total{grid-column:1/-1}.event-shop-actions{display:grid}.event-shop-actions .button{width:100%}.event-preset{grid-template-columns:1fr}}
`;
    document.head.append(style);
  }

  function insertUi() {
    const nav = document.querySelector('.view-tabs');
    const footer = document.querySelector('.page-note');
    if (!nav || !footer || document.querySelector(`[data-view-button="${VIEW_ID}"]`)) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'view-tab event-shop-hidden-tab';
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
            <p class="section-kicker">키라키 모드</p>
            <h2 id="eventCoinShopTitle">이벤트 코인샵</h2>
            <p>연합 토큰 수급과 강화·성장 코인샵 구매 계획을 저장합니다.</p>
          </div>
          <span class="event-shop-badge">비공개 준비 중</span>
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

        <div class="event-shop-category-tabs" role="tablist" aria-label="이벤트 코인샵 종류">
          <button type="button" class="event-shop-category-tab" data-event-shop-category="upgrade">강화 코인샵</button>
          <button type="button" class="event-shop-category-tab" data-event-shop-category="growth">성장 코인샵</button>
        </div>
        <div class="event-shop-item-list" id="eventCoinItemList"></div>

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
            <p class="event-shop-note">다음 공개 전까지 키라키 모드에서만 표시됩니다.</p>
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
    document.querySelectorAll('[data-event-shop-category]').forEach((button) => {
      button.classList.toggle('active', button.dataset.eventShopCategory === state.category);
    });
  }

  function renderSummary() {
    const spent = spentTotal();
    const left = activeBudget() - spent;
    setText('#eventCoinActiveBudget', nf.format(activeBudget()));
    setText('#eventCoinCurrentBudget', nf.format(currentBudget()));
    setText('#eventCoinFullBudget', nf.format(fullBudget()));
    setText('#eventCoinSpentTotal', nf.format(spent));
    setText('#eventCoinItemCount', nf.format(SHOP_ITEMS.filter((item) => qtyFor(item.id) > 0).length));
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
        <div><strong>${esc(preset.name)}</strong><span>${nf.format(Object.keys(preset.quantities).length)}개 품목</span></div>
        <button type="button" class="button secondary small" data-event-coin-preset="${esc(preset.id)}">적용</button>
      </div>`).join('');
  }

  function renderItems() {
    const list = document.querySelector('#eventCoinItemList');
    if (!list) return;
    const items = SHOP_ITEMS.filter((item) => item.shop === state.category);
    list.innerHTML = items.map((item) => {
      const cost = costFor(item.id);
      const limit = limitFor(item.id);
      const qty = qtyFor(item.id);
      return `
        <article class="event-shop-item" data-event-coin-item="${esc(item.id)}">
          <div class="event-shop-item-name"><strong>${esc(item.name)}</strong><span>${item.shop === 'upgrade' ? '강화' : '성장'} · 기본 ${nf.format(item.cost)} 토큰</span></div>
          <label><span>가격</span><input type="number" min="0" step="1" inputmode="numeric" value="${cost}" data-event-item-cost="${esc(item.id)}" /></label>
          <label><span>한도</span><input type="number" min="0" step="1" inputmode="numeric" value="${limit === null ? '' : limit}" placeholder="무제한" data-event-item-limit="${esc(item.id)}" /></label>
          <label><span>수량</span><input type="number" min="0" ${limit === null ? '' : `max="${limit}"`} step="1" inputmode="numeric" value="${qty}" data-event-item-qty="${esc(item.id)}" /></label>
          <div class="event-shop-line-total"><span>합계</span><strong>${nf.format(cost * qty)}</strong></div>
          <div class="event-shop-qty-buttons">
            <button type="button" data-event-item-minus="${esc(item.id)}" aria-label="${esc(item.name)} 수량 감소">−</button>
            <button type="button" data-event-item-plus="${esc(item.id)}" aria-label="${esc(item.name)} 수량 증가">＋</button>
          </div>
        </article>`;
    }).join('');
    renderSettings();
    renderSummary();
  }

  function renderAll() {
    renderSettings();
    renderPresets();
    renderItems();
    renderSummary();
  }

  function updateAccess() {
    const tab = document.querySelector(`[data-view-button="${VIEW_ID}"]`);
    if (tab) tab.hidden = !canAccess();
    if (!canAccess() && document.querySelector(`[data-view-panel="${VIEW_ID}"]`)?.classList.contains('active')) {
      if (typeof setView === 'function') setView('dashboard');
    }
  }

  function updateSetting(id, value) {
    const next = positiveInt(value);
    if (id === 'eventCoinTotalWeeks') {
      state.totalWeeks = clamp(next || 1, 1, 52);
      state.currentWeek = clamp(state.currentWeek, 1, state.totalWeeks);
    } else if (id === 'eventCoinCurrentWeek') state.currentWeek = clamp(next || 1, 1, state.totalWeeks);
    else if (id === 'eventCoinWeekly') state.weeklyCoins = next;
    else if (id === 'eventCoinHeld') state.heldCoins = next;
    else if (id === 'eventCoinBonus') state.bonusCoins = next;
    saveSoon();
    renderSettings();
    renderSummary();
  }

  function applyPreset(id) {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) return;
    Object.keys(state.quantities).forEach((key) => { state.quantities[key] = 0; });
    Object.entries(preset.quantities).forEach(([itemId, qty]) => setQty(itemId, qty));
    saveNow();
    renderItems();
    if (typeof toast === 'function') toast(`${preset.name}을 적용했습니다.`);
  }

  function bindUi() {
    document.querySelector('.event-coinshop-panel')?.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return;
      if (target.id && ['eventCoinCurrentWeek', 'eventCoinTotalWeeks', 'eventCoinWeekly', 'eventCoinHeld', 'eventCoinBonus'].includes(target.id)) return updateSetting(target.id, target.value);
      if (target.id === 'eventCoinMemo') {
        state.memo = target.value;
        saveSoon();
        return;
      }
      const qtyId = target.dataset.eventItemQty;
      if (qtyId) {
        setQty(qtyId, target.value);
        saveSoon();
        renderItems();
      }
    });

    document.querySelector('.event-coinshop-panel')?.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const costId = target.dataset.eventItemCost;
      const limitId = target.dataset.eventItemLimit;
      if (costId) state.costs[costId] = positiveInt(target.value);
      else if (limitId) {
        state.limits[limitId] = target.value === '' ? null : positiveInt(target.value);
        setQty(limitId, qtyFor(limitId));
      } else return;
      saveNow();
      renderItems();
    });

    document.querySelector('.event-coinshop-panel')?.addEventListener('click', (event) => {
      const target = event.target;
      const presetButton = target.closest?.('[data-event-coin-preset]');
      if (presetButton) return applyPreset(presetButton.dataset.eventCoinPreset);
      const categoryButton = target.closest?.('[data-event-shop-category]');
      if (categoryButton) {
        state.category = categoryButton.dataset.eventShopCategory === 'growth' ? 'growth' : 'upgrade';
        saveNow();
        renderItems();
        return;
      }
      if (target.closest?.('#eventCoinApplyCurrent')) {
        state.budgetMode = 'current';
        saveNow();
        renderAll();
        return;
      }
      if (target.closest?.('#eventCoinApplyFull')) {
        state.budgetMode = 'full';
        saveNow();
        renderAll();
        return;
      }
      if (target.closest?.('#eventCoinClearQuantities')) {
        state.quantities = {};
        saveNow();
        renderItems();
        return;
      }
      const minus = target.closest?.('[data-event-item-minus]');
      const plus = target.closest?.('[data-event-item-plus]');
      if (minus) setQty(minus.dataset.eventItemMinus, qtyFor(minus.dataset.eventItemMinus) - 1);
      else if (plus) setQty(plus.dataset.eventItemPlus, qtyFor(plus.dataset.eventItemPlus) + 1);
      else return;
      saveNow();
      renderItems();
    });
  }

  function wrapSetView() {
    if (window.__kirakiEventCoinShopSetViewWrapped || typeof setView !== 'function') return;
    window.__kirakiEventCoinShopSetViewWrapped = true;
    const baseSetView = setView;
    setView = function eventCoinShopAwareSetView(nextView, options = {}) {
      if (nextView !== VIEW_ID) return baseSetView(nextView, options);
      if (!canAccess()) {
        pendingEventCoinShopView = true;
        if (typeof openAdminDialog === 'function') openAdminDialog();
        if (typeof toast === 'function') toast('이벤트 코인샵은 키라키 모드에서만 열립니다.');
        return;
      }
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

  function wrapAdminUnlock() {
    if (window.__kirakiEventCoinShopAdminWrapped || typeof setAdminUnlocked !== 'function') return;
    window.__kirakiEventCoinShopAdminWrapped = true;
    const baseSetAdminUnlocked = setAdminUnlocked;
    setAdminUnlocked = function eventCoinShopAwareAdminUnlock(unlocked) {
      baseSetAdminUnlocked(unlocked);
      updateAccess();
      if (unlocked && pendingEventCoinShopView) {
        pendingEventCoinShopView = false;
        setTimeout(() => setView(VIEW_ID, { scroll: true }), 0);
      }
    };
  }

  function boot() {
    installStyles();
    insertUi();
    bindUi();
    wrapSetView();
    wrapAdminUnlock();
    updateAccess();
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