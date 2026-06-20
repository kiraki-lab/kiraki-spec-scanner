(() => {
  'use strict';

  const COIN_SHOP_PUBLIC = false;
  const STORAGE_KEY = 'kiraki-challengers-coinshop:v1';
  const DEFAULT_MEMO = [
    '솔 에르다 조각은 많이 풀려도 기운이 없으면 당장 강화가 막힌다.',
    '솔 에르다를 먼저 사서 남는 조각을 빠르게 소모하고 전투력을 앞당기는 방향을 검토한다.',
    '기운을 전부 산 뒤에도 큐브·불꽃·주문서처럼 쓸 만한 품목을 얼마나 살 수 있는지 예산표로 보여준다.'
  ].join('\n');

  const ITEMS = [
    { id: 'black-secondary-box', shop: 'normal', name: '블랙 보조 무기 상자', cost: 100, limit: 1, icon: '🎁', group: '장비' },
    { id: 'special-soul-enchanter', shop: 'normal', name: '스페셜 소울 인챈터', cost: 100, limit: 3, icon: '🔥', group: '장비' },
    { id: 'triple-exp-coupon', shop: 'normal', name: '경험치 3배 쿠폰 (30분)', cost: 100, limit: 7, icon: '📘', group: '성장' },
    { id: 'vip-exp-buff', shop: 'normal', name: 'VIP 버프 (경험치)', cost: 30, limit: null, icon: 'VIP', group: '성장' },
    { id: 'vip-stat-buff', shop: 'normal', name: 'VIP 버프 (능력치)', cost: 30, limit: null, icon: 'VIP', group: '성장' },
    { id: 'karma-black-flame', shop: 'normal', name: '카르마 검은 환생의 불꽃', cost: 50, limit: 1000, icon: '🌈', group: '강화' },
    { id: 'sol-erda-fragment-normal', shop: 'normal', name: '솔 에르다 조각', cost: 50, limit: 500, icon: '💠', group: 'HEXA' },
    { id: 'sol-erda-normal', shop: 'normal', name: '솔 에르다', cost: 2000, limit: 5, icon: '✨', group: 'HEXA', priority: true },
    { id: 'memento-gold-cube', shop: 'normal', name: '메멘토 골드 큐브 (200제)', cost: 100, limit: 50, icon: '🟨', group: '큐브' },
    { id: 'memento-silver-cube', shop: 'normal', name: '메멘토 실버 큐브 (200제)', cost: 50, limit: 500, icon: '⬜', group: '큐브' },
    { id: 'karma-bronze-additional-cube', shop: 'normal', name: '카르마 브론즈 에디셔널 큐브', cost: 20, limit: 1000, icon: '🟫', group: '큐브' },
    { id: 'pet-scroll-selector', shop: 'normal', name: '펫장비 주문서 선택권', cost: 500, limit: 100, icon: '📜', group: '주문서' },
    { id: 'epic-potential-scroll', shop: 'normal', name: '에픽 잠재능력 부여 스크롤 100%', cost: 150, limit: 30, icon: '📜', group: '주문서' },
    { id: 'additional-potential-scroll', shop: 'normal', name: '에디셔널 잠재능력 부여 스크롤 100%', cost: 150, limit: 30, icon: '📜', group: '주문서' },
    { id: 'karma-premium-pet-scroll', shop: 'normal', name: '카르마 프리미엄 펫장비 주문서 선택권', cost: 1000, limit: 10, icon: '📜', group: '주문서' },
    { id: 'innocent-scroll', shop: 'normal', name: '이노센트 주문서 100%', cost: 50, limit: 10, icon: '📜', group: '주문서' },
    { id: 'clean-slate-scroll', shop: 'normal', name: '순백의 주문서 100%', cost: 100, limit: 10, icon: '📜', group: '주문서' },
    { id: 'karma-starforce-17', shop: 'normal', name: '카르마 스타포스 17성 강화권 (160제)', cost: 3000, limit: 3, icon: '⭐', group: '강화' },
    { id: 'karma-premium-accessory-scroll', shop: 'normal', name: '카르마 프리미엄 악세서리 주문서 선택권', cost: 1000, limit: 10, icon: '📜', group: '주문서' },
    { id: 'spell-trace-1000', shop: 'normal', name: '주문의 흔적 1,000개', cost: 100, limit: null, icon: '🧾', group: '주문서', limitNote: '구매 제한 확인 필요' },

    { id: 'sol-erda-fragment-special', shop: 'special', name: '솔 에르다 조각 x10', cost: 1, limit: 10, icon: '💠', group: 'HEXA' },
    { id: 'karma-abyss-flame', shop: 'special', name: '카르마 심연의 환생의 불꽃', cost: 1, limit: 250, icon: '🌈', group: '강화' },
    { id: 'sol-erda-special', shop: 'special', name: '솔 에르다', cost: 3, limit: 20, icon: '✨', group: 'HEXA', priority: true },
    { id: 'karma-black-cube', shop: 'special', name: '카르마 블랙 큐브', cost: 1, limit: 20, icon: '⬛', group: '큐브' },
    { id: 'karma-white-additional-cube', shop: 'special', name: '카르마 화이트 에디셔널 큐브', cost: 2, limit: 20, icon: '⬜', group: '큐브' }
  ];

  const style = document.createElement('style');
  style.textContent = `
.view-tabs{grid-template-columns:repeat(4,1fr)}
.coinshop-tab{position:relative;display:flex;align-items:center;justify-content:center;gap:7px}
.coinshop-lock-badge{display:inline-flex;align-items:center;min-height:21px;padding:2px 7px;border-radius:999px;background:#fff1c7;color:#765300;font-size:.62rem;font-weight:900}
.coinshop-tab.unlocked .coinshop-lock-badge{background:#e8f7ef;color:#176b46}
.coinshop-panel{display:grid;gap:14px}
.coinshop-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.coinshop-head h2{margin:0 0 6px;font-size:1.35rem;font-weight:900;letter-spacing:-.03em}
.coinshop-head p{margin:0;color:var(--muted);font-size:.86rem;line-height:1.65}
.coinshop-private-badge{display:inline-flex;align-items:center;min-height:31px;padding:5px 10px;border:1px solid #ead49a;border-radius:999px;background:#fff7dd;color:#795500;font-size:.73rem;font-weight:900;white-space:nowrap}
.coinshop-dashboard{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(300px,.9fr);gap:12px}
.coinshop-budget-card,.coinshop-draft-card,.coinshop-memo-card{padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
.coinshop-card-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.coinshop-card-title strong{font-size:.96rem;font-weight:900}.coinshop-card-title span{color:var(--muted);font-size:.72rem}
.coinshop-budget-inputs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.coinshop-budget-inputs label{display:grid;gap:6px;color:var(--ink);font-size:.78rem;font-weight:800}
.coinshop-budget-inputs input{width:100%;min-height:44px;padding:0 11px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-weight:800;outline:none}
.coinshop-budget-inputs input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 15%,transparent)}
.coinshop-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
.coinshop-summary{display:grid;gap:3px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}
.coinshop-summary span{color:var(--muted);font-size:.68rem;font-weight:700}.coinshop-summary strong{font-size:1rem;font-weight:900}
.coinshop-summary strong.negative{color:var(--danger)}
.coinshop-draft-card{background:linear-gradient(135deg,color-mix(in srgb,var(--accent2) 65%,var(--surface)),var(--surface))}
.coinshop-draft-card h3{margin:0 0 7px;font-size:1.03rem;font-weight:900}.coinshop-draft-card p{margin:0 0 12px;color:var(--muted);font-size:.82rem;line-height:1.65}
.coinshop-draft-actions{display:flex;flex-wrap:wrap;gap:7px}
.coinshop-category-tabs{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;padding:5px;border:1px solid var(--line);border-radius:12px;background:var(--soft)}
.coinshop-category-tab{min-height:40px;border:0;border-radius:8px;background:transparent;color:var(--muted);font-weight:900;cursor:pointer}
.coinshop-category-tab.active{background:var(--surface);color:var(--ink);box-shadow:0 5px 13px rgba(31,41,55,.07)}
.coinshop-list{display:grid;gap:8px}
.coinshop-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 13px;border:1px solid var(--line);border-radius:13px;background:var(--surface)}
.coinshop-item.priority{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));box-shadow:inset 3px 0 0 var(--accent)}
.coinshop-item-main{display:flex;align-items:center;gap:11px;min-width:0}
.coinshop-icon{display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;border:1px solid var(--line);border-radius:10px;background:var(--soft);font-size:1.15rem;font-weight:900}
.coinshop-item-copy{display:grid;gap:4px;min-width:0}.coinshop-item-copy strong{font-size:.88rem;font-weight:900}.coinshop-item-meta{display:flex;flex-wrap:wrap;gap:5px 9px;color:var(--muted);font-size:.7rem;font-weight:700}
.coinshop-priority-tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:999px;background:var(--accent2);color:var(--accent);font-size:.65rem;font-weight:900}
.coinshop-qty{display:grid;grid-template-columns:32px 68px 32px auto;gap:5px;align-items:center}
.coinshop-qty button,.coinshop-qty input{min-height:34px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);font-weight:900}
.coinshop-qty button{cursor:pointer}.coinshop-qty button:hover{border-color:var(--accent);color:var(--accent)}
.coinshop-qty input{width:68px;padding:0 6px;text-align:center;outline:none}
.coinshop-line-total{min-width:78px;text-align:right;color:var(--accent);font-size:.78rem;font-weight:900}
.coinshop-memo-card textarea{width:100%;min-height:118px;padding:11px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;font-size:.82rem;line-height:1.65;resize:vertical;outline:none}
.coinshop-memo-card textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 15%,transparent)}
.coinshop-footnote{margin:0;color:var(--muted);font-size:.72rem;line-height:1.55}
@media(max-width:900px){.coinshop-dashboard{grid-template-columns:1fr}.coinshop-item{grid-template-columns:1fr}.coinshop-qty{justify-content:start}.coinshop-line-total{text-align:left}}
@media(max-width:700px){.view-tabs{grid-template-columns:repeat(2,1fr)}.coinshop-head{flex-direction:column}.coinshop-budget-inputs{grid-template-columns:1fr}.coinshop-item-main{align-items:flex-start}.coinshop-qty{grid-template-columns:36px 72px 36px auto}.coinshop-item-copy strong{font-size:.84rem}}
@media(max-width:430px){.coinshop-qty{grid-template-columns:34px 64px 34px}.coinshop-line-total{grid-column:1/-1}.coinshop-draft-actions{display:grid}.coinshop-draft-actions .button{width:100%}}
`;
  document.head.append(style);

  const makeDefaultState = () => ({
    category: 'normal',
    budgets: { normal: 0, special: 0 },
    quantities: {},
    memo: DEFAULT_MEMO
  });

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return makeDefaultState();
      return {
        category: parsed.category === 'special' ? 'special' : 'normal',
        budgets: {
          normal: Math.max(0, Math.round(Number(parsed.budgets?.normal) || 0)),
          special: Math.max(0, Math.round(Number(parsed.budgets?.special) || 0))
        },
        quantities: typeof parsed.quantities === 'object' && parsed.quantities ? parsed.quantities : {},
        memo: typeof parsed.memo === 'string' ? parsed.memo : DEFAULT_MEMO
      };
    } catch {
      return makeDefaultState();
    }
  }

  let state = loadState();
  let pendingCoinShopView = false;

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function canAccess() {
    return COIN_SHOP_PUBLIC || (typeof isAdminUnlocked === 'function' && isAdminUnlocked());
  }

  function currencyLabel(shop) {
    return shop === 'special' ? '상급 코인' : '챌린저스 코인';
  }

  function quantityFor(item) {
    const raw = Math.max(0, Math.round(Number(state.quantities[item.id]) || 0));
    return item.limit === null ? raw : Math.min(raw, item.limit);
  }

  function spentFor(shop) {
    return ITEMS.filter((item) => item.shop === shop)
      .reduce((sum, item) => sum + quantityFor(item) * item.cost, 0);
  }

  function insertUi() {
    const nav = document.querySelector('.view-tabs');
    const footer = document.querySelector('.page-note');
    if (!nav || !footer || document.querySelector('[data-view-button="coinshop"]')) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'view-tab coinshop-tab';
    tab.dataset.viewButton = 'coinshop';
    tab.setAttribute('aria-selected', 'false');
    tab.innerHTML = '<span>챌섭 코인샵</span><span class="coinshop-lock-badge">🔒 키라키</span>';
    nav.append(tab);

    const panel = document.createElement('section');
    panel.className = 'view-panel';
    panel.dataset.viewPanel = 'coinshop';
    panel.hidden = true;
    panel.innerHTML = `
      <section class="panel coinshop-panel" aria-labelledby="coinShopTitle">
        <div class="coinshop-head">
          <div>
            <p class="section-kicker">코인샵 기획</p>
            <h2 id="coinShopTitle">챌섭 코인샵</h2>
            <p>구매 수량과 예산을 맞춰보는 내부 작업 화면입니다. 공개 전까지 키라키 모드에서만 열립니다.</p>
          </div>
          <span class="coinshop-private-badge">🔒 키라키 모드 전용 · 공개 준비 중</span>
        </div>

        <div class="coinshop-dashboard">
          <article class="coinshop-budget-card">
            <div class="coinshop-card-title"><strong>보유 코인과 구매 합계</strong><span>직접 입력</span></div>
            <div class="coinshop-budget-inputs">
              <label>챌린저스 코인<input id="coinShopNormalBudget" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label>상급 챌린저스 코인<input id="coinShopSpecialBudget" type="number" min="0" step="1" inputmode="numeric" /></label>
            </div>
            <div class="coinshop-summary-grid">
              <div class="coinshop-summary"><span>일반 사용 / 잔여</span><strong id="coinShopNormalSummary">0 / 0</strong></div>
              <div class="coinshop-summary"><span>상급 사용 / 잔여</span><strong id="coinShopSpecialSummary">0 / 0</strong></div>
            </div>
          </article>

          <article class="coinshop-draft-card">
            <h3>솔 에르다 우선안</h3>
            <p>기운을 먼저 확보해 조각을 바로 소모하고, 남은 코인으로 다른 강화 품목을 얼마나 살 수 있는지 확인하는 안입니다.</p>
            <div class="coinshop-draft-actions">
              <button type="button" class="button primary small" id="coinShopApplySolErda">솔 에르다 최대 담기</button>
              <button type="button" class="button ghost small" id="coinShopClearPlan">구매 수량 초기화</button>
            </div>
          </article>
        </div>

        <div class="coinshop-category-tabs" role="tablist" aria-label="코인샵 종류">
          <button type="button" class="coinshop-category-tab" data-coinshop-category="normal">일반 코인샵</button>
          <button type="button" class="coinshop-category-tab" data-coinshop-category="special">스페셜 코인샵</button>
        </div>
        <div class="coinshop-list" id="coinShopList"></div>

        <article class="coinshop-memo-card">
          <div class="coinshop-card-title"><strong>영상 메모</strong><span>자동 저장</span></div>
          <textarea id="coinShopMemo" aria-label="코인샵 영상 메모"></textarea>
        </article>
        <p class="coinshop-footnote">상품과 가격은 제공된 코인샵 이미지 기준 1차 입력입니다. 수량 제한이 화면에 표시되지 않은 항목은 추후 확인할 수 있습니다.</p>
      </section>`;
    footer.parentNode.insertBefore(panel, footer);

    tab.addEventListener('click', () => setView('coinshop', { scroll: true }));
  }

  function updateTabAccess() {
    const tab = document.querySelector('[data-view-button="coinshop"]');
    if (!tab) return;
    const badge = tab.querySelector('.coinshop-lock-badge');
    const unlocked = canAccess();
    tab.classList.toggle('unlocked', unlocked);
    if (badge) badge.textContent = unlocked ? '키라키 전용' : '🔒 키라키';
  }

  function renderSummary() {
    const normalSpent = spentFor('normal');
    const specialSpent = spentFor('special');
    const normalLeft = state.budgets.normal - normalSpent;
    const specialLeft = state.budgets.special - specialSpent;
    const normal = document.querySelector('#coinShopNormalSummary');
    const special = document.querySelector('#coinShopSpecialSummary');
    if (normal) {
      normal.textContent = `${number.format(normalSpent)} / ${number.format(normalLeft)}`;
      normal.classList.toggle('negative', normalLeft < 0);
    }
    if (special) {
      special.textContent = `${number.format(specialSpent)} / ${number.format(specialLeft)}`;
      special.classList.toggle('negative', specialLeft < 0);
    }
  }

  function renderItems() {
    const list = document.querySelector('#coinShopList');
    if (!list) return;
    const items = ITEMS.filter((item) => item.shop === state.category);
    list.innerHTML = items.map((item) => {
      const qty = quantityFor(item);
      const limitText = item.limit === null ? (item.limitNote || '제한 표기 없음') : `구매 한도 ${number.format(item.limit)}개`;
      return `
        <article class="coinshop-item${item.priority ? ' priority' : ''}" data-coinshop-item="${item.id}">
          <div class="coinshop-item-main">
            <span class="coinshop-icon" aria-hidden="true">${item.icon}</span>
            <div class="coinshop-item-copy">
              <strong>${escapeHtml(item.name)} ${item.priority ? '<span class="coinshop-priority-tag">우선 검토</span>' : ''}</strong>
              <div class="coinshop-item-meta"><span>${escapeHtml(item.group)}</span><span>개당 ${number.format(item.cost)} ${currencyLabel(item.shop)}</span><span>${escapeHtml(limitText)}</span></div>
            </div>
          </div>
          <div class="coinshop-qty">
            <button type="button" data-coinshop-minus="${item.id}" aria-label="${escapeHtml(item.name)} 수량 감소">−</button>
            <input type="number" min="0" ${item.limit === null ? '' : `max="${item.limit}"`} step="1" value="${qty}" data-coinshop-qty="${item.id}" aria-label="${escapeHtml(item.name)} 구매 수량" />
            <button type="button" data-coinshop-plus="${item.id}" aria-label="${escapeHtml(item.name)} 수량 증가">＋</button>
            <span class="coinshop-line-total">${number.format(qty * item.cost)} 코인</span>
          </div>
        </article>`;
    }).join('');

    document.querySelectorAll('[data-coinshop-category]').forEach((button) => {
      button.classList.toggle('active', button.dataset.coinshopCategory === state.category);
    });
    renderSummary();
  }

  function renderState() {
    const normalBudget = document.querySelector('#coinShopNormalBudget');
    const specialBudget = document.querySelector('#coinShopSpecialBudget');
    const memo = document.querySelector('#coinShopMemo');
    if (normalBudget) normalBudget.value = state.budgets.normal;
    if (specialBudget) specialBudget.value = state.budgets.special;
    if (memo) memo.value = state.memo;
    renderItems();
  }

  function changeQuantity(id, nextValue) {
    const item = ITEMS.find((candidate) => candidate.id === id);
    if (!item) return;
    let qty = Math.max(0, Math.round(Number(nextValue) || 0));
    if (item.limit !== null) qty = Math.min(qty, item.limit);
    state.quantities[id] = qty;
    saveState();
    renderItems();
  }

  function bindUi() {
    document.querySelector('#coinShopNormalBudget')?.addEventListener('input', (event) => {
      state.budgets.normal = Math.max(0, Math.round(Number(event.target.value) || 0));
      saveState();
      renderSummary();
    });
    document.querySelector('#coinShopSpecialBudget')?.addEventListener('input', (event) => {
      state.budgets.special = Math.max(0, Math.round(Number(event.target.value) || 0));
      saveState();
      renderSummary();
    });
    document.querySelector('#coinShopMemo')?.addEventListener('input', (event) => {
      state.memo = event.target.value;
      saveState();
    });
    document.querySelector('.coinshop-category-tabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-coinshop-category]');
      if (!button) return;
      state.category = button.dataset.coinshopCategory === 'special' ? 'special' : 'normal';
      saveState();
      renderItems();
    });
    document.querySelector('#coinShopList')?.addEventListener('click', (event) => {
      const minus = event.target.closest('[data-coinshop-minus]');
      const plus = event.target.closest('[data-coinshop-plus]');
      if (minus) return changeQuantity(minus.dataset.coinshopMinus, quantityFor(ITEMS.find((item) => item.id === minus.dataset.coinshopMinus)) - 1);
      if (plus) return changeQuantity(plus.dataset.coinshopPlus, quantityFor(ITEMS.find((item) => item.id === plus.dataset.coinshopPlus)) + 1);
    });
    document.querySelector('#coinShopList')?.addEventListener('change', (event) => {
      const input = event.target.closest('[data-coinshop-qty]');
      if (!input) return;
      changeQuantity(input.dataset.coinshopQty, input.value);
    });
    document.querySelector('#coinShopApplySolErda')?.addEventListener('click', () => {
      ITEMS.filter((item) => item.priority).forEach((item) => { state.quantities[item.id] = item.limit || 0; });
      saveState();
      renderItems();
      toast('솔 에르다 우선안을 구매 계획에 담았습니다.');
    });
    document.querySelector('#coinShopClearPlan')?.addEventListener('click', () => {
      state.quantities = {};
      saveState();
      renderItems();
      toast('코인샵 구매 수량을 초기화했습니다.');
    });
  }

  insertUi();

  const baseSetView = setView;
  setView = function coinShopAwareSetView(view, options = {}) {
    if (view !== 'coinshop') return baseSetView(view, options);
    if (!canAccess()) {
      pendingCoinShopView = true;
      if (typeof openAdminDialog === 'function') openAdminDialog();
      if (typeof toast === 'function') toast('챌섭 코인샵은 현재 키라키 모드에서만 열립니다.');
      return;
    }

    document.querySelectorAll('[data-view-button]').forEach((button) => {
      const active = button.dataset.viewButton === 'coinshop';
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-view-panel]').forEach((panel) => {
      const active = panel.dataset.viewPanel === 'coinshop';
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
    try { sessionStorage.setItem(VIEW_SESSION_KEY, 'coinshop'); } catch {}
    if (options.scroll) document.querySelector('.view-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderState();
  };

  const baseSetAdminUnlocked = setAdminUnlocked;
  setAdminUnlocked = function coinShopAwareUnlock(unlocked) {
    baseSetAdminUnlocked(unlocked);
    updateTabAccess();
    if (!unlocked && document.querySelector('[data-view-panel="coinshop"]')?.classList.contains('active')) {
      baseSetView('dashboard');
    }
    if (unlocked && pendingCoinShopView) {
      pendingCoinShopView = false;
      setTimeout(() => {
        if (typeof closeAdminDialog === 'function') closeAdminDialog();
        setView('coinshop', { scroll: true });
      }, 0);
    }
  };

  updateTabAccess();
  bindUi();
  renderState();
})();
