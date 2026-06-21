(() => {
  'use strict';

  if (window.__kirakiCoinShopLoaded) return;
  window.__kirakiCoinShopLoaded = true;

  const COIN_SHOP_PUBLIC = false;
  const STORAGE_KEY = 'kiraki-challengers-coinshop:v2';
  const DEFAULT_MEMO = [
    '솔 에르다 조각은 많이 풀려도 기운이 없으면 당장 강화가 막힌다.',
    '솔 에르다를 먼저 사서 남는 조각을 빠르게 소모하고 전투력을 앞당기는 방향을 검토한다.',
    '기운을 전부 산 뒤에도 큐브·불꽃·주문서처럼 쓸 만한 품목을 얼마나 살 수 있는지 예산표로 보여준다.'
  ].join('\n');

  const ITEMS = [
    { id: 'black-secondary-box', shop: 'normal', name: '블랙 보조 무기 상자', cost: 100, limit: 1, icon: '상자', group: '장비' },
    { id: 'special-soul-enchanter', shop: 'normal', name: '스페셜 소울 인챈터', cost: 100, limit: 3, icon: '소울', group: '장비' },
    { id: 'triple-exp-coupon', shop: 'normal', name: '경험치 3배 쿠폰 (30분)', cost: 100, limit: 7, icon: 'EXP', group: '성장' },
    { id: 'vip-exp-buff', shop: 'normal', name: 'VIP 버프 (경험치)', cost: 30, limit: null, icon: 'VIP', group: '성장' },
    { id: 'vip-stat-buff', shop: 'normal', name: 'VIP 버프 (능력치)', cost: 30, limit: null, icon: 'VIP', group: '성장' },
    { id: 'karma-black-flame', shop: 'normal', name: '카르마 검은 환생의 불꽃', cost: 50, limit: 1000, icon: '불꽃', group: '강화' },
    { id: 'sol-erda-fragment-normal', shop: 'normal', name: '솔 에르다 조각', cost: 50, limit: 500, icon: '조각', group: 'HEXA' },
    { id: 'sol-erda-normal', shop: 'normal', name: '솔 에르다', cost: 2000, limit: 5, icon: 'SOL', group: 'HEXA', priority: true },
    { id: 'memento-gold-cube', shop: 'normal', name: '메멘토 골드 큐브 (200제)', cost: 100, limit: 50, icon: '골드', group: '큐브' },
    { id: 'memento-silver-cube', shop: 'normal', name: '메멘토 실버 큐브 (200제)', cost: 50, limit: 500, icon: '실버', group: '큐브' },
    { id: 'karma-bronze-additional-cube', shop: 'normal', name: '카르마 브론즈 에디셔널 큐브', cost: 20, limit: 1000, icon: '에디', group: '큐브' },
    { id: 'pet-scroll-selector', shop: 'normal', name: '펫장비 주문서 선택권', cost: 500, limit: 100, icon: '주문', group: '주문서' },
    { id: 'epic-potential-scroll', shop: 'normal', name: '에픽 잠재능력 부여 스크롤 100%', cost: 150, limit: 30, icon: '에픽', group: '주문서' },
    { id: 'additional-potential-scroll', shop: 'normal', name: '에디셔널 잠재능력 부여 스크롤 100%', cost: 150, limit: 30, icon: '에디', group: '주문서' },
    { id: 'karma-premium-pet-scroll', shop: 'normal', name: '카르마 프리미엄 펫장비 주문서 선택권', cost: 1000, limit: 10, icon: '펫', group: '주문서' },
    { id: 'innocent-scroll', shop: 'normal', name: '이노센트 주문서 100%', cost: 50, limit: 10, icon: '이노', group: '주문서' },
    { id: 'clean-slate-scroll', shop: 'normal', name: '순백의 주문서 100%', cost: 100, limit: 10, icon: '순백', group: '주문서' },
    { id: 'karma-starforce-17', shop: 'normal', name: '카르마 스타포스 17성 강화권 (160제)', cost: 3000, limit: 3, icon: '17성', group: '강화' },
    { id: 'karma-premium-accessory-scroll', shop: 'normal', name: '카르마 프리미엄 악세서리 주문서 선택권', cost: 1000, limit: 10, icon: '악세', group: '주문서' },
    { id: 'spell-trace-1000', shop: 'normal', name: '주문의 흔적 1,000개', cost: 100, limit: null, icon: '흔적', group: '주문서', limitNote: '구매 제한 확인 필요' },
    { id: 'sol-erda-fragment-special', shop: 'special', name: '솔 에르다 조각 x10', cost: 1, limit: 10, icon: '조각', group: 'HEXA' },
    { id: 'karma-abyss-flame', shop: 'special', name: '카르마 심연의 환생의 불꽃', cost: 1, limit: 250, icon: '불꽃', group: '강화' },
    { id: 'sol-erda-special', shop: 'special', name: '솔 에르다', cost: 3, limit: 20, icon: 'SOL', group: 'HEXA', priority: true },
    { id: 'karma-black-cube', shop: 'special', name: '카르마 블랙 큐브', cost: 1, limit: 20, icon: '블랙', group: '큐브' },
    { id: 'karma-white-additional-cube', shop: 'special', name: '카르마 화이트 에디셔널 큐브', cost: 2, limit: 20, icon: '화에', group: '큐브' }
  ];

  const SEASON_MISSION_GROUPS = [
    { id: 'authentic-symbol', category: '어센틱', name: '어센틱심볼 성장', steps: [
      { label: '어센틱심볼 5레벨 달성', coins: 100 },
      { label: '어센틱심볼 추가 성장 달성', coins: 300 }
    ] },
    { id: 'authentic-daily', category: '어센틱', name: '어센틱 일일 퀘스트', steps: [
      { label: '어센틱 지역 일일 퀘스트 보상 획득', coins: 500 }
    ] },
    { id: 'arcane-force', category: '아케인포스', name: '아케인심볼 총합', steps: [
      { label: '아케인심볼 성장 레벨 총합 60레벨', coins: 100 },
      { label: '아케인심볼 성장 레벨 총합 80레벨', coins: 300 },
      { label: '아케인심볼 성장 레벨 총합 100레벨', coins: 500 },
      { label: '아케인심볼 성장 레벨 총합 120레벨', coins: 1000 }
    ] },
    { id: 'authentic-force', category: '어센틱포스', name: '어센틱심볼 총합', steps: [
      { label: '어센틱심볼 성장 레벨 총합 20레벨', coins: 100 },
      { label: '어센틱심볼 성장 레벨 총합 25레벨', coins: 100 },
      { label: '어센틱심볼 성장 레벨 총합 30레벨', coins: 300 },
      { label: '어센틱심볼 성장 레벨 총합 35레벨', coins: 300 },
      { label: '어센틱심볼 성장 레벨 총합 40레벨', coins: 500 }
    ] },
    { id: 'gear-emblem-legendary', category: '장비', name: '엠블렘 잠재', steps: [
      { label: '잠재능력 레전드리 엠블렘 장착', coins: 1000 }
    ] },
    { id: 'gear-secondary-legendary', category: '장비', name: '보조무기 잠재', steps: [
      { label: '잠재능력 레전드리 보조 무기 장착', coins: 1000 }
    ] },
    { id: 'gear-emblem-additional', category: '장비', name: '엠블렘 에디', steps: [
      { label: '에디셔널 잠재능력 유니크 이상 엠블렘 장착', coins: 500 }
    ] },
    { id: 'gear-secondary-additional', category: '장비', name: '보조무기 에디', steps: [
      { label: '에디셔널 잠재능력 유니크 이상 보조 무기 장착', coins: 500 }
    ] },
    { id: 'fifth-job-core', category: '5차 스킬', name: '직업 코어', steps: [
      { label: '직업 코어 2개 이상 30레벨', coins: 100 },
      { label: '직업 코어 4개 이상 30레벨', coins: 300 }
    ] },
    { id: 'fifth-enhance-core', category: '5차 스킬', name: '강화 코어', steps: [
      { label: '강화 코어 2개 이상 60레벨', coins: 100 },
      { label: '강화 코어 4개 이상 60레벨', coins: 300 }
    ] },
    { id: 'hexa-skill', category: 'HEXA 스킬', name: 'HEXA 스킬', steps: [
      { label: 'HEXA 스킬 활성화', coins: 300 },
      { label: '솔 에르다 조각 300개 이상 사용', coins: 100 },
      { label: '솔 에르다 조각 600개 이상 사용', coins: 300 },
      { label: '솔 에르다 조각 900개 이상 사용', coins: 300 },
      { label: '솔 에르다 조각 1,200개 이상 사용', coins: 500 },
      { label: '솔 에르다 조각 1,500개 이상 사용', coins: 500 },
      { label: '솔 에르다 조각 1,800개 이상 사용', coins: 1000 }
    ] },
    { id: 'combat-power', category: '전투력', name: '전투력', steps: [
      { label: '전투력 100만 달성', coins: 100 },
      { label: '전투력 3,000만 달성', coins: 300 },
      { label: '전투력 5,000만 달성', coins: 300 },
      { label: '전투력 7,000만 달성', coins: 500 },
      { label: '전투력 1억 달성', coins: 1000 }
    ] },
    { id: 'genesis-liberation', category: '무기 해방', name: '제네시스 해방', steps: [
      { label: '제네시스 1차 해방하기', coins: 500 },
      { label: '제네시스 2차 해방하기', coins: 1000 }
    ] }
  ];

  const BOSS_NORMAL_COINS_BY_POINTS = new Map([
    [100, 100],
    [200, 100],
    [250, 200],
    [300, 200],
    [400, 200],
    [500, 200],
    [1000, 300],
    [1500, 400],
    [2000, 600],
    [2500, 600],
    [3000, 1000],
    [5000, 1200],
    [6000, 1400],
    [7000, 2000],
    [9000, 3000]
  ]);

  const BOSS_SPECIAL_COINS_BY_POINTS = new Map([
    [5000, 10],
    [6000, 20],
    [7000, 30],
    [9000, 60]
  ]);

  const nf = typeof number !== 'undefined' ? number : new Intl.NumberFormat('ko-KR');
  const safeText = typeof escapeHtml === 'function'
    ? escapeHtml
    : (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  let state = loadState();
  let pendingCoinShopView = false;
  let saveTimer = null;

  function installStyles() {
    if (document.querySelector('#kirakiCoinShopStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiCoinShopStyles';
    style.textContent = `
.view-tabs{grid-template-columns:repeat(auto-fit,minmax(132px,1fr))}.coinshop-tab{position:relative;display:flex;align-items:center;justify-content:center;gap:7px}.coinshop-lock-badge{display:inline-flex;align-items:center;min-height:21px;padding:2px 7px;border-radius:999px;background:#fff1c7;color:#765300;font-size:.62rem;font-weight:900}.coinshop-tab.unlocked .coinshop-lock-badge{background:#e8f7ef;color:#176b46}.coinshop-panel{display:grid;gap:14px}.coinshop-panel *{box-sizing:border-box}.coinshop-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.coinshop-head h2{margin:0 0 6px;font-size:1.35rem;font-weight:900;letter-spacing:0}.coinshop-head p{margin:0;color:var(--muted);font-size:.86rem;line-height:1.65}.coinshop-private-badge{display:inline-flex;align-items:center;min-height:31px;padding:5px 10px;border:1px solid #ead49a;border-radius:999px;background:#fff7dd;color:#795500;font-size:.73rem;font-weight:900;white-space:nowrap}.coinshop-income-card,.coinshop-budget-card,.coinshop-draft-card,.coinshop-memo-card{padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}.coinshop-income-card{display:grid;gap:13px;background:linear-gradient(135deg,color-mix(in srgb,#e8fbff 72%,var(--surface)),var(--surface));border-color:color-mix(in srgb,#38bdf8 34%,var(--line))}.coinshop-card-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.coinshop-card-title strong{font-size:.96rem;font-weight:900}.coinshop-card-title span{color:var(--muted);font-size:.72rem}.coinshop-income-card .coinshop-card-title{margin-bottom:0}.coinshop-income-card .coinshop-card-title span{color:#036985;font-weight:850}.coinshop-income-main{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:12px}.coinshop-income-total{display:grid;align-content:center;gap:6px;min-height:132px;padding:16px;border:1px solid color-mix(in srgb,#38bdf8 38%,var(--line));border-radius:12px;background:var(--surface)}.coinshop-income-total span{color:var(--muted);font-size:.76rem;font-weight:850}.coinshop-income-total strong{color:#036985;font-size:2rem;font-weight:950;line-height:1}.coinshop-income-total small{color:var(--muted);font-size:.72rem;font-weight:750;line-height:1.45}.coinshop-income-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.coinshop-income-metric{display:grid;gap:4px;min-height:72px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}.coinshop-income-metric span{color:var(--muted);font-size:.68rem;font-weight:850}.coinshop-income-metric strong{font-size:1rem;font-weight:950}.coinshop-income-metric.special strong{color:#6d4bd8}.coinshop-season-panel{display:grid;gap:10px}.coinshop-season-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px}.coinshop-season-heading strong{font-size:.9rem;font-weight:950}.coinshop-season-heading span{color:var(--muted);font-size:.7rem;font-weight:800}.coinshop-season-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.coinshop-season-select{display:grid;gap:7px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}.coinshop-season-select-title{display:flex;align-items:center;justify-content:space-between;gap:8px}.coinshop-season-select-title strong{font-size:.76rem;font-weight:950}.coinshop-season-select-title small{display:inline-flex;align-items:center;min-height:20px;padding:2px 7px;border-radius:999px;background:color-mix(in srgb,#38bdf8 14%,var(--soft));color:#036985;font-size:.62rem;font-weight:950;white-space:nowrap}.coinshop-season-select select{width:100%;min-height:38px;padding:0 9px;border:1px solid var(--line);border-radius:8px;background:var(--soft);color:var(--ink);font-weight:850;outline:none}.coinshop-season-select select:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.16)}.coinshop-season-earned{color:#036985;font-size:.68rem;font-weight:950}.coinshop-dashboard{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(300px,.92fr);gap:12px}.coinshop-budget-inputs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.coinshop-budget-inputs label{display:grid;gap:6px;color:var(--ink);font-size:.78rem;font-weight:800}.coinshop-budget-inputs input{width:100%;min-height:44px;padding:0 11px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-weight:800;outline:none}.coinshop-budget-inputs input:focus,.coinshop-memo-card textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 15%,transparent)}.coinshop-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.coinshop-summary{display:grid;gap:3px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}.coinshop-summary span{color:var(--muted);font-size:.68rem;font-weight:700}.coinshop-summary strong{font-size:1rem;font-weight:900}.coinshop-summary strong.negative{color:var(--danger)}.coinshop-draft-card{background:linear-gradient(135deg,color-mix(in srgb,var(--accent2) 65%,var(--surface)),var(--surface))}.coinshop-draft-card h3{margin:0 0 7px;font-size:1.03rem;font-weight:900;letter-spacing:0}.coinshop-draft-card p{margin:0 0 12px;color:var(--muted);font-size:.82rem;line-height:1.65}.coinshop-draft-actions{display:flex;flex-wrap:wrap;gap:7px}.coinshop-category-tabs{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;padding:5px;border:1px solid var(--line);border-radius:12px;background:var(--soft)}.coinshop-category-tab{min-height:40px;border:0;border-radius:8px;background:transparent;color:var(--muted);font-weight:900;cursor:pointer}.coinshop-category-tab.active{background:var(--surface);color:var(--ink);box-shadow:0 5px 13px rgba(31,41,55,.07)}.coinshop-list{display:grid;gap:8px}.coinshop-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 13px;border:1px solid var(--line);border-radius:13px;background:var(--surface)}.coinshop-item.priority{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));box-shadow:inset 3px 0 0 var(--accent)}.coinshop-item-main{display:flex;align-items:center;gap:11px;min-width:0}.coinshop-icon{display:grid;place-items:center;width:44px;height:44px;flex:0 0 44px;border:1px solid var(--line);border-radius:10px;background:var(--soft);font-size:.72rem;font-weight:900;line-height:1.1;text-align:center}.coinshop-item-copy{display:grid;gap:4px;min-width:0}.coinshop-item-copy strong{font-size:.88rem;font-weight:900;line-height:1.35}.coinshop-item-meta{display:flex;flex-wrap:wrap;gap:5px 9px;color:var(--muted);font-size:.7rem;font-weight:700}.coinshop-priority-tag{display:inline-flex;align-items:center;margin-left:5px;padding:2px 7px;border-radius:999px;background:var(--accent2);color:var(--accent);font-size:.65rem;font-weight:900}.coinshop-qty{display:grid;grid-template-columns:32px 68px 32px auto;gap:5px;align-items:center}.coinshop-qty button,.coinshop-qty input{min-height:34px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);font-weight:900}.coinshop-qty button{cursor:pointer}.coinshop-qty button:hover{border-color:var(--accent);color:var(--accent)}.coinshop-qty input{width:68px;padding:0 6px;text-align:center;outline:none}.coinshop-line-total{min-width:78px;text-align:right;color:var(--accent);font-size:.78rem;font-weight:900}.coinshop-memo-card textarea{width:100%;min-height:118px;padding:11px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font:inherit;font-size:.82rem;line-height:1.65;resize:vertical;outline:none}.coinshop-footnote{margin:0;color:var(--muted);font-size:.72rem;line-height:1.55}
@media(max-width:1020px){.coinshop-income-main{grid-template-columns:1fr}.coinshop-season-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.coinshop-income-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:900px){.coinshop-dashboard{grid-template-columns:1fr}.coinshop-item{grid-template-columns:1fr}.coinshop-qty{justify-content:start}.coinshop-line-total{text-align:left}}
@media(max-width:700px){.view-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.coinshop-head{flex-direction:column}.coinshop-budget-inputs,.coinshop-season-grid,.coinshop-income-grid{grid-template-columns:1fr}.coinshop-item-main{align-items:flex-start}.coinshop-qty{grid-template-columns:36px 72px 36px auto}.coinshop-item-copy strong{font-size:.84rem}.coinshop-income-total strong{font-size:1.65rem}}
@media(max-width:430px){.view-tabs{grid-template-columns:1fr}.coinshop-qty{grid-template-columns:34px 64px 34px}.coinshop-line-total{grid-column:1/-1}.coinshop-draft-actions{display:grid}.coinshop-draft-actions .button{width:100%}}`;
    document.head.append(style);
  }

  function normalizeSeasonSelections(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    return Object.fromEntries(SEASON_MISSION_GROUPS.map((group) => {
      const value = Math.round(Number(source[group.id]));
      const selected = Number.isFinite(value) ? Math.min(Math.max(value, -1), group.steps.length - 1) : -1;
      return [group.id, selected];
    }));
  }

  function makeDefaultState() {
    return { category: 'normal', budgets: { normal: 0, special: 0 }, seasonMissions: normalizeSeasonSelections(), quantities: {}, memo: DEFAULT_MEMO };
  }

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
        seasonMissions: normalizeSeasonSelections(parsed.seasonMissions),
        quantities: parsed.quantities && typeof parsed.quantities === 'object' ? parsed.quantities : {},
        memo: typeof parsed.memo === 'string' ? parsed.memo : DEFAULT_MEMO
      };
    } catch {
      return makeDefaultState();
    }
  }

  function saveStateSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    }, 500);
  }

  function saveStateNow() {
    clearTimeout(saveTimer);
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
    return ITEMS.filter((item) => item.shop === shop).reduce((sum, item) => sum + quantityFor(item) * item.cost, 0);
  }

  function activeProfileSafe() {
    try { return typeof activeProfile === 'function' ? activeProfile() : null; } catch { return null; }
  }

  function levelMissionCoins() {
    const profile = activeProfileSafe();
    if (!profile) return 0;
    if (typeof levelPoints === 'function') return levelPoints(profile.level);
    const data = typeof DATA !== 'undefined' ? DATA : window.CHALLENGERS_DATA;
    return (data?.levelMissions || [])
      .filter((mission) => mission.level <= profile.level)
      .reduce((sum, mission) => sum + (Number(mission.points) || 0), 0);
  }

  function selectedBossMissions() {
    const profile = activeProfileSafe();
    if (!profile) return [];
    const data = typeof DATA !== 'undefined' ? DATA : window.CHALLENGERS_DATA;
    const byBossId = new Map((data?.bossMissions || []).map((boss) => [boss.id, boss]));
    return [...new Set(profile.clearedBossIds || [])]
      .map((id) => byBossId.get(id))
      .filter(Boolean);
  }

  function bossNormalCoinsFor(boss) {
    return BOSS_NORMAL_COINS_BY_POINTS.get(Number(boss?.points) || 0) || 0;
  }

  function bossSpecialCoinsFor(boss) {
    return BOSS_SPECIAL_COINS_BY_POINTS.get(Number(boss?.points) || 0) || 0;
  }

  function bossMissionCoins() {
    return selectedBossMissions().reduce((sum, boss) => sum + bossNormalCoinsFor(boss), 0);
  }

  function bossMissionSpecialCoins() {
    return selectedBossMissions().reduce((sum, boss) => sum + bossSpecialCoinsFor(boss), 0);
  }

  function selectedSeasonIndex(group) {
    const value = Math.round(Number(state.seasonMissions?.[group.id]));
    if (!Number.isFinite(value)) return -1;
    return Math.min(Math.max(value, -1), group.steps.length - 1);
  }

  function seasonCoinsForGroup(group) {
    const index = selectedSeasonIndex(group);
    if (index < 0) return 0;
    return group.steps.slice(0, index + 1).reduce((sum, step) => sum + step.coins, 0);
  }

  function seasonMissionCoins() {
    return SEASON_MISSION_GROUPS.reduce((sum, group) => sum + seasonCoinsForGroup(group), 0);
  }

  function completedSeasonMissionCount() {
    return SEASON_MISSION_GROUPS.reduce((sum, group) => sum + Math.max(0, selectedSeasonIndex(group) + 1), 0);
  }

  function availableNormalBudget() {
    return levelMissionCoins() + bossMissionCoins() + seasonMissionCoins() + state.budgets.normal;
  }

  function availableSpecialBudget() {
    return bossMissionSpecialCoins() + state.budgets.special;
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
    tab.innerHTML = '<span>챌섭 코인샵</span><span class="coinshop-lock-badge">키라키</span>';
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
            <p>현재 캐릭터의 레벨·보스 진행도와 시즌 미션 선택을 합쳐 구매 예산을 계산합니다.</p>
          </div>
          <span class="coinshop-private-badge">키라키 모드 전용 · 공개 준비 중</span>
        </div>
        <article class="coinshop-income-card" aria-labelledby="coinShopIncomeTitle">
          <div class="coinshop-card-title"><strong id="coinShopIncomeTitle">코인 지급 계산</strong><span>레벨·보스 자동 반영 + 시즌 미션 선택</span></div>
          <div class="coinshop-income-main">
            <div class="coinshop-income-total">
              <span>예상 챌린저스 코인</span>
              <strong id="coinShopEstimatedTotal">0</strong>
              <small id="coinShopEstimatedMeta">시즌 미션 0개 · 상급 0개</small>
            </div>
            <div class="coinshop-income-grid">
              <div class="coinshop-income-metric"><span>레벨 미션</span><strong id="coinShopLevelCoins">0</strong></div>
              <div class="coinshop-income-metric"><span>보스 미션</span><strong id="coinShopBossCoins">0</strong></div>
              <div class="coinshop-income-metric special"><span>상급 보스</span><strong id="coinShopBossSpecialCoins">0</strong></div>
              <div class="coinshop-income-metric"><span>시즌 미션</span><strong id="coinShopSeasonCoins">0</strong></div>
              <div class="coinshop-income-metric"><span>수동 보정</span><strong id="coinShopAdjustCoins">0</strong></div>
            </div>
          </div>
          <div class="coinshop-season-panel">
            <div class="coinshop-season-heading"><strong>시즌 미션 입력</strong><span>선택한 단계까지 같은 파트 하위 미션을 자동 합산합니다.</span></div>
            <div class="coinshop-season-grid" id="coinShopSeasonMissions"></div>
          </div>
        </article>
        <div class="coinshop-dashboard">
          <article class="coinshop-budget-card">
            <div class="coinshop-card-title"><strong>보유 코인과 구매 합계</strong><span>예상 지급 + 보정값</span></div>
            <div class="coinshop-budget-inputs">
              <label><span>수동 보정 코인</span><input id="coinShopNormalBudget" type="number" min="0" step="1" inputmode="numeric" /></label>
              <label><span>상급 보정 코인</span><input id="coinShopSpecialBudget" type="number" min="0" step="1" inputmode="numeric" /></label>
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
          <div class="coinshop-card-title"><strong>영상 메모</strong><span>짧은 지연 저장</span></div>
          <textarea id="coinShopMemo" aria-label="코인샵 영상 메모"></textarea>
        </article>
        <p class="coinshop-footnote">보스 미션은 첨부된 보스 코인 지급표 기준으로 일반·상급 코인을 분리해 계산합니다. 레벨 미션은 현재 계산기의 레벨 지급값을 사용합니다.</p>
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
    if (badge) badge.textContent = unlocked ? '전용 열림' : '키라키';
  }

  function renderIncome() {
    const levelCoins = levelMissionCoins();
    const bossCoins = bossMissionCoins();
    const bossSpecialCoins = bossMissionSpecialCoins();
    const seasonCoins = seasonMissionCoins();
    const adjusted = state.budgets.normal;
    const total = levelCoins + bossCoins + seasonCoins + adjusted;
    const fields = [
      ['#coinShopEstimatedTotal', total],
      ['#coinShopLevelCoins', levelCoins],
      ['#coinShopBossCoins', bossCoins],
      ['#coinShopBossSpecialCoins', bossSpecialCoins],
      ['#coinShopSeasonCoins', seasonCoins],
      ['#coinShopAdjustCoins', adjusted]
    ];
    fields.forEach(([selector, value]) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = nf.format(value);
    });
    const meta = document.querySelector('#coinShopEstimatedMeta');
    if (meta) meta.textContent = `시즌 미션 ${completedSeasonMissionCount()}개 · 상급 ${nf.format(bossSpecialCoins)}개`;
  }

  function renderSeasonMissions() {
    const wrap = document.querySelector('#coinShopSeasonMissions');
    if (!wrap) return;
    wrap.innerHTML = SEASON_MISSION_GROUPS.map((group) => {
      const selected = selectedSeasonIndex(group);
      const earned = seasonCoinsForGroup(group);
      let cumulative = 0;
      const options = [`<option value="-1"${selected < 0 ? ' selected' : ''}>미완료</option>`]
        .concat(group.steps.map((step, index) => {
          cumulative += step.coins;
          const label = group.steps.length === 1
            ? `${step.label} 완료 · +${nf.format(cumulative)}`
            : `${step.label}까지 · 누적 ${nf.format(cumulative)}`;
          return `<option value="${index}"${selected === index ? ' selected' : ''}>${safeText(label)}</option>`;
        })).join('');
      return `
        <label class="coinshop-season-select">
          <span class="coinshop-season-select-title"><strong>${safeText(group.name)}</strong><small>${safeText(group.category)}</small></span>
          <select data-season-mission="${safeText(group.id)}" aria-label="${safeText(group.name)} 시즌 미션 진행도">
            ${options}
          </select>
          <span class="coinshop-season-earned">반영 ${nf.format(earned)} 코인</span>
        </label>`;
    }).join('');
  }

  function renderSummary() {
    const normalSpent = spentFor('normal');
    const specialSpent = spentFor('special');
    const normalLeft = availableNormalBudget() - normalSpent;
    const specialLeft = availableSpecialBudget() - specialSpent;
    const normal = document.querySelector('#coinShopNormalSummary');
    const special = document.querySelector('#coinShopSpecialSummary');
    if (normal) {
      normal.textContent = `${nf.format(normalSpent)} / ${nf.format(normalLeft)}`;
      normal.classList.toggle('negative', normalLeft < 0);
    }
    if (special) {
      special.textContent = `${nf.format(specialSpent)} / ${nf.format(specialLeft)}`;
      special.classList.toggle('negative', specialLeft < 0);
    }
  }

  function renderItems() {
    const list = document.querySelector('#coinShopList');
    if (!list) return;
    const items = ITEMS.filter((item) => item.shop === state.category);
    list.innerHTML = items.map((item) => {
      const qty = quantityFor(item);
      const limitText = item.limit === null ? (item.limitNote || '제한 표기 없음') : `구매 한도 ${nf.format(item.limit)}개`;
      const priority = item.priority ? '<span class="coinshop-priority-tag">우선 검토</span>' : '';
      return `
        <article class="coinshop-item${item.priority ? ' priority' : ''}" data-coinshop-item="${safeText(item.id)}">
          <div class="coinshop-item-main">
            <span class="coinshop-icon" aria-hidden="true">${safeText(item.icon)}</span>
            <div class="coinshop-item-copy">
              <strong>${safeText(item.name)}${priority}</strong>
              <div class="coinshop-item-meta"><span>${safeText(item.group)}</span><span>개당 ${nf.format(item.cost)} ${currencyLabel(item.shop)}</span><span>${safeText(limitText)}</span></div>
            </div>
          </div>
          <div class="coinshop-qty">
            <button type="button" data-coinshop-minus="${safeText(item.id)}" aria-label="${safeText(item.name)} 수량 감소">−</button>
            <input type="number" min="0" ${item.limit === null ? '' : `max="${item.limit}"`} step="1" value="${qty}" data-coinshop-qty="${safeText(item.id)}" aria-label="${safeText(item.name)} 구매 수량" />
            <button type="button" data-coinshop-plus="${safeText(item.id)}" aria-label="${safeText(item.name)} 수량 증가">＋</button>
            <span class="coinshop-line-total">${nf.format(qty * item.cost)} 코인</span>
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
    renderIncome();
    renderSeasonMissions();
    renderItems();
  }

  function changeQuantity(id, nextValue) {
    const item = ITEMS.find((candidate) => candidate.id === id);
    if (!item) return;
    let qty = Math.max(0, Math.round(Number(nextValue) || 0));
    if (item.limit !== null) qty = Math.min(qty, item.limit);
    state.quantities[item.id] = qty;
    saveStateNow();
    renderItems();
  }

  function bindUi() {
    document.querySelector('#coinShopNormalBudget')?.addEventListener('input', (event) => {
      state.budgets.normal = Math.max(0, Math.round(Number(event.target.value) || 0));
      saveStateSoon();
      renderIncome();
      renderSummary();
    });
    document.querySelector('#coinShopSpecialBudget')?.addEventListener('input', (event) => {
      state.budgets.special = Math.max(0, Math.round(Number(event.target.value) || 0));
      saveStateSoon();
      renderSummary();
    });
    document.querySelector('#coinShopMemo')?.addEventListener('input', (event) => {
      state.memo = event.target.value;
      saveStateSoon();
    });
    document.querySelector('#coinShopSeasonMissions')?.addEventListener('change', (event) => {
      const select = event.target.closest('[data-season-mission]');
      if (!select) return;
      const group = SEASON_MISSION_GROUPS.find((item) => item.id === select.dataset.seasonMission);
      if (!group) return;
      state.seasonMissions[group.id] = Math.min(Math.max(Math.round(Number(select.value)), -1), group.steps.length - 1);
      saveStateNow();
      renderState();
    });
    document.querySelector('.coinshop-category-tabs')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-coinshop-category]');
      if (!button) return;
      state.category = button.dataset.coinshopCategory === 'special' ? 'special' : 'normal';
      saveStateNow();
      renderItems();
    });
    document.querySelector('#coinShopList')?.addEventListener('click', (event) => {
      const minus = event.target.closest('[data-coinshop-minus]');
      const plus = event.target.closest('[data-coinshop-plus]');
      if (minus) {
        const item = ITEMS.find((candidate) => candidate.id === minus.dataset.coinshopMinus);
        if (item) changeQuantity(item.id, quantityFor(item) - 1);
        return;
      }
      if (plus) {
        const item = ITEMS.find((candidate) => candidate.id === plus.dataset.coinshopPlus);
        if (item) changeQuantity(item.id, quantityFor(item) + 1);
      }
    });
    document.querySelector('#coinShopList')?.addEventListener('change', (event) => {
      const input = event.target.closest('[data-coinshop-qty]');
      if (input) changeQuantity(input.dataset.coinshopQty, input.value);
    });
    document.querySelector('#coinShopApplySolErda')?.addEventListener('click', () => {
      ITEMS.filter((item) => item.priority).forEach((item) => { state.quantities[item.id] = item.limit || 0; });
      saveStateNow();
      renderItems();
      if (typeof toast === 'function') toast('솔 에르다 우선안을 구매 계획에 담았습니다.');
    });
    document.querySelector('#coinShopClearPlan')?.addEventListener('click', () => {
      state.quantities = {};
      saveStateNow();
      renderItems();
      if (typeof toast === 'function') toast('코인샵 구매 수량을 초기화했습니다.');
    });
  }

  function wrapRender() {
    if (window.__kirakiCoinShopRenderWrapped || typeof render !== 'function') return;
    window.__kirakiCoinShopRenderWrapped = true;
    const baseRender = render;
    render = function coinShopAwareRender(...args) {
      const result = baseRender.apply(this, args);
      renderState();
      return result;
    };
  }

  installStyles();
  insertUi();
  wrapRender();

  const baseSetView = setView;
  setView = function coinShopAwareSetView(nextView, options = {}) {
    if (nextView !== 'coinshop') return baseSetView(nextView, options);
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

  try {
    if (sessionStorage.getItem(VIEW_SESSION_KEY) === 'coinshop') setTimeout(() => setView('coinshop'), 0);
  } catch {}
})();
