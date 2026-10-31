const DATA_PATHS = {
  items: './data/items.json',
  auction: './data/auction-prices.json',
  notices: './data/cashshop-notices.json',
  saleItems: './data/cashshop-sale-items.json',
  collections: './data/collections.json',
  creditShop: './data/credit-shop.json',
  priceHistory: './data/price-history.json'
};

const SHEET_MARKET_SOURCE = Object.freeze({
  spreadsheetId: '1w8z0vlDyOzAqWgya0TPfL2mP8Ah01qAWiOIM8Gtzezs',
  gid: '229558034',
  range: 'A1:F500'
});
const SHEET_REFRESH_INTERVAL_MS = 30000;

const SETTINGS_KEY = 'maple-cash-value-settings-v2';
const LOCAL_DATA_KEY = 'maple-cash-value-local-data-v1';
// 화면 보기 선택(휴지기 포함 여부). 계산 설정과 섞지 않는다 — 설정은 내보내기에 실린다.
const VIEW_KEY = 'maple-cash-value-view-v1';
// 화면 밝기 선택. index.html 머리의 짧은 스크립트가 같은 키를 읽어 깜빡임을 막는다.
const THEME_KEY = 'maple-cash-value-theme';
// 순위 탭과 재판매 대기 목록이 처음에 보여 주는 줄 수.
const RANK_LIST_LIMIT = 10;
const WAITING_LIST_LIMIT = 20;
// 남은 마일리지를 쓸 때 치는 값. 새로 쌓이는 것은 메이플크레딧이라 이 값을 쓰지 않는다.
const FIXED_MILEAGE_MESO_RATE = 10000;
// 2026-09-17 부터 넥슨캐시 구매액의 5%가 메이플크레딧으로 쌓인다. 값은 credit-shop.json 이 덮어쓴다.
const DEFAULT_CREDIT_SHOP = Object.freeze({ earnRate: .05, minCashPrice: 10, mileageEndsAt: '2026-11-19T00:00:00+09:00', items: [] });
const MESO_INPUT_UNIT = 100000000;
const MESO_PRECISION = 1000000;
const REFERENCE_CATEGORY = '마일리지 구매 참고';
// 이 일수를 넘긴 근거는 판매가 후보에서 뺀다. PRICE_VERIFICATION.md 4절 참고.
const EVIDENCE_STALE_DAYS = 14;
// 3개월 체결이 이보다 적거나 매물이 3건 미만이면 '거래 적음'을 붙인다. 순위에서 빼지는 않는다.
const LOW_SALE_COUNT = 200;
const LOW_LISTING_COUNT = 3;
// 이 건수 이하의 매물이 유일한 근거이면 순위를 매기지 않는다.
const THIN_LISTING_COUNT = 2;
const DEFAULT_SETTINGS = {
  baseMpRate: 6990,
  discountRate: 6,
  ahFeeRate: 5
};

const AUCTION_STATUS_OPTIONS = Object.freeze([
  ['live', '가격 있음'],
  ['seed', '기본값'],
  ['no_listing', '매물 없음'],
  ['no_candidate', '정확한 품목 없음'],
  ['unverified', '미확인']
]);

const AUCTION_STATUS_LABELS = Object.freeze(Object.fromEntries(AUCTION_STATUS_OPTIONS));
const JOB_GROUP_OPTIONS = Object.freeze([
  ['all', '전체 직업군', null],
  ['adventurer', '모험가', '패키지 · 모험가'],
  ['cygnus', '시그너스', '패키지 · 시그너스'],
  ['hero', '영웅', '패키지 · 영웅'],
  ['resistance', '레지스탕스', '패키지 · 레지스탕스'],
  ['demon', '데몬', '패키지 · 데몬'],
  ['nova', '노바', '패키지 · 노바'],
  ['lef', '레프', '패키지 · 레프'],
  ['anima', '아니마', '패키지 · 아니마'],
  ['transcendent', '초월자', '패키지 · 초월자'],
  ['friends', '프렌즈 월드', '패키지 · 프렌즈 월드']
]);

const JOB_PACKAGE_CATEGORIES = Object.freeze(JOB_GROUP_OPTIONS.map(([, , category]) => category).filter(Boolean));
const MAJOR_FILTER_OPTIONS = Object.freeze([
  ['all', '전체', null],
  ['job', '직업 코디', JOB_PACKAGE_CATEGORIES],
  ['boss', '보스 코디', ['패키지 · 보스']],
  ['gold', '금손·은손', ['패키지 · 금손 은손', '패키지 · 금손 은손 펫']],
  ['coupon', '쿠폰', ['쿠폰']],
  ['basic', '기본·확률형', ['기본', '랜덤']],
  ['mileage', '마일리지 참고', [REFERENCE_CATEGORY]]
]);

const BONUS_COMPONENTS_BY_PACKAGE = Object.freeze({
  '레지스탕스 와일드헌터 패키지(남)': ['레지스탕스 와일드헌터 글러브'],
  '레지스탕스 와일드헌터 패키지(여)': ['레지스탕스 와일드헌터 글러브'],
  '레지스탕스 제논 패키지(남)': ['레지스탕스 제논 얼굴장식'],
  '레지스탕스 제논 패키지(여)': ['레지스탕스 제논 얼굴장식'],
  '빛의 기사단장 미하일 패키지': ['기사단장 미하일 방패', '기사단장 미하일 이펙트'],
  '불의 기사단장 오즈 패키지(남)': ['기사단장 오즈 이펙트'],
  '불의 기사단장 오즈 패키지(여)': ['기사단장 오즈 이펙트'],
  '바람의 기사단장 이리나 패키지(남)': ['기사단장 이리나 이펙트'],
  '바람의 기사단장 이리나 패키지(여)': ['기사단장 이리나 이펙트'],
  '어둠의 기사단장 이카르트 패키지(남)': ['기사단장 이카르트 이펙트'],
  '어둠의 기사단장 이카르트 패키지(여)': ['기사단장 이카르트 이펙트'],
  '번개의 기사단장 호크아이 패키지(남)': ['기사단장 호크아이 이펙트'],
  '번개의 기사단장 호크아이 패키지(여)': ['기사단장 호크아이 이펙트'],
  '책사 나인하트 패키지': ['책사 나인하트 이펙트'],
  '여제 시그너스 패키지(여)': ['여제 시그너스 케이프', '여제 시그너스 이펙트'],
  '영웅 에반 패키지(남)': ['영웅 에반 골든윙즈'],
  '영웅 에반 패키지(여)': ['영웅 에반 골든윙즈'],
  '영웅 메르세데스 패키지(남)': ['영웅 메르세데스 핀'],
  '영웅 메르세데스 패키지(여)': ['영웅 메르세데스 핀'],
  '영웅 팬텀 패키지(남)': ['영웅 팬텀 햇'],
  '영웅 팬텀 패키지(여)': ['영웅 팬텀 햇']
});

const state = {
  baseItems: [],
  items: [],
  hasLocalItems: false,
  auctionRows: [],
  auctionSkips: [],
  sheetAuctionRows: [],
  sheetRefreshPending: false,
  localAuctionRows: [],
  localDataUpdatedAt: null,
  notices: [],
  saleCatalog: [],
  metadata: {},
  search: '',
  majorFilter: 'all',
  jobGroupFilter: 'all',
  categoryFilter: '',
  statusFilter: '',
  packagesVisible: true,
  // 주기 판매 컬렉션. data/collections.json. 상품은 collection id 로 가리킨다.
  collections: {},
  // 메이플크레딧 적립 규칙과 크레딧샵 가격표. data/credit-shop.json.
  creditShop: { earnRate: .05, minCashPrice: 10, mileageEndsAt: '2026-11-19T00:00:00+09:00', items: [] },
  creditRate: { rate: 0, name: '' },
  // 휴지기(다음 판매를 기다리는 컬렉션) 상품도 순위에 넣어 볼지. 기본은 끔.
  includeResting: false,
  // 남은 마일리지로 30% 깎아 사는 계산. 2026-09-17 부터 마일리지가 새로 안 쌓이므로 기본은 끈다.
  useMileage: false,
  // 교환 근거가 공식 문구·크레딧샵 명시인 상품만 본다(체결 기록뿐인 상품은 숨김).
  officialOnly: false,
  // 쌓이는 크레딧 값까지 순위에 넣는다. 모아야 쓸 수 있으므로 기본은 끈다(12절).
  useCredit: false,
  saleSearch: '',
  saleGroupFilter: '',
  saleTypeFilter: '',
  saleReviewFilter: 'all',
  page: 1,
  pageSize: 10,
  stableRowOrder: [],
  currentRanks: new Map(),
  pendingPreviousRanks: null,
  expandedComponentKeys: new Set(),
  // 판매가 추이. null = 아직 안 불러옴, Map = 불러옴(못 읽었으면 빈 Map).
  priceHistory: null,
  // 순위 줄을 눌러 펼친 근거. 시트가 30초마다 다시 그려도 펼친 줄이 닫히지 않게 여기 둔다.
  expandedRowKeys: new Set(),
  rankListAll: false,
  waitingListAll: false,
  settings: { ...DEFAULT_SETTINGS }
};

const $ = selector => document.querySelector(selector);
const nf = new Intl.NumberFormat('ko-KR');
const won = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

// 내용이 같으면 다시 쓰지 않는다. 시트 갱신이 30초마다 그려도 입력 칸과 펼친 항목이 유지된다.
const paintedHtml = new WeakMap();
function setHtml(element, html) {
  if (!element || paintedHtml.get(element) === html) return;
  element.innerHTML = html;
  paintedHtml.set(element, html);
}

function normalizeKey(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  );
  return `${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
}

function formatMeso(value) {
  const meso = Number(value || 0);
  if (!meso) return '-';
  return `${(meso / MESO_INPUT_UNIT).toFixed(2)}억`;
}

function formatReferenceMeso(value) {
  return formatMeso(value);
}

function formatWon(value) {
  return Number.isFinite(value) ? `${won.format(value)}원` : '-';
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMeso(value) {
  const meso = Math.max(0, toNumber(value, 0));
  return Math.round(meso / MESO_PRECISION) * MESO_PRECISION;
}

function mesoToInputUnit(value) {
  const meso = roundMeso(value);
  return meso > 0 ? (meso / MESO_INPUT_UNIT).toFixed(2) : 0;
}

function mesoFromInputUnit(value) {
  return roundMeso(toNumber(value, 0) * MESO_INPUT_UNIT);
}

function loadStoredSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    state.settings = {
      ...DEFAULT_SETTINGS,
      ...Object.fromEntries(Object.entries(saved).filter(([, value]) => Number.isFinite(Number(value))))
    };
  } catch (_) {
    state.settings = { ...DEFAULT_SETTINGS };
  }
}

function persistSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

function loadLocalData() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || '{}');
    state.hasLocalItems = Array.isArray(saved.items);
    state.items = state.hasLocalItems ? normalizeItemList(saved.items) : [...state.baseItems];
    state.localAuctionRows = normalizeAuctionRows(saved.auctionPrices || saved.prices || []);
    state.localDataUpdatedAt = saved.updatedAt || null;
  } catch (_) {
    state.hasLocalItems = false;
    state.items = [...state.baseItems];
    state.localAuctionRows = [];
    state.localDataUpdatedAt = null;
  }
}

function persistLocalData() {
  state.localDataUpdatedAt = nowIso();
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify({
    version: 1,
    updatedAt: state.localDataUpdatedAt,
    items: state.hasLocalItems ? state.items : null,
    auctionPrices: state.localAuctionRows
  }));
}

function sheetCellText(cell) {
  return String(cell?.f ?? cell?.v ?? '').trim();
}

function sheetDateIso(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(`${text}T00:00:00+09:00`).toISOString();
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeSheetMarketRows(response) {
  if (response?.status !== 'ok' || !Array.isArray(response?.table?.rows)) return [];
  const statusMap = {
    '체결가 확인': 'verified',
    '체결 없음': 'no_sales',
    '현재가 미확인': 'listing_unconfirmed'
  };

  return response.table.rows.map(row => {
    const cells = row?.c || [];
    if (sheetCellText(cells[0]).toUpperCase() !== 'ON') return null;
    const itemName = sheetCellText(cells[1]);
    const statusText = sheetCellText(cells[3]);
    const marketHistoryStatus = statusMap[statusText];
    if (!itemName || !marketHistoryStatus) return null;
    const rawEok = toNumber(cells[2]?.v ?? sheetCellText(cells[2]), 0);
    const marketHistoryMaxMeso = marketHistoryStatus === 'verified'
      ? roundMeso(rawEok * MESO_INPUT_UNIT)
      : 0;
    if (marketHistoryStatus === 'verified' && marketHistoryMaxMeso <= 0) return null;
    const updatedAt = sheetDateIso(sheetCellText(cells[5]));

    return {
      itemName,
      query: itemName,
      marketHistoryMaxMeso,
      marketHistoryMaxText: marketHistoryMaxMeso > 0 ? formatMeso(marketHistoryMaxMeso) : '',
      marketHistoryBasis: '구글 시트 시세 보정',
      marketHistoryCollectedAt: updatedAt,
      marketHistoryStatus,
      marketHistoryNote: sheetCellText(cells[4]) || statusText,
      source: 'sheet',
      filter: '시세 보정'
    };
  }).filter(Boolean);
}

function loadSheetMarketRows() {
  return new Promise(resolve => {
    const callbackName = `__kirakiSheetMarket${Date.now()}${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let timer = null;
    const finish = result => {
      if (timer) clearTimeout(timer);
      delete window[callbackName];
      script.remove();
      resolve(result);
    };

    window[callbackName] = response => finish({
      ok: response?.status === 'ok',
      rows: normalizeSheetMarketRows(response)
    });
    script.onerror = () => finish({ ok: false, rows: [] });
    timer = setTimeout(() => finish({ ok: false, rows: [] }), 6000);

    const query = new URLSearchParams({
      gid: SHEET_MARKET_SOURCE.gid,
      range: SHEET_MARKET_SOURCE.range,
      headers: '1',
      tqx: `responseHandler:${callbackName}`,
      _: String(Date.now())
    });
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_MARKET_SOURCE.spreadsheetId}/gviz/tq?${query}`;
    script.referrerPolicy = 'no-referrer';
    document.head.append(script);
  });
}

function mergeSheetMarketRows(rows) {
  const auctionByName = new Map();
  state.auctionRows.forEach(row => {
    [row.itemName, row.name, row.query, ...(row.aliases || [])].filter(Boolean)
      .forEach(name => auctionByName.set(normalizeKey(name), row));
  });
  return rows.map(row => {
    const base = auctionByName.get(normalizeKey(row.itemName));
    return base ? { ...base, ...row, itemId: base.itemId ?? row.itemId } : row;
  });
}

async function refreshSheetMarketRows() {
  if (state.sheetRefreshPending) return;
  state.sheetRefreshPending = true;
  try {
    const result = await loadSheetMarketRows();
    if (!result.ok) return;
    state.sheetAuctionRows = mergeSheetMarketRows(result.rows);
    setSyncState(
      'ready',
      '가격 불러오기 완료',
      `${state.metadata.world || '스카니아'} 기준 · 시세 보정 ${result.rows.length}개 반영`
    );
    render();
  } finally {
    state.sheetRefreshPending = false;
  }
}

async function loadJson(path, fallback) {
  const response = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) return fallback;
  return response.json();
}

async function loadData() {
  loadStoredSettings();
  loadViewSettings();
  syncInputs();
  try {
    const [itemsDoc, auctionDoc, noticeDoc, saleDoc, collectionsDoc, creditShopDoc] = await Promise.all([
      loadJson(DATA_PATHS.items, { items: [], settings: DEFAULT_SETTINGS }),
      loadJson(DATA_PATHS.auction, { prices: [], skipped: [] }),
      loadJson(DATA_PATHS.notices, { notices: [] }),
      loadJson(DATA_PATHS.saleItems, { sales: [] }),
      loadJson(DATA_PATHS.collections, { collections: {} }),
      // 가격표가 없거나 깨져 있어도 계산기는 떠야 한다. 그때는 적립 가치를 0 으로 본다.
      loadJson(DATA_PATHS.creditShop, DEFAULT_CREDIT_SHOP).catch(() => DEFAULT_CREDIT_SHOP)
    ]);
    state.creditShop = normalizeCreditShop(creditShopDoc);

    const loadedCollections = collectionsDoc && collectionsDoc.collections;
    state.collections = loadedCollections && typeof loadedCollections === 'object'
      && !Array.isArray(loadedCollections) ? loadedCollections : {};

    state.baseItems = normalizeItemList(itemsDoc.items || []);
    state.items = [...state.baseItems];
    loadLocalData();
    state.metadata.itemsUpdatedAt = itemsDoc.updatedAt;
    state.metadata.auctionUpdatedAt = auctionDoc.generatedAt || auctionDoc.updatedAt;
    state.metadata.saleItemsUpdatedAt = saleDoc.generatedAt;
    state.metadata.world = auctionDoc.world || saleDoc.world || itemsDoc.world || '스카니아';
    state.auctionRows = normalizeAuctionRows(auctionDoc.prices);
    state.auctionSkips = normalizeAuctionRows(auctionDoc.skipped);
    state.notices = normalizeNotices(noticeDoc.notices || noticeDoc.cashshopNotice || []);
    state.saleCatalog = normalizeSaleCatalog(saleDoc.sales || []);
    syncSaleFilterOptions();
    setSyncState('ready', '가격 불러오기 완료', `${state.metadata.world} 기준 가격을 불러왔습니다.`);
    void refreshSheetMarketRows();
  } catch (error) {
    console.error(error);
    setSyncState('error', '가격 불러오기 실패', '잠시 후 다시 시도해 주세요.');
  }
  render();
}

// 판매 기간 창. 컬렉션을 가리키면 그 컬렉션의 회차들, 아니면 상품 자체의 availability.
// 돌려주는 값: 배열 = 창 목록, null = 기간 정보 없음(상시판매), undefined = 해석 불가.
// 컬렉션 id 가 없거나 모양이 틀리면 undefined 로 '기간 미확인'을 만든다 —
// 오타 하나로 상품이 영원히 판매 중이 되면 안 된다. price_audit.sale_windows 와 같다.
function saleWindows(item) {
  const cid = item.collection;
  if (cid !== undefined && cid !== null && cid !== '') {
    if (typeof cid !== 'string') return undefined;
    const c = Object.prototype.hasOwnProperty.call(state.collections, cid) ? state.collections[cid] : null;
    if (!c || typeof c !== 'object' || Array.isArray(c) || !Array.isArray(c.runs)) return undefined;
    return c.runs;
  }
  const a = item.availability;
  return a === undefined || a === null ? null : [a];
}

// 판매 창 경계로 받는 시각 형식. 이 밖의 문자열은 브라우저마다 해석이 달라
// 감사(파이썬)와 갈라지므로 받지 않는다. price_audit.ISO_MOMENT 와 같은 식.
const ISO_MOMENT = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?)?$/;

// null = 값 없음(열린 끝), NaN = 값은 있는데 못 읽음, 숫자 = 밀리초.
// 날짜만 있으면 UTC 자정, 오프셋 없는 시각은 로컬 시각 — JavaScript 규칙 그대로다.
function windowBound(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !ISO_MOMENT.test(value)) return NaN;
  // 달력에 없는 날은 받지 않는다. V8 은 '2026-02-30' 을 3월 2일로 넘겨 읽지만
  // 파이썬은 거부한다. 1970 년 전은 판매 기간일 수 없고, 파이썬 datetime 이
  // 서기 1년 근처에서 오프셋 계산을 못 해 갈라지므로 함께 막는다.
  const [y, mo, d] = value.slice(0, 10).split('-').map(Number);
  const probe = new Date(0);
  probe.setUTCFullYear(y, mo - 1, d);
  if (y < 1970 || probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    return NaN;
  }
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : NaN;
}

function isWindowObject(w) {
  return Boolean(w) && typeof w === 'object' && !Array.isArray(w);
}

// 창 하나의 경계. [start, end] 또는 null(해석 불가).
//   상품 availability 에서 날짜가 하나도 없는 창은 type: 'always' 라고 적었을 때만
//   열린 창(상시판매)이다. 빈 객체 {} 를 열린 창으로 읽으면 실수 하나로 영원히
//   판매 중이 된다. 그 밖의 창과 컬렉션 회차는 시작·끝이 둘 다 있고 시작 <= 끝이어야 한다.
// price_audit.window_span 과 같은 규칙.
function windowSpan(w, fromCollection) {
  if (!isWindowObject(w)) return null;
  const start = windowBound(w.startAt);
  const end = windowBound(w.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (start === null && end === null) {
    return !fromCollection && w.type === 'always' ? [null, null] : null;
  }
  if (w.type === 'always') return null;           // 상시라면서 날짜가 있으면 모순
  if (start === null || end === null || start > end) return null;
  return [start, end];
}

// 캐시샵 판매 상태. price_audit.sale_status 와 같은 규칙이어야 한다.
//   on       판매 중
//   always   판매 기간 정보 없음 = 상시판매로 본다
//   upcoming 다음 회차가 공지돼 있고 아직 시작 전
//   resting  주기 판매 컬렉션의 휴지기 (지난 회차는 끝났고 다음 회차는 미공지)
//   ended    일회성 판매가 끝남, 또는 rankEligible: false
//   unknown  가리키는 컬렉션이 없거나 판매 창을 읽을 수 없음
// 창을 하나라도 못 읽으면 나머지를 보기 전에 unknown 이다(순서에 따라 답이 바뀌지 않게).
function saleStatus(item) {
  if (item.rankEligible === false) return 'ended';
  const windows = saleWindows(item);
  if (windows === undefined) return 'unknown';
  if (windows === null) return 'always';
  const cid = item.collection;
  const fromCollection = cid !== undefined && cid !== null && cid !== '';
  const bounds = [];
  for (const w of windows) {
    const span = windowSpan(w, fromCollection);
    if (!span) return 'unknown';
    bounds.push(span);
  }
  const now = Date.now();
  let upcoming = false;
  for (const [start, end] of bounds) {
    const started = start === null || now >= start;
    const notEnded = end === null || now <= end;
    if (started && notEnded) return 'on';
    if (start !== null && now < start) upcoming = true;
  }
  if (upcoming) return 'upcoming';
  const recurring = fromCollection && state.collections[cid].recurring !== false;
  return recurring ? 'resting' : 'ended';
}

// 캐시샵에서 지금 살 수 있는 상품인가. 살 수 없으면 "사서 팔면 이득"이라는
// 효율 순위 자체가 성립하지 않으므로 순위에서 뺀다.
function isPurchasable(item) {
  const status = saleStatus(item);
  return status === 'on' || status === 'always';
}

// 가장 최근에 끝난 회차와 가장 가까운 다음 회차. 화면 설명용.
function saleWindowSummary(item) {
  const windows = saleWindows(item) || [];
  const now = Date.now();
  let lastEnd = null, nextStart = null;
  const cid = item.collection;
  const fromCollection = cid !== undefined && cid !== null && cid !== '';
  for (const w of windows) {
    const span = windowSpan(w, fromCollection);
    if (!span) continue;
    const [start, end] = span;
    if (end !== null && end < now && (lastEnd === null || end > lastEnd)) lastEnd = end;
    if (start !== null && start > now && (nextStart === null || start < nextStart)) nextStart = start;
  }
  return {
    lastEnd: lastEnd === null ? null : new Date(lastEnd).toISOString(),
    nextStart: nextStart === null ? null : new Date(nextStart).toISOString()
  };
}

function salePill(item, info) {
  const status = item.saleStatus;
  if (status === 'resting') {
    const last = info.lastEnd ? `마지막 판매 ${formatDate(info.lastEnd)} 종료. ` : '';
    return `<span class="source-pill seed" title="${escapeHtml(last)}다시 판매하면 순위에 돌아옵니다.">재판매 대기</span>`;
  }
  if (status === 'upcoming') {
    const next = info.nextStart ? `${formatDate(info.nextStart)} 판매 시작 예정. ` : '';
    return `<span class="source-pill seed" title="${escapeHtml(next)}시작 전이라 아직 살 수 없습니다.">판매 예정</span>`;
  }
  if (status === 'unknown') {
    return '<span class="source-pill seed" title="판매 기간을 확인하지 못했습니다.">기간 미확인</span>';
  }
  return '<span class="source-pill seed" title="캐시샵 판매 기간이 끝나 구매할 수 없습니다.">판매 종료</span>';
}

function saleMetaText(item, info) {
  const status = item.saleStatus;
  if (status === 'resting') {
    return info.lastEnd ? ` · ${escapeHtml(formatDate(info.lastEnd))} 판매 종료` : '';
  }
  if (status === 'upcoming') {
    return info.nextStart ? ` · ${escapeHtml(formatDate(info.nextStart))} 판매 시작` : ' · 판매 예정';
  }
  if (status === 'ended' && info.lastEnd) return ` · ${escapeHtml(formatDate(info.lastEnd))} 판매 종료`;
  return '';
}

// 순위에 올릴 수 있는 판매 상태인가. 휴지기는 보기에서 켰을 때만 넣는다.
// 교환 근거 등급. official = 공지에 넥슨캐시 구매분 교환이 적힘, creditShop = 크레딧샵 구매분 교환이 공식,
// ingame = 게임 안 구매 화면에서 확인, observed = 경매장 체결 기록뿐.
const EXCHANGE_EVIDENCE_LABEL = Object.freeze({
  official: '공지에 교환 가능', ingame: '캐시샵에서 교환 확인', creditShop: '크레딧샵 교환 가능', observed: '경매장 거래 중'
});

function exchangeEvidenceLevel(item) {
  const level = item.exchangeEvidence && item.exchangeEvidence.level;
  return Object.prototype.hasOwnProperty.call(EXCHANGE_EVIDENCE_LABEL, level) ? level : '';
}

function passesEvidenceFilter(item) {
  if (!state.officialOnly) return true;
  return ['official', 'ingame', 'creditShop'].includes(exchangeEvidenceLevel(item));
}

// 값은 맞아도 물량이 안 받쳐 주는 상품. 한 번에 여러 개를 팔기 어렵다는 것을 알린다.
function lowLiquidityNote(price) {
  if (!price || !(Number(price.meso) > 0)) return '';
  const sales = Number(price.saleCount || 0);
  const listings = Number(price.listingCount || 0);
  const fewSales = sales > 0 && sales < LOW_SALE_COUNT;
  const fewListings = listings > 0 && listings < LOW_LISTING_COUNT;
  if (!fewSales && !fewListings) return '';
  const parts = [];
  if (sales > 0) parts.push(`최근 3개월 체결 ${nf.format(sales)}건`);
  if (listings > 0) parts.push(`매물 ${nf.format(listings)}건`);
  return `${parts.join(', ')}. 한 번에 여러 개를 팔기 어렵습니다.`;
}

function renderLiquidityPill(item) {
  if (componentList(item.components).length) return '';
  const note = lowLiquidityNote(item.listingPrice);
  return note ? `<span class="market-warning-pill" title="${escapeAttribute(note)}">거래 적음</span>` : '';
}

function renderEvidencePill(item) {
  const level = exchangeEvidenceLevel(item);
  if (!level) return '';
  const note = item.exchangeEvidence.note ? ` title="${escapeAttribute(item.exchangeEvidence.note)}"` : '';
  return `<span class="evidence-pill ${level}"${note}>${EXCHANGE_EVIDENCE_LABEL[level]}</span>`;
}

function isRankableSale(item) {
  if (!passesEvidenceFilter(item)) return false;
  if (item.purchasable !== false) return true;
  return state.includeResting && item.saleStatus === 'resting';
}

function loadViewSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
    state.includeResting = saved.includeResting === true;
    state.useMileage = saved.useMileage === true;
    state.useCredit = saved.useCredit === true;
    state.officialOnly = saved.officialOnly === true;
  } catch (_) {
    state.includeResting = false;
    state.useMileage = false;
    state.officialOnly = false;
  }
}

function persistViewSettings() {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify({
      includeResting: state.includeResting, useMileage: state.useMileage, officialOnly: state.officialOnly, useCredit: state.useCredit
    }));
  } catch (_) { /* 저장 못 해도 화면은 그대로 동작한다 */ }
}

function syncRestingToggle(restingCount) {
  const toggle = $('#resting-toggle');
  const banner = $('#resting-banner');
  if (toggle) toggle.checked = state.includeResting;
  if (banner) {
    banner.hidden = !restingCount;
    const text = $('#resting-banner-text');
    if (text) {
      text.textContent = state.includeResting
        ? `지금 안 파는 상품 ${restingCount}개를 같이 보고 있습니다.`
        : `지금 안 파는 상품 ${restingCount}개는 순위에서 뺐습니다. 다시 판매하면 돌아옵니다.`;
    }
  }
}

function normalizeItemList(items) {
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    ...item,
    category: item.category || '캐시 아이템',
    cashPrice: toNumber(item.cashPrice, 0),
    mileagePrice: toNumber(item.mileagePrice || item.cashPrice, 0),
    seedMesoPrice: toNumber(item.seedMesoPrice || item.defaultMesoPrice, 0),
    referenceMesoValue: toNumber(item.referenceMesoValue, 0),
    referenceOnly: Boolean(item.referenceOnly),
    tradable: item.tradable !== false,
    // purchasable 은 여기서 굳히지 않는다. 화면을 켜 둔 채 판매 종료 시각을
    // 넘기면 굳은 값이 그대로 남아 종료된 상품이 계속 순위에 있게 된다.
    // enrichItems 가 그릴 때마다 다시 판정한다.
    // 없으면 null(상시판매). false·0 같은 값은 그대로 두어 판매 상태에서 '기간 미확인'이 되게 한다.
    availability: item.availability === undefined ? null : item.availability,
    mileageType: item.mileageType || 'none',
    aliases: Array.isArray(item.aliases) ? item.aliases.map(String).filter(Boolean) : [],
    components: componentList(item.components),
    bonusComponents: componentList(item.bonusComponents)
  })).filter(item => item.name);
}

function normalizeAuctionRows(rawPrices) {
  if (Array.isArray(rawPrices)) return rawPrices.filter(Boolean);
  if (rawPrices && typeof rawPrices === 'object') {
    return Object.entries(rawPrices).map(([key, value]) => ({ itemId: key, ...value })).filter(Boolean);
  }
  return [];
}

function normalizeNotices(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(notice => ({
    id: notice.id || notice.noticeId || notice.notice_id,
    title: notice.title || notice.noticeTitle || notice.notice_title || '제목 없음',
    date: notice.date || notice.noticeDate || notice.date_event || notice.updatedAt,
    url: notice.url || notice.link || null,
    summary: notice.summary || '',
    items: normalizeNoticeItems(notice.items || notice.products || notice.productNames || [])
  })).slice(0, 5);
}

function normalizeNoticeItems(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .filter(item => {
      const key = normalizeKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function normalizeSaleCatalog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(sale => ({
    id: sale.id,
    title: sale.title || `판매글 ${sale.id}`,
    label: saleTitleLabel(sale.title || `판매글 ${sale.id}`),
    url: sale.url || null,
    bodyImages: Array.isArray(sale.bodyImages) ? sale.bodyImages : [],
    items: normalizeSaleSearchItems(sale).map(item => ({
      ...item,
      type: classifySaleItem(item.name, sale)
    }))
  })).filter(sale => sale.items.length);
}

function normalizeSaleSearchItems(sale) {
  const seen = new Map();
  const add = (value, needsReview) => {
    const name = String(value || '').trim();
    if (!name) return;
    const key = normalizeKey(name);
    if (seen.has(key)) {
      seen.get(key).needsReview = seen.get(key).needsReview || needsReview;
      return;
    }
    seen.set(key, { name, needsReview });
  };
  (sale.auctionSearchItems || []).forEach(item => add(item, false));
  (sale.reviewSearchItems || []).forEach(item => add(item, true));
  return [...seen.values()];
}

function saleTitleLabel(title) {
  return String(title || '').replace(/^6월 18일 캐시아이템 업데이트 -\s*/, '');
}

function classifySaleItem(name, sale) {
  const text = `${name} ${sale.title || ''}`;
  if (name.includes('패키지')) return '패키지';
  if (name.includes('쿠폰')) return '쿠폰';
  if (/원더베리|루나 크리스탈|로얄 스타일|마스터피스/.test(name)) return '확률형';
  if (/펫장비|서약|사인|아메리카노|업무 자료|크리스탈 키|간식/.test(name) && /원더베리|루나|펫|쁘띠/.test(text)) return '펫장비';
  if (/사원|치치|카카|랑랑|정령|백야|설아|쁘띠|펫/.test(text)) return '펫';
  if (/투구|햇|모자|크라운|가면|써클릿|머리띠|슈트|로브|드레스|부츠|슈즈|소드|스태프|보우|표창|너클|도서|폴암|완드|활|석궁|단검|건|갑옷|방패|이펙트|케이프|핀|깃털|귀고리|후드|마스크|무기/.test(name)) return '치장';
  return '기타';
}

function flattenSaleSearchItems(catalog = state.saleCatalog) {
  return catalog.flatMap(sale => sale.items.map(item => ({ ...item, saleId: sale.id })));
}

function componentList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(component => (typeof component === 'string' ? { name: component } : component))
    .filter(component => component && component.name)
    .map(component => ({
      ...component,
      name: String(component.name).trim(),
      aliases: Array.isArray(component.aliases) ? component.aliases.map(String).filter(Boolean) : [],
      seedMesoPrice: toNumber(component.seedMesoPrice || component.defaultMesoPrice, 0),
      quantity: Math.max(1, Math.floor(toNumber(component.quantity, 1)))
    }));
}

function bonusComponentsFor(item) {
  const explicit = componentList(item.bonusComponents);
  const inferred = componentList(BONUS_COMPONENTS_BY_PACKAGE[item.name] || []);
  const seen = new Set();
  return [...explicit, ...inferred].filter(component => {
    const key = normalizeKey(component.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function filteredSaleCatalog() {
  const q = normalizeKey(state.saleSearch);
  return state.saleCatalog.map(sale => {
    const items = sale.items.filter(item => {
      if (state.saleGroupFilter && String(sale.id) !== state.saleGroupFilter) return false;
      if (state.saleTypeFilter && item.type !== state.saleTypeFilter) return false;
      if (state.saleReviewFilter === 'review' && !item.needsReview) return false;
      if (state.saleReviewFilter === 'confirmed' && item.needsReview) return false;
      if (!q) return true;
      return normalizeKey(`${sale.title} ${item.name} ${item.type}`).includes(q);
    });
    return { ...sale, items };
  }).filter(sale => sale.items.length);
}

function rowKey(row) {
  return row.itemId != null
    ? `id:${row.itemId}`
    : `name:${normalizeKey(row.itemName || row.name || row.query)}`;
}

function mergedAuctionRows() {
  const rows = new Map();
  [...state.auctionRows, ...state.localAuctionRows].forEach(row => {
    const key = rowKey(row);
    if (key !== 'name:') rows.set(key, row);
  });

  state.sheetAuctionRows.forEach(sheetRow => {
    const key = rowKey(sheetRow);
    if (key === 'name:') return;
    const current = rows.get(key);
    if (!current) {
      rows.set(key, sheetRow);
      return;
    }
    rows.set(key, {
      ...sheetRow,
      ...current,
      itemId: current.itemId ?? sheetRow.itemId,
      itemName: current.itemName || sheetRow.itemName,
      query: current.query || sheetRow.query,
      marketHistoryMaxMeso: sheetRow.marketHistoryMaxMeso,
      marketHistoryMaxText: sheetRow.marketHistoryMaxText,
      marketHistoryBasis: sheetRow.marketHistoryBasis,
      marketHistoryCollectedAt: sheetRow.marketHistoryCollectedAt,
      marketHistoryStatus: sheetRow.marketHistoryStatus,
      marketHistoryNote: sheetRow.marketHistoryNote
    });
  });
  return [...rows.values()];
}

function buildPriceIndex() {
  const byId = new Map();
  const byName = new Map();
  const skippedById = new Map();
  const skippedByName = new Map();

  for (const row of mergedAuctionRows()) {
    if (row.itemId != null) byId.set(String(row.itemId), row);
    const names = [row.itemName, row.name, row.query, ...(row.aliases || [])].filter(Boolean);
    for (const name of names) byName.set(normalizeKey(name), row);
  }

  for (const row of state.auctionSkips) {
    if (row.itemId != null) skippedById.set(String(row.itemId), row);
    const names = [row.itemName, row.name, row.query, ...(row.aliases || [])].filter(Boolean);
    for (const name of names) skippedByName.set(normalizeKey(name), row);
  }

  return { byId, byName, skippedById, skippedByName };
}

function categoryFor(item) {
  return item.referenceOnly ? REFERENCE_CATEGORY : (item.category || '캐시 아이템');
}

function categoriesForMajor(value = state.majorFilter) {
  return MAJOR_FILTER_OPTIONS.find(([filter]) => filter === value)?.[2] || null;
}

function categoryMatchesMajor(category, value = state.majorFilter) {
  const categories = categoriesForMajor(value);
  return !categories || categories.includes(category);
}

function matchesMajorFilter(item) {
  const category = categoryFor(item);
  if (!categoryMatchesMajor(category)) return false;
  if (state.majorFilter !== 'job' || state.jobGroupFilter === 'all') return true;
  const selectedCategory = JOB_GROUP_OPTIONS.find(([group]) => group === state.jobGroupFilter)?.[2];
  return !selectedCategory || category === selectedCategory;
}

function isPackageCategory(category) {
  return String(category || '').startsWith('패키지');
}

function isPackageItem(item) {
  return !item.referenceOnly && isPackageCategory(categoryFor(item));
}

function syncPackageToggle() {
  const toggle = $('#package-filter-toggle');
  const status = $('#package-filter-state');
  if (!toggle || !status) return;
  toggle.checked = state.packagesVisible;
  status.textContent = state.packagesVisible ? 'ON' : 'OFF';
}

// 접어 둔 조건이 켜져 있으면 접힌 채로도 알 수 있게 개수를 보인다.
function syncMoreFilters() {
  const summary = $('#more-filters-state');
  if (!summary) return;
  const autoCategory = state.majorFilter === 'mileage' && state.categoryFilter === REFERENCE_CATEGORY;
  const active = [state.categoryFilter && !autoCategory, state.statusFilter, !state.packagesVisible, state.officialOnly].filter(Boolean).length;
  summary.textContent = active ? `${active}개 적용 중` : '세부 분류 · 가격 상태 · 패키지 · 교환 확인';
  summary.classList.toggle('is-active', active > 0);
}

function auctionStatusLabel(status) {
  return AUCTION_STATUS_LABELS[status] || '미확인';
}

function isMarketHistoryPending(status) {
  return status === 'no_sales' || status === 'listing_unconfirmed';
}

function marketHistoryStatusLabel(status) {
  if (status === 'no_sales') return '시세 탭 체결 없음';
  if (status === 'listing_unconfirmed') return '현재가 체결 확인 안 됨';
  return '';
}

function summarizeAuctionStatus(prices) {
  const statuses = prices.map(price => price.auctionStatus).filter(Boolean);
  if (!statuses.length) return 'unverified';
  if (statuses.includes('live')) return 'live';
  if (statuses.includes('no_listing')) return 'no_listing';
  if (statuses.every(status => status === 'no_candidate')) return 'no_candidate';
  if (statuses.includes('seed')) return 'seed';
  return 'unverified';
}

function isEvidenceStale(value) {
  // 판매 기간과 같은 엄격한 해석을 쓴다(windowBound). new Date 는 '2026/10/04' 나 달력에 없는 날도
  // 읽어 버려서 파이썬 쪽 감사와 갈라진다. 못 읽는 시각은 낡은 근거다.
  const at = windowBound(value);
  if (at === null || !Number.isFinite(at)) return true;
  return (Date.now() - at) / 86400000 > EVIDENCE_STALE_DAYS;
}

function priceFor(target, index) {
  const id = target.id != null ? String(target.id) : null;
  const rowById = id ? index.byId.get(id) : null;
  const names = [target.name, ...(target.aliases || [])].filter(Boolean);
  const rowByName = names.map(name => index.byName.get(normalizeKey(name))).find(Boolean);
  const row = rowById || rowByName;
  // 정확일치 미포착은 값을 '모르는' 것이다. 원장에는 직전 확인가를 보존하지만(7절)
  // 계산에는 쓰지 않는다 — 문서 3절에서 F·계산 제외로 정의돼 있다.
  // (이 분기가 없으면 아래에서 양수 가격을 먼저 돌려주어 상태 검사에 닿지 못한다.)
  if (row?.status === 'uncaptured') {
    return {
      meso: 0,
      listingMeso: 0,
      marketHistoryMeso: 0,
      source: 'uncaptured',
      auctionStatus: 'uncaptured',
      collectedAt: row.collectedAt || row.updatedAt || null
    };
  }
  const listingMeso = roundMeso(row?.listingLowestMeso);
  // 채택용 시세는 최근 체결 기반(marketPriceMeso). 아직 체결 내역을 못 뜬 행만
  // 과거의 3개월 최고가로 물러난다. PRICE_VERIFICATION.md 9절 참고.
  // 대체 순서를 price_audit.grade_row 와 글자 그대로 맞춘다. 순서가 다르면
  // 어느 한쪽에만 있는 필드가 들어올 때 두 구현의 채택가가 갈린다.
  const marketHistoryMeso = roundMeso(
    row?.marketPriceMeso || row?.marketHistoryMaxMeso
    || row?.marketHistoryObservedMaxMeso || row?.marketHistoryMeso);
  const marketPriceBasis = row?.marketPriceBasis || '';
  const marketHistoryStatus = row?.marketHistoryStatus || '';
  const pendingMarketHistory = isMarketHistoryPending(marketHistoryStatus) && marketHistoryMeso <= 0;
  // 시세 탭 최고 체결가는 3개월 내 단발 고가가 섞여 실제 판매가를 과대평가하고,
  // 갱신이 밀리면 반대로 과소평가한다. 낡은 근거를 먼저 후보에서 뺀 뒤 낮은 쪽을 쓴다.
  const listingStale = isEvidenceStale(row?.updatedAt || row?.collectedAt);
  const marketStale = isEvidenceStale(row?.marketPriceAt || row?.marketHistoryCollectedAt);
  const candidates = [];
  if (listingMeso > 0 && !listingStale) candidates.push(listingMeso);
  if (marketHistoryMeso > 0 && !marketStale) candidates.push(marketHistoryMeso);
  const candidateMeso = candidates.length
    ? Math.min(...candidates)
    : marketHistoryMeso || listingMeso;
  const meso = pendingMarketHistory ? 0 : candidateMeso;
  const usesMarketHistory = marketHistoryMeso > 0 && candidateMeso === marketHistoryMeso;
  const evidenceStale = !candidates.length && candidateMeso > 0;
  // 쓸 수 있는 시세가 없는데 매물이 1~2건뿐이면 그 호가 하나가 곧 값이 된다.
  // PRICE_VERIFICATION.md 5절. 마네킹 매물 2건 99.99억이 이 경우다.
  // 교차검증으로 인정할 수 있는 시세만 방패로 친다.
  // legacyMax(3개월 최고가)는 인정하지 않는다(9절).
  // 매물까지 낡아 후보가 0개가 되면 근거는 더 약해질 뿐이므로 같이 뺀다.
  // (예전 규칙은 후보가 정확히 1개일 때만 걸려서, 매물이 14일을 넘기면 그대로
  //  순위에 올라왔다. 마네킹 187원 1위 사고의 재발 경로다.)
  const listingCount = Number(row?.resultCount || 0);
  // marketPriceBasis 가 비어 있는데 시세 값이 있으면 그것은 marketHistoryMaxMeso,
  // 곧 3개월 최고가다(9절). 기준이 안 적혔다고 교차검증으로 인정하면 안 된다.
  // price_audit.grade_row 의 `or ('legacyMax' if market else '')` 와 같은 규칙.
  const effectiveMarketBasis = marketPriceBasis || (marketHistoryMeso > 0 ? 'legacyMax' : '');
  const marketCrossCheck = marketHistoryMeso > 0 && !marketStale
    && effectiveMarketBasis !== 'legacyMax';
  // 체결이 없어 값을 채택하지 않는 행은 '가격 없음'이지 '검증 필요'가 아니다.
  // pendingMarketHistory 면 meso 가 0 이므로 저매물 판정에서도 빠져야 한다.
  const thinListingOnly = !pendingMarketHistory && !marketCrossCheck
    && candidateMeso > 0 && candidateMeso === listingMeso
    && listingCount > 0 && listingCount <= THIN_LISTING_COUNT;
  const marketGapRate = listingMeso > 0 && marketHistoryMeso > 0 && listingMeso !== marketHistoryMeso
    ? Math.abs(listingMeso - marketHistoryMeso) / listingMeso * 100
    : 0;

  if (candidateMeso > 0 || pendingMarketHistory) {
    return {
      meso,
      listingMeso,
      marketHistoryMeso,
      marketHistoryStatus,
      marketHistoryNote: row?.marketHistoryNote || marketHistoryStatusLabel(marketHistoryStatus),
      marketHistoryBasis: row?.marketHistoryBasis || '시세 탭 체결 상단',
      marketHistoryCollectedAt: row?.marketHistoryCollectedAt || row?.marketHistoryUpdatedAt || null,
      marketGapRate,
      usesMarketHistory,
      evidenceStale,
      marketPriceBasis,
      marketCrossCheck,
      // 시세 탭에 잡힌 최근 3개월 체결 건수(500 이 상한). 하루에 몇 개나 팔리는지 가늠하는 값이다.
      saleCount: Number(row?.marketHistorySaleCount || 0),
      thinListingOnly,
      listingCount,
      source: pendingMarketHistory
        ? 'pending'
        : usesMarketHistory
          ? 'history'
          : row?.source === 'manual' ? 'manual' : 'live',
      auctionStatus: listingMeso > 0 ? 'live' : 'unverified',
      collectedAt: row?.collectedAt || row?.updatedAt || state.localDataUpdatedAt || state.metadata.auctionUpdatedAt
    };
  }

  if (row?.status && row.status !== 'ok' && row.status !== 'manual') {
    return {
      meso: 0,
      listingMeso: 0,
      marketHistoryMeso: 0,
      source: row.status,
      auctionStatus: row.status,
      collectedAt: row.collectedAt || null
    };
  }

  const skippedById = id ? index.skippedById.get(id) : null;
  const skippedByName = names.map(name => index.skippedByName.get(normalizeKey(name))).find(Boolean);
  const skipped = skippedById || skippedByName;
  const seedMeso = roundMeso(target.seedMesoPrice || target.defaultMesoPrice);
  const auctionStatus = skipped?.status || (seedMeso > 0 ? 'seed' : 'unverified');

  return {
    meso: seedMeso,
    listingMeso: seedMeso,
    marketHistoryMeso: 0,
    source: seedMeso > 0 ? 'seed' : auctionStatus,
    auctionStatus,
    collectedAt: null
  };
}

function totalPriceFor(item, index) {
  const tradableComponents = componentList(item.components);
  if (!tradableComponents.length) {
    return priceFor(item, index);
  }

  let liveCount = 0;
  let manualCount = 0;
  let historyCount = 0;
  let pendingCount = 0;
  let thinCount = 0;
  let latest = null;
  const components = tradableComponents.map(component => {
    const price = priceFor(component, index);
    if (price.source === 'live') liveCount += 1;
    if (price.source === 'manual') manualCount += 1;
    if (price.source === 'history') historyCount += 1;
    if (price.source === 'pending') pendingCount += 1;
    if (price.thinListingOnly) thinCount += 1;
    [price.collectedAt, price.marketHistoryCollectedAt].filter(Boolean).forEach(value => {
      if (!latest || new Date(value) > new Date(latest)) latest = value;
    });
    return { component, price };
  });
  const componentPrices = components.map(entry => entry.price);
  // 구성품의 초기값도 근거가 아니다. 단독 상품만 막으면 패키지 문으로 들어온다.
  // price_audit.approx_ranking 은 구성품의 calcAdoptedMeso(초기값이면 0)를 더한다.
  const meso = components.reduce((sum, { component, price }) =>
    sum + (price.source === 'seed' ? 0 : price.meso) * component.quantity, 0);
  const filledCount = liveCount + manualCount + historyCount;
  const source = pendingCount > 0
    ? 'pending'
    : filledCount === tradableComponents.length
      ? historyCount > 0 ? 'history' : manualCount > 0 ? 'manual' : 'live'
      : filledCount > 0 ? 'mixed' : 'seed';

  return {
    meso,
    source,
    auctionStatus: summarizeAuctionStatus(componentPrices),
    collectedAt: latest,
    marketHistoryApplied: historyCount > 0,
    pendingMarketCount: pendingCount,
    thinListingCount: thinCount,
    components
  };
}

function normalizeCreditShop(doc) {
  const source = doc && typeof doc === 'object' && !Array.isArray(doc) ? doc : {};
  const number = (value, fallback) => (Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : fallback);
  return {
    earnRate: Math.min(number(source.earnRate, DEFAULT_CREDIT_SHOP.earnRate), 1),
    minCashPrice: number(source.minCashPrice, DEFAULT_CREDIT_SHOP.minCashPrice),
    mileageEndsAt: source.mileageEndsAt || DEFAULT_CREDIT_SHOP.mileageEndsAt,
    items: (Array.isArray(source.items) ? source.items : [])
      .filter(entry => entry && typeof entry.name === 'string' && Number(entry.credits) > 0)
      .map(entry => ({ name: entry.name, credits: Number(entry.credits) }))
  };
}

// 남은 마일리지로 깎아 사는 계산은 마일리지가 사라지는 날까지만 한다.
function mileageUsable(now = Date.now()) {
  const end = Date.parse(state.creditShop.mileageEndsAt);
  return Number.isFinite(end) ? now < end : false;
}

function effectiveMileageType(item) {
  return state.useMileage && mileageUsable() ? item.mileageType || 'none' : 'none';
}

// 크레딧 1점이 메소로 얼마인지. 크레딧샵에서 살 수 있는 것 중 가장 비싸게 팔리는 상품으로 잰다.
// 경매장에서 확인한 값만 쓴다(초기값·저매물 단독·체결 대기·낡은 값은 뺀다).
function creditMesoRate(index) {
  let best = { rate: 0, name: '' };
  for (const entry of state.creditShop.items) {
    const price = priceFor({ name: entry.name }, index);
    // 매물 호가만 있는 상품은 쓰지 않는다. 낡지 않은 최근 체결가(recentSale)로 교차 확인된 것만 본다.
    // 3개월 최고가, 화면에서 손으로 넣은 참고가, 체결 0건·대기 상태는 체결 근거가 아니므로 뺀다.
    if (!['live', 'history'].includes(price.source) || price.thinListingOnly || price.evidenceStale
      || !price.marketCrossCheck || price.marketPriceBasis !== 'recentSale'
      || isMarketHistoryPending(price.marketHistoryStatus)) continue;
    const rate = Number(price.meso || 0) / entry.credits;
    if (rate > best.rate) best = { rate, name: entry.name };
  }
  return best;
}

// includeCredit 가 false 면 크레딧 적립을 수익에 넣지 않는다. 순위와 큰 숫자는 이 값이다.
// 크레딧은 모아서 크레딧샵 상품 한 개 값이 돼야 쓸 수 있으므로, 포함한 값은 추정치로 따로 보여 준다.
function calculateEfficiency(item, mesoPrice, includeCredit = false) {
  const cashPrice = Number(item.cashPrice || 0);
  const mileageType = effectiveMileageType(item);
  let nominalCashPaid = cashPrice;
  let mileageUsed = 0;

  if (mileageType === 'partial') {
    nominalCashPaid *= .7;
    mileageUsed = cashPrice * .3;
  } else if (mileageType === 'full') {
    nominalCashPaid = 0;
    mileageUsed = cashPrice;
  }
  // 크레딧은 넥슨캐시로 낸 금액에만 붙는다. 10캐시 미만 상품은 붙지 않는다.
  const creditEarned = cashPrice >= state.creditShop.minCashPrice ? nominalCashPaid * state.creditShop.earnRate : 0;

  const feeKeep = 1 - Number(state.settings.ahFeeRate || 0) / 100;
  const actualCashCost = nominalCashPaid * (1 - Number(state.settings.discountRate || 0) / 100);
  const mileageCashValue = FIXED_MILEAGE_MESO_RATE * (Number(state.settings.baseMpRate || 0) / 100000000);
  const totalCost = actualCashCost + mileageUsed * mileageCashValue;
  const netMeso = Number(mesoPrice || 0) * feeKeep;
  // 크레딧으로 산 것도 경매장에 팔아야 메소가 되므로 수수료를 똑같이 뗀다.
  const totalReturn = netMeso + (includeCredit ? creditEarned * Number(state.creditRate?.rate || 0) * feeKeep : 0);

  // 메소 값이 없으면 남는 수익은 크레딧 5% 적립뿐이다. 그 숫자는 '가치가 낮다'가
  // 아니라 '아직 모른다'는 뜻이므로 효율로 내보내지 않는다. price_audit.py 의
  // approx_ranking 도 같은 행을 순위에서 뺀다.
  if (!(Number(mesoPrice) > 0)) return Infinity;
  return totalReturn > 0 ? totalCost / (totalReturn / 100000000) : Infinity;
}

function enrichItems() {
  const index = buildPriceIndex();
  state.creditRate = creditMesoRate(index);
  return state.items.map(item => {
    if (item.referenceOnly) {
      const referenceMesoValue = Number(item.referenceMesoValue || 0);
      const mileagePrice = Number(item.mileagePrice || item.cashPrice || 0);
      return {
        ...item,
        saleStatus: saleStatus(item),
        purchasable: isPurchasable(item),
        listingPrice: {
          meso: referenceMesoValue,
          source: 'reference',
          auctionStatus: 'reference',
          collectedAt: item.referenceUpdatedAt || null
        },
        auctionStatus: 'reference',
        listingEfficiency: Infinity,
        referenceMesoPerThousand: mileagePrice > 0 ? referenceMesoValue / mileagePrice * 1000 : 0
      };
    }

    const listing = totalPriceFor(item, index);
    return {
      ...item,
      // 그릴 때마다 현재 시각으로 다시 판정한다(10절).
      saleStatus: saleStatus(item),
      purchasable: isPurchasable(item),
      listingPrice: listing,
      auctionStatus: listing.auctionStatus || 'unverified',
      // 초기값은 경매장 근거가 아니다. 효율을 내지 않는다(5절).
      listingEfficiency: listing.source === 'seed' && !componentList(item.components).length
        ? Infinity
        : calculateEfficiency(item, listing.meso, state.useCredit),
      creditEfficiency: listing.source === 'seed' && !componentList(item.components).length
        ? Infinity
        : calculateEfficiency(item, listing.meso, true)
    };
  });
}

function filteredRows(sourceRows = enrichItems()) {
  const q = normalizeKey(state.search);
  return sourceRows.filter(item => {
    if (!item.referenceOnly && !passesEvidenceFilter(item)) return false;
    if (!matchesMajorFilter(item)) return false;
    if (!state.packagesVisible && isPackageItem(item)) return false;
    if (item.referenceOnly) {
      if (state.categoryFilter !== REFERENCE_CATEGORY) return false;
    } else if (state.categoryFilter && categoryFor(item) !== state.categoryFilter) {
      return false;
    }
    if (!item.referenceOnly && state.statusFilter && (item.auctionStatus || 'unverified') !== state.statusFilter) return false;
    if (!q) return true;
    const componentText = Array.isArray(item.components) ? item.components.map(component => component.name).join(' ') : '';
    const bonusText = bonusComponentsFor(item).map(component => component.name).join(' ');
    return normalizeKey([item.name, categoryFor(item), auctionStatusLabel(item.auctionStatus), componentText, bonusText, ...(item.aliases || [])].join(' ')).includes(q);
  });
}

function rowIdentity(item) {
  return item.id != null ? `id:${item.id}` : `name:${normalizeKey(item.name)}`;
}

function compareRankRows(a, b) {
  if (Boolean(a.referenceOnly) !== Boolean(b.referenceOnly)) return a.referenceOnly ? 1 : -1;
  const aOff = !isRankableSale(a), bOff = !isRankableSale(b);
  if (aOff !== bOff) return aOff ? 1 : -1;
  const aThin = isThinListingRow(a), bThin = isThinListingRow(b);
  if (aThin !== bThin) return aThin ? 1 : -1;
  const aNone = hasNoPriceEvidence(a), bNone = hasNoPriceEvidence(b);
  if (aNone !== bNone) return aNone ? 1 : -1;
  if (a.referenceOnly) return b.referenceMesoPerThousand - a.referenceMesoPerThousand;
  // 둘 다 Infinity 면 차가 NaN 이라 정렬이 무너진다.
  const diff = a.listingEfficiency - b.listingEfficiency;
  return Number.isFinite(diff) ? diff : 0;
}

// 구성품이 없는 단독 상품이 저매물 호가 하나로만 값이 잡히면 순위를 매기지 않는다.
// 패키지는 여러 구성품으로 평균되므로 뱃지만 달고 순위는 유지한다.
function isThinListingRow(item) {
  return !componentList(item.components).length && Boolean(item.listingPrice?.thinListingOnly);
}

// 매물도 시세도 없는 행. 신규 등록 직후나 조회 전 상품이 여기 해당한다.
// 값을 모르는 것이지 값이 낮은 것이 아니므로 순위를 매기지 않는다.
//
// seedMesoPrice(손으로 적어 둔 초기값)도 근거가 아니다. 경매장에서 확인한 값이
// 아니라 추정이므로 순위에 올리지 않는다. 값 자체는 가격 칸에 그대로 보여 준다.
// price_audit.grade_row 도 이런 행을 F·채택가 0 으로 본다.
function isSeedOnly(item) {
  return !componentList(item.components).length && item.listingPrice?.source === 'seed';
}

function hasNoPriceEvidence(item) {
  if (item.referenceOnly) return false;
  // 'seed' 가 실제 초기값을 뜻하는 것은 구성품 없는 단독 상품에서뿐이다.
  // 패키지에서는 totalPriceFor 가 '채워진 구성품이 하나도 없음'을 같은 이름으로
  // 쓴다 — 그쪽은 아래 meso 검사로 걸러진다.
  if (isSeedOnly(item)) return true;
  return !(roundMeso(item.listingPrice?.meso) > 0);
}

function createRankMap(rows) {
  const ranks = new Map();
  let rank = 0;
  rows.forEach(item => {
    if (!item.referenceOnly && isRankableSale(item) && !isThinListingRow(item)
        && !hasNoPriceEvidence(item)) {
      ranks.set(rowIdentity(item), ++rank);
    }
  });
  return ranks;
}

function syncStableRowOrder(rows) {
  const known = new Set(state.stableRowOrder);
  rows.forEach(item => {
    const key = rowIdentity(item);
    if (!known.has(key)) {
      state.stableRowOrder.push(key);
      known.add(key);
    }
  });
}

function stableDisplayRows(rows) {
  const order = new Map(state.stableRowOrder.map((key, index) => [key, index]));
  return [...rows].sort((a, b) => (order.get(rowIdentity(a)) ?? Number.MAX_SAFE_INTEGER) - (order.get(rowIdentity(b)) ?? Number.MAX_SAFE_INTEGER));
}

// 목록을 다시 그리면 누른 버튼이 새 버튼으로 바뀌어 키보드 위치가 사라진다. 같은 상품의 같은 버튼으로 돌려놓는다.
const FOCUS_KEYS = [
  'data-row-toggle', 'data-sale-price-name', 'data-sale-price-save', 'data-sale-price-reset',
  'data-component-toggle', 'data-major-filter', 'data-job-group-filter'
];

function rememberFocus() {
  const active = document.activeElement;
  const key = active && FOCUS_KEYS.find(name => active.hasAttribute(name));
  if (!key) return () => {};
  const value = active.getAttribute(key);
  const boxId = active.closest('[id]')?.id;
  return () => {
    if (document.contains(active)) return;
    const root = (boxId && document.getElementById(boxId)) || document;
    const find = name => [...root.querySelectorAll(`[${name}]`)].find(element => element.getAttribute(name) === value);
    // '원래 값으로'는 누르면 사라지므로 같은 줄의 '적용'으로 간다.
    const target = find(key) || (key === 'data-sale-price-reset' ? find('data-sale-price-save') : null);
    target?.focus({ preventScroll: true });
  };
}

function render() {
  const restoreFocus = rememberFocus();
  const allRows = enrichItems();
  renderMajorFilterControls(allRows);

  const globalSaleRows = allRows.filter(item => !item.referenceOnly).sort(compareRankRows);
  const referenceRows = allRows.filter(item => item.referenceOnly).sort(compareRankRows);
  syncStableRowOrder([...globalSaleRows, ...referenceRows]);

  const rankByKey = createRankMap(globalSaleRows);
  const rankChanges = new Map();
  if (state.pendingPreviousRanks) {
    rankByKey.forEach((rank, key) => {
      const previous = state.pendingPreviousRanks.get(key);
      if (previous != null && previous !== rank) rankChanges.set(key, previous - rank);
    });
  }
  state.currentRanks = rankByKey;
  state.pendingPreviousRanks = null;

  const filtered = filteredRows(allRows);
  const rows = stableDisplayRows(filtered);
  const rankedVisibleSales = filtered.filter(item => !item.referenceOnly).sort(compareRankRows);
  const saleRows = rows.filter(item => !item.referenceOnly);
  const referenceCount = rows.length - saleRows.length;
  const visibleSaleCatalog = filteredSaleCatalog();
  const visibleSaleCount = flattenSaleSearchItems(visibleSaleCatalog).length;
  const totalSaleCount = flattenSaleSearchItems().length;

  const pageSize = Number(state.pageSize);
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  state.page = Math.min(Math.max(1, Number(state.page) || 1), totalPages);
  const pageStart = pageSize > 0 ? (state.page - 1) * pageSize : 0;
  const pageEnd = pageSize > 0 ? Math.min(pageStart + pageSize, rows.length) : rows.length;
  const pageRows = rows.slice(pageStart, pageEnd);

  syncCategoryOptions(allRows);
  syncPackageToggle();
  syncMoreFilters();
  syncRestingToggle(allRows.filter(item => !item.referenceOnly && item.saleStatus === 'resting').length);
  syncViewToggles();
  renderPremiseLine(latestAuctionUpdatedAtForPremise());
  const credit = state.creditRate || { rate: 0, name: '' };
  $('#credit-rate').textContent = credit.rate > 0 ? `${nf.format(Math.round(credit.rate / 100) * 100)}메소` : '-';
  $('#credit-basis').textContent = credit.rate > 0
    ? `크레딧샵의 ${credit.name} 기준입니다. `
    : '크레딧샵 상품의 경매장 가격을 아직 확인하지 못했습니다. ';
  renderStepSummaries(credit);
  $('#row-count').textContent = referenceCount ? `${saleRows.length}개 + 참고 ${referenceCount}개` : `${saleRows.length}개`;
  // 요약의 '최고 효율'은 지금 살 수 있는 상품만 본다. 휴지기 참고 순위는 넣지 않는다.
  const bestBuyable = rankedVisibleSales.find(isBestCandidate);
  $('#best-efficiency').textContent = bestBuyable ? formatWon(bestBuyable.listingEfficiency) : '-';
  // 순위 탭은 상세 탭의 검색·분류와 무관하게 전체 순위를 보여 준다. kirakiSnapshot 과 같은 줄이다.
  const rankedRows = globalSaleRows.filter(item => rankByKey.has(rowIdentity(item)));
  renderConclusion(rankedRows, rankByKey);
  renderRankList(rankedRows, rankByKey, rankChanges);
  renderWaitingPanel(globalSaleRows, rankByKey, rankChanges);
  renderNotices();
  renderSaleItems(visibleSaleCatalog);
  renderTable(pageRows, rankByKey, rankChanges);
  renderPagination(rows.length, pageStart, pageEnd, totalPages);
  drawPriceCharts();
  restoreFocus();
}

function isBestCandidate(item) {
  return item.purchasable !== false && !isThinListingRow(item) && !hasNoPriceEvidence(item);
}

function renderStepSummaries(credit) {
  const { discountRate, ahFeeRate } = state.settings;
  $('#step-cash').textContent = `상품권 ${Number(discountRate || 0)}% 할인`;
  $('#step-fee').textContent = `수수료 ${Number(ahFeeRate || 0)}%${Number(ahFeeRate) === 3 ? ' MVP' : ' 일반'}`;
  document.querySelectorAll('button[data-discount]').forEach(button => {
    button.classList.toggle('is-active', Number(button.dataset.discount) === Number(discountRate || 0));
  });
  document.querySelectorAll('button[data-fee]').forEach(button => {
    button.classList.toggle('is-active', Number(button.dataset.fee) === Number(ahFeeRate || 0));
  });
  $('#step-mileage').textContent = state.useMileage && mileageUsable() ? '30% 깎아 사기' : '사용 안 함';
  $('#step-credit').textContent = credit.rate > 0
    ? `1점 ${nf.format(Math.round(credit.rate / 100) * 100)}메소 · ${state.useCredit ? '순위에 반영' : '순위 제외'}`
    : state.useCredit ? '순위에 반영' : '순위 제외';
}

// 큰 결론. 1등 상품과 값을 먼저 보이고 2·3위는 작게 붙인다.
function renderConclusion(rankedRows, rankByKey) {
  const best = rankedRows.find(isBestCandidate);
  if (!best) {
    setHtml($('#conclusion'), `
      <article class="verdict">
        <span class="verdict-label">지금 1억 메소당 가장 싼 상품</span>
        <strong class="verdict-won">-</strong>
        <span class="verdict-name">조건에 맞는 상품이 없습니다</span>
      </article>`);
    return;
  }
  const bestRank = rankByKey.get(rowIdentity(best));
  const others = rankedRows.filter(item => item !== best).slice(0, 2);
  const creditLine = hasCreditValue(best)
    ? `<small class="verdict-credit">크레딧 포함 ${formatWon(best.creditEfficiency)}</small>`
    : '';
  setHtml($('#conclusion'), `
    <article class="verdict">
      <span class="verdict-label">지금 1억 메소당 가장 싼 상품</span>
      <strong class="verdict-won">${formatWon(best.listingEfficiency)}</strong>
      <span class="verdict-name">${escapeHtml(best.name)}</span>
      <span class="verdict-meta">${nf.format(best.cashPrice)}원에 사서 ${formatMeso(best.listingPrice.meso)}에 판매${bestRank > 1 ? ` · 전체 ${bestRank}위` : ''}</span>
      ${creditLine}
      <span class="item-badges">${renderLocalPill(best)}${renderEvidencePill(best)}${renderLiquidityPill(best)}</span>
    </article>
    ${others.map(item => `
      <article class="runner-up">
        <span class="runner-rank">${rankByKey.get(rowIdentity(item))}위</span>
        <strong>${formatWon(item.listingEfficiency)}</strong>
        <span class="runner-name">${escapeHtml(item.name)}</span>
        <span class="runner-meta">${nf.format(item.cashPrice)}원 → ${formatMeso(item.listingPrice.meso)}</span>
        <span class="item-badges">${renderWaitingPill(item)}${renderLocalPill(item)}${renderEvidencePill(item)}${renderLiquidityPill(item)}</span>
      </article>
    `).join('')}
  `);
}

// 재판매 대기까지 순위에 넣어 보면 지금 못 사는 상품이 위로 온다. 살 수 없다는 것을 바로 보여 준다.
function renderWaitingPill(item) {
  return item.purchasable === false ? '<small class="rank-tag" title="지금은 살 수 없습니다.">재판매 대기</small>' : '';
}

function hasLocalPrice(name) {
  const key = normalizeKey(name);
  return state.localAuctionRows.some(row => normalizeKey(row.itemName || row.name || row.query) === key);
}

function renderLocalPill(item) {
  const names = [item.name, ...componentList(item.components).map(component => component.name)];
  return names.some(hasLocalPrice) ? '<span class="evidence-pill local-pill">내가 고친 값</span>' : '';
}

function hasCreditValue(item) {
  return Number.isFinite(item.creditEfficiency) && Number.isFinite(item.listingEfficiency)
    && item.creditEfficiency < item.listingEfficiency;
}

function renderRankList(rankedRows, rankByKey, rankChanges) {
  const visible = state.rankListAll ? rankedRows : rankedRows.slice(0, RANK_LIST_LIMIT);
  setHtml($('#rank-rows'), visible.length
    ? visible.map(item => renderListRow(item, rankByKey, rankChanges)).join('')
    : '<li class="empty">표시할 항목이 없습니다.</li>');
  const more = $('#rank-more');
  more.hidden = rankedRows.length <= RANK_LIST_LIMIT;
  more.textContent = state.rankListAll ? '상위 10개만 보기' : `전체 ${rankedRows.length}개 보기`;
}

function renderWaitingPanel(saleRows, rankByKey, rankChanges) {
  const packages = saleRows.filter(item => isPackageItem(item) && item.purchasable !== false && passesEvidenceFilter(item));
  const waiting = saleRows.filter(item => (item.saleStatus === 'resting' || item.saleStatus === 'upcoming') && passesEvidenceFilter(item));
  $('#package-count').textContent = `${packages.length}개`;
  $('#waiting-count').textContent = `${waiting.length}개`;
  setHtml($('#package-rows'), packages.length
    ? packages.map(item => renderListRow(item, rankByKey, rankChanges)).join('')
    : `<li class="empty">${state.officialOnly ? '교환이 확인된 패키지가 없습니다.' : '지금 살 수 있는 패키지가 없습니다.'}</li>`);
  const visible = state.waitingListAll ? waiting : waiting.slice(0, WAITING_LIST_LIMIT);
  setHtml($('#waiting-rows'), visible.length
    ? visible.map(item => renderListRow(item, rankByKey, rankChanges)).join('')
    : `<li class="empty">${state.officialOnly ? '교환이 확인된 재판매 대기 상품이 없습니다.' : '재판매를 기다리는 상품이 없습니다.'}</li>`);
  const more = $('#waiting-more');
  more.hidden = waiting.length <= WAITING_LIST_LIMIT;
  more.textContent = state.waitingListAll ? `${WAITING_LIST_LIMIT}개만 보기` : `전체 ${waiting.length}개 보기`;
  $('#resting-quick-toggle').textContent = state.includeResting ? '순위에서 빼기' : '순위에 같이 보기';
}

const EVIDENCE_SENTENCE = Object.freeze({
  official: '공지에 넥슨캐시로 사면 교환할 수 있다고 적혀 있습니다.',
  ingame: '캐시샵 구매 화면에서 교환할 수 있다고 확인했습니다.',
  creditShop: '크레딧샵에서 산 것은 교환이 공식이고, 넥슨캐시로 산 것은 체결로 확인했습니다.',
  observed: '공식 문구는 없고 경매장에서 팔리고 있습니다.'
});

// 순위 탭·패키지·재판매 대기가 같이 쓰는 줄. 누르면 근거가 펼쳐진다.
function renderListRow(item, rankByKey, rankChanges) {
  const key = rowIdentity(item);
  const rankNumber = rankByKey.get(key);
  const saleInfo = saleWindowSummary(item);
  const expanded = state.expandedRowKeys.has(key);
  const noValue = !Number.isFinite(item.listingEfficiency);
  const rowClass = ['list-row', rankNumber && rankNumber <= 3 ? `top-rank rank-${rankNumber}` : ''].filter(Boolean).join(' ');
  const badge = renderRankBadge(item, rankNumber, rankChanges.get(key) || 0, saleInfo);
  // 순위 숫자 대신 표시가 붙는 줄. 폰에서 표시를 한 줄 위로 올린다(:has() 를 못 쓰는 브라우저도 같게).
  const tagged = badge.includes('source-pill');
  return `
    <li class="${rowClass}">
      <button class="list-row-main${tagged ? ' has-tag' : ''}" type="button" data-row-toggle="${escapeAttribute(key)}" aria-expanded="${expanded}">
        <span class="row-rank">${badge}</span>
        <span class="row-item">
          <span class="item-name">${escapeHtml(item.name)}</span>
          <span class="item-meta">${escapeHtml(item.category || '캐시 아이템')}${saleMetaText(item, saleInfo)}</span>
          <span class="item-badges">${renderItemBadges(item)}</span>
        </span>
        <span class="row-figures">
          <span class="row-figure"><small>캐시 가격</small><b>${nf.format(Number(item.cashPrice || 0))}원</b></span>
          <span class="row-figure"><small>판매가</small><b>${formatMeso(item.listingPrice?.meso)}</b></span>
        </span>
        <span class="row-won">
          <b class="eff-value">${noValue ? '-' : formatWon(item.listingEfficiency)}</b>
          ${hasCreditValue(item) ? `<small class="credit-meta">크레딧 포함 ${formatWon(item.creditEfficiency)}</small>` : ''}
        </span>
        <span class="row-chevron" aria-hidden="true"></span>
      </button>
      ${expanded ? renderRowDetail(item) : ''}
    </li>
  `;
}

function renderRowDetail(item) {
  const price = item.listingPrice || {};
  const breakdown = componentBreakdown(item);
  const facts = [['계산에 쓴 판매가', formatMeso(price.meso)]];
  if (breakdown) {
    facts.push(['구성품', breakdown.label]);
  } else {
    if (Number(price.listingMeso) > 0) {
      facts.push(['현재 매물', `${formatMeso(price.listingMeso)}${price.listingCount ? ` · ${nf.format(price.listingCount)}건` : ''}`]);
    }
    if (Number(price.marketHistoryMeso) > 0) facts.push(['시세', formatMeso(price.marketHistoryMeso)]);
    if (Math.round(Number(price.marketGapRate || 0)) > 0) facts.push(['매물과 시세 차이', `${Math.round(price.marketGapRate)}%`]);
    if (Number(price.saleCount) > 0) facts.push(['3개월 체결', `${nf.format(price.saleCount)}건`]);
  }
  const level = exchangeEvidenceLevel(item);
  const notes = [
    level ? EVIDENCE_SENTENCE[level] : '',
    breakdown ? '' : lowLiquidityNote(price)
  ].filter(Boolean);
  return `
    <div class="row-detail">
      ${renderPriceChart(item)}
      <dl>${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>
      ${notes.map(note => `<p>${escapeHtml(note)}</p>`).join('')}
      ${breakdown && breakdown.bonus.length
        ? `<p>따로 팔 수 없어 합계에서 뺐습니다: ${escapeHtml(breakdown.bonus.map(componentDisplayName).join(', '))}</p>`
        : ''}
      ${renderSaleEditor(item, breakdown)}
    </div>
  `;
}

// ── 판매가 추이 그래프 ──────────────────────────────────────────────
// 처음 줄을 펼칠 때 한 번 불러온다. 못 읽으면 그래프만 빠지고 계산기는 그대로다.
let priceHistoryRequest = null;

function requestPriceHistory() {
  if (priceHistoryRequest) return;
  priceHistoryRequest = loadJson(DATA_PATHS.priceHistory, null)
    .then(doc => { state.priceHistory = normalizePriceHistory(doc); })
    .catch(() => { state.priceHistory = new Map(); })
    .finally(() => render());
}

// 필드 이름이 길든 짧든(d·l·m·s) fields 순서대로 읽는다.
function normalizePriceHistory(doc) {
  const history = new Map();
  if (!doc || typeof doc.items !== 'object' || !doc.items) return history;
  const [dateKey, listingKey, marketKey, saleKey] = Array.isArray(doc.fields) && doc.fields.length === 4
    ? doc.fields : ['date', 'listing', 'market', 'sale'];
  for (const [name, rows] of Object.entries(doc.items)) {
    if (!Array.isArray(rows)) continue;
    const points = rows
      .map(row => ({
        date: String(row?.[dateKey] || ''),
        t: Date.parse(`${row?.[dateKey]}T00:00:00+09:00`),
        listing: Number(row?.[listingKey]) > 0 ? Number(row[listingKey]) : null,
        market: Number(row?.[marketKey]) > 0 ? Number(row[marketKey]) : null,
        sale: Number(row?.[saleKey]) > 0 ? Number(row[saleKey]) : null
      }))
      .filter(point => Number.isFinite(point.t))
      .sort((a, b) => a.t - b.t);
    history.set(normalizeKey(name), points);
  }
  return history;
}

// 단품은 자기 그래프, 한 가지 상품을 여러 개 묶은 것은 그 단품 그래프. 패키지는 그리지 않는다.
function priceChartTarget(item) {
  const breakdown = componentBreakdown(item);
  if (!breakdown) return { name: item.name, quantity: 1 };
  if (breakdown.bonus.length || breakdown.tradable.length !== 1) return null;
  return { name: breakdown.tradable[0].name, quantity: breakdown.tradable[0].quantity };
}

function chartDate(point) {
  const [, month, day] = point.date.split('-').map(Number);
  return `${month}.${day}`;
}

// 예전 회차에 잘못 잡힌 호가(마네킹 100억 같은 값)가 축을 망가뜨리지 않게 그래프에서만 뺀다. 파일 값은 그대로다.
function chartPoints(name) {
  const points = (state.priceHistory.get(normalizeKey(name)) || []).filter(point => point.sale);
  const sorted = points.map(point => point.sale).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return points.filter(point => point.sale <= median * 3 && point.sale >= median / 3);
}

function renderPriceChart(item) {
  if (state.priceHistory === null) {
    requestPriceHistory();
    return '';
  }
  const target = priceChartTarget(item);
  if (!target) return '';
  const points = chartPoints(target.name);
  if (points.length < 2) return '';
  const sales = points.map(point => point.sale);
  const last = points[points.length - 1];
  return `
    <figure class="price-chart">
      <figcaption>
        <b>판매가 추이${target.quantity > 1 ? ` <small>${escapeHtml(target.name)} 1개</small>` : ''}</b>
        <span class="price-chart-stats">
          <span>최저 <strong>${formatMeso(Math.min(...sales))}</strong></span>
          <span>최고 <strong>${formatMeso(Math.max(...sales))}</strong></span>
          <span>지금 <strong class="is-now">${formatMeso(last.sale)}</strong></span>
        </span>
      </figcaption>
      <div class="price-chart-plot" tabindex="0" role="img" data-history-name="${escapeAttribute(target.name)}"
        aria-label="${escapeAttribute(`${target.name} 판매가 추이, ${chartDate(points[0])}부터 ${chartDate(last)}까지, 최저 ${formatMeso(Math.min(...sales))}, 최고 ${formatMeso(Math.max(...sales))}, 지금 ${formatMeso(last.sale)}`)}"></div>
    </figure>
  `;
}

// 줄이 화면에 들어온 뒤 실제 폭을 재서 그린다. 폭이 같으면 다시 그리지 않는다.
function drawPriceCharts(force = false) {
  if (!(state.priceHistory instanceof Map)) return;
  document.querySelectorAll('.price-chart-plot').forEach(plot => {
    const width = Math.round(plot.clientWidth);
    if (!width || (!force && Number(plot.dataset.width) === width)) return;
    const points = chartPoints(plot.dataset.historyName);
    if (points.length < 2) return;
    drawPriceChart(plot, points, width);
  });
}

function drawPriceChart(plot, points, width) {
  const height = width < 420 ? 140 : 168;
  const pad = { top: 14, right: 52, bottom: 26, left: 6 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const sales = points.map(point => point.sale);
  let lo = Math.min(...sales);
  let hi = Math.max(...sales);
  const spread = hi - lo || hi * 0.1 || 1;
  lo = Math.max(0, lo - spread * 0.15);
  hi += spread * 0.15;
  const t0 = points[0].t;
  const t1 = points[points.length - 1].t;
  const x = t => pad.left + (t1 === t0 ? innerW / 2 : (t - t0) / (t1 - t0) * innerW);
  const y = value => pad.top + (hi - value) / (hi - lo) * innerH;
  const inRange = value => value != null && value >= lo && value <= hi;
  const pts = points.map(point => ({ ...point, x: x(point.t), y: y(point.sale) }));

  const line = pts.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join('');
  const area = `${line}L${pts[pts.length - 1].x.toFixed(1)},${pad.top + innerH}L${pts[0].x.toFixed(1)},${pad.top + innerH}Z`;
  const digits = hi - lo < MESO_INPUT_UNIT * 0.3 ? 2 : 1;
  const grid = [0, 0.5, 1].map(ratio => {
    const value = lo + (hi - lo) * (1 - ratio);
    const gy = pad.top + innerH * ratio;
    return `<line class="pc-grid" x1="${pad.left}" x2="${pad.left + innerW}" y1="${gy}" y2="${gy}"/>
      <text class="pc-axis" x="${width - 4}" y="${gy + 4}" text-anchor="end">${(value / MESO_INPUT_UNIT).toFixed(digits)}억</text>`;
  }).join('');
  // 가로축: 처음·끝 날짜와, 자리가 있으면 그 사이 달의 첫날.
  const ticks = [{ t: t0, label: chartDate(points[0]), anchor: 'start' }, { t: t1, label: chartDate(points[points.length - 1]), anchor: 'end' }];
  const start = new Date(t0 + 9 * 3600000);
  for (let month = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)); month.getTime() - 9 * 3600000 < t1; month.setUTCMonth(month.getUTCMonth() + 1)) {
    const t = month.getTime() - 9 * 3600000;
    if (x(t) - x(t0) > 44 && x(t1) - x(t) > 44) ticks.push({ t, label: `${month.getUTCMonth() + 1}월`, anchor: 'middle', month: true });
  }
  const xAxis = ticks.map(tick => `${tick.month ? `<line class="pc-grid pc-month" x1="${x(tick.t)}" x2="${x(tick.t)}" y1="${pad.top}" y2="${pad.top + innerH}"/>` : ''}
    <text class="pc-axis" x="${tick.anchor === 'start' ? pad.left : tick.anchor === 'end' ? pad.left + innerW : x(tick.t)}" y="${height - 7}" text-anchor="${tick.anchor}">${tick.label}</text>`).join('');
  const dots = pts.map((point, index) => `<circle class="pc-dot${index === pts.length - 1 ? ' is-last' : ''}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${index === pts.length - 1 ? 4 : 3}"/>`).join('');

  plot.innerHTML = `
    <svg class="pc-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">
      ${grid}${xAxis}
      <path class="pc-area" d="${area}"/>
      <path class="pc-line" d="${line}"/>
      ${dots}
      <g class="pc-focus" hidden>
        <line class="pc-guide" y1="${pad.top}" y2="${pad.top + innerH}"/>
        <rect class="pc-listing" width="7" height="7" rx="1"/>
        <path class="pc-market" d="M0,-5L5,0L0,5L-5,0Z"/>
        <circle class="pc-pick" r="5"/>
      </g>
    </svg>
    <div class="pc-tip" hidden></div>`;
  plot.dataset.width = String(width);
  plot._chart = { pts, y, inRange, width, pinned: false, index: -1 };
  bindPriceChart(plot);
}

function selectPricePoint(plot, index) {
  const chart = plot._chart;
  const focus = plot.querySelector('.pc-focus');
  const tip = plot.querySelector('.pc-tip');
  if (!chart || !focus || !tip) return;
  chart.index = index;
  if (index < 0) {
    focus.hidden = true;
    tip.hidden = true;
    return;
  }
  const point = chart.pts[index];
  focus.hidden = false;
  focus.querySelector('.pc-guide').setAttribute('x1', point.x);
  focus.querySelector('.pc-guide').setAttribute('x2', point.x);
  const pick = focus.querySelector('.pc-pick');
  pick.setAttribute('cx', point.x);
  pick.setAttribute('cy', point.y);
  const listing = focus.querySelector('.pc-listing');
  listing.toggleAttribute('hidden', !chart.inRange(point.listing));
  if (chart.inRange(point.listing)) {
    listing.setAttribute('x', point.x - 3.5);
    listing.setAttribute('y', chart.y(point.listing) - 3.5);
  }
  const market = focus.querySelector('.pc-market');
  market.toggleAttribute('hidden', !chart.inRange(point.market));
  if (chart.inRange(point.market)) market.setAttribute('transform', `translate(${point.x},${chart.y(point.market)})`);
  tip.innerHTML = `<b>${chartDate(point)}</b>
    <span class="pc-tip-sale">판매가 <strong>${formatMeso(point.sale)}</strong></span>
    <span><i class="pc-key-listing" aria-hidden="true"></i>매물 ${formatMeso(point.listing)}</span>
    <span><i class="pc-key-market" aria-hidden="true"></i>체결 ${formatMeso(point.market)}</span>`;
  tip.hidden = false;
  // 고른 점과 안내선이 가려지지 않게 점 옆에 둔다. 오른쪽에 자리가 없으면 왼쪽.
  const right = point.x + 12;
  const left = right + tip.offsetWidth <= chart.width ? right : Math.max(0, point.x - 12 - tip.offsetWidth);
  tip.style.transform = `translateX(${Math.round(left)}px)`;
}

function nearestPricePoint(plot, clientX) {
  const chart = plot._chart;
  const offset = clientX - plot.getBoundingClientRect().left;
  let best = 0;
  chart.pts.forEach((point, index) => {
    if (Math.abs(point.x - offset) < Math.abs(chart.pts[best].x - offset)) best = index;
  });
  return best;
}

// 마우스는 올리면 보이고, 손가락은 누르면 고정된다. 키보드는 ←→ 로 점을 옮긴다.
function bindPriceChart(plot) {
  if (plot.dataset.bound) return;
  plot.dataset.bound = '1';
  plot.addEventListener('pointermove', event => {
    if (!plot._chart || (plot._chart.pinned && event.pointerType !== 'mouse')) return;
    selectPricePoint(plot, nearestPricePoint(plot, event.clientX));
  });
  plot.addEventListener('pointerdown', event => {
    if (!plot._chart) return;
    const index = nearestPricePoint(plot, event.clientX);
    plot._chart.pinned = !(plot._chart.pinned && plot._chart.index === index);
    selectPricePoint(plot, plot._chart.pinned ? index : -1);
  });
  plot.addEventListener('pointerleave', () => {
    if (plot._chart && !plot._chart.pinned) selectPricePoint(plot, -1);
  });
  plot.addEventListener('focus', () => {
    if (plot._chart && plot._chart.index < 0) selectPricePoint(plot, plot._chart.pts.length - 1);
  });
  plot.addEventListener('blur', () => {
    if (plot._chart) {
      plot._chart.pinned = false;
      selectPricePoint(plot, -1);
    }
  });
  plot.addEventListener('keydown', event => {
    const chart = plot._chart;
    if (!chart) return;
    if (event.key === 'Escape') {
      selectPricePoint(plot, -1);
      return;
    }
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const from = chart.index < 0 ? chart.pts.length - 1 : chart.index;
    selectPricePoint(plot, Math.min(Math.max(from + step, 0), chart.pts.length - 1));
  });
}

// 조사가 밀려도 각자 지금 본 값으로 계산할 수 있게 줄 안에서 판매가를 고친다. 패키지는 구성품별로 고친다.
function renderSaleEditor(item, breakdown) {
  const targets = breakdown && breakdown.tradable.length ? breakdown.tradable : [{ name: item.name, quantity: 1 }];
  const rows = targets.map(target => {
    const price = breakdown ? breakdown.prices.get(normalizeKey(target.name)) : item.listingPrice;
    const name = escapeAttribute(target.name);
    const hint = !breakdown ? ''
      : price?.source === 'pending'
        ? `${Number(price.listingMeso) > 0 ? `매물 ${formatMeso(price.listingMeso)}, ` : ''}체결 확인 전이라 합계에서 뺐습니다`
        : !(Number(price?.meso) > 0) ? '아직 가격이 없습니다' : '';
    return `
      <div class="sale-editor-row">
        <label>
          <span>${breakdown ? `${escapeHtml(componentDisplayName(target))}${hint ? `<small class="sale-editor-hint">${hint}</small>` : ''}` : '내 판매가'}</span>
          <input class="sale-editor-input" type="number" min="0" step="0.01" inputmode="decimal"
            value="${mesoToInputUnit(price?.meso) || ''}" data-sale-price-name="${name}"
            aria-label="${name} 판매가 (억 메소)">
          <em>억</em>
        </label>
        <button class="sale-editor-save" type="button" data-sale-price-save="${name}">적용</button>
        ${hasLocalPrice(target.name) ? `<button class="link-button" type="button" data-sale-price-reset="${name}">원래 값으로</button>` : ''}
      </div>`;
  }).join('');
  return `<div class="sale-editor">${rows}<small>고친 값은 이 브라우저에만 저장됩니다.</small></div>`;
}

function renderPagination(total, start, end, totalPages) {
  const pageSize = $('#page-size');
  const previous = $('#page-prev');
  const next = $('#page-next');
  const pageState = $('#page-state');
  if (!pageSize || !previous || !next || !pageState) return;

  pageSize.value = String(state.pageSize);
  previous.disabled = state.page <= 1;
  next.disabled = state.page >= totalPages;
  pageState.textContent = total
    ? `${state.page}/${totalPages} · ${start + 1}-${end} / ${total}`
    : '0 / 0';
}

function updateTablePage(page) {
  state.page = page;
  render();
  const table = $('.table-wrap');
  if (table) table.scrollTop = 0;
}

function renderNotices() {
  const list = $('#notice-list');
  if (!state.notices.length) {
    setHtml(list, '<div class="notice-item"><strong>캐시샵 업데이트 없음</strong><span>최근 등록된 내역이 없습니다.</span></div>');
    return;
  }
  setHtml(list, state.notices.map(notice => {
    const title = escapeHtml(notice.title);
    const meta = `<span>${escapeHtml(formatDate(notice.date))}</span>`;
    const tags = renderNoticeItems(notice.items);
    const summary = !tags && notice.summary ? `<p class="notice-summary">${escapeHtml(notice.summary)}</p>` : '';
    const body = `<strong>${title}</strong>${meta}${tags}${summary}`;
    return notice.url
      ? `<a class="notice-item" href="${escapeAttribute(notice.url)}" target="_blank" rel="noreferrer">${body}</a>`
      : `<div class="notice-item">${body}</div>`;
  }).join(''));
}

function renderNoticeItems(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return `<div class="notice-tags">${items.map(item => `<span class="notice-tag">${escapeHtml(item)}</span>`).join('')}</div>`;
}

function renderSaleItems(catalog) {
  const list = $('#sale-item-list');
  if (!catalog.length) {
    setHtml(list, '<div class="sale-item"><strong>검색 결과 없음</strong><span>다른 분류나 검색어를 선택해보세요.</span></div>');
    return;
  }
  setHtml(list, catalog.map(sale => {
    const chips = sale.items.map(item => (
      `<span class="sale-tag${item.needsReview ? ' review' : ''}" title="${escapeAttribute(item.type)}">${escapeHtml(item.name)}<em>${escapeHtml(item.type)}</em></span>`
    )).join('');
    const reviewCount = sale.items.filter(item => item.needsReview).length;
    const meta = `${sale.items.length}개${reviewCount ? ` · 확인 필요 ${reviewCount}` : ''}`;
    const body = `<summary><strong>${escapeHtml(sale.label)}</strong><span>${escapeHtml(meta)}</span></summary><div class="sale-tags">${chips}</div>`;
    return sale.url
      ? `<details class="sale-item">${body}<a class="sale-link" href="${escapeAttribute(sale.url)}" target="_blank" rel="noreferrer">공지 열기</a></details>`
      : `<details class="sale-item">${body}</details>`;
  }).join(''));
}

function renderRankBadge(item, rankNumber, rankDelta, saleInfo) {
  const rankChange = rankDelta > 0
    ? `<small class="rank-change up">↑${rankDelta}</small>`
    : rankDelta < 0
      ? `<small class="rank-change down">↓${Math.abs(rankDelta)}</small>`
      : '';
  const soldOut = !isRankableSale(item);
  const restingRanked = item.purchasable === false && !soldOut;
  const thinRow = !soldOut && isThinListingRow(item);
  const noPrice = !soldOut && !thinRow && hasNoPriceEvidence(item);
  return soldOut
    ? salePill(item, saleInfo)
    : thinRow
      ? `<span class="source-pill seed" title="매물 ${item.listingPrice?.listingCount || 0}건뿐이라 가격이 흔들립니다. 체결가를 확인할 때까지 순위에서 뺍니다.">확인 필요</span>`
      : noPrice
        ? (isSeedOnly(item)
            ? '<span class="source-pill seed" title="경매장에서 확인한 가격이 아닙니다. 순위에는 올리지 않습니다.">미확인</span>'
            : '<span class="source-pill seed" title="경매장에 매물도 체결 기록도 없어 계산할 수 없습니다.">가격 없음</span>')
        : `<span class="rank-cell"><span class="rank">${rankNumber}</span>${rankChange}${
            restingRanked ? '<small class="rank-tag" title="지금은 살 수 없습니다.">재판매 대기</small>' : ''}</span>`;
}

function renderItemBadges(item) {
  const turnoverWarning = isPackageItem(item)
    ? '<span class="turnover-pill" title="패키지는 판매까지 시간이 걸릴 수 있습니다." aria-label="회전율 주의">회전율 주의</span>'
    : '';
  const marketWarning = Number(item.listingPrice?.pendingMarketCount || 0) > 0
    ? `<span class="market-warning-pill" title="체결가를 확인하지 못한 구성품은 합계에서 뺐습니다.">체결 미확인 ${item.listingPrice.pendingMarketCount}개</span>`
    : '';
  const thinWarning = Number(item.listingPrice?.thinListingCount || 0) > 0
    ? `<span class="market-warning-pill" title="매물 ${THIN_LISTING_COUNT}건 이하인 구성품이 있습니다. 가격이 흔들릴 수 있습니다.">매물 적음 ${item.listingPrice.thinListingCount}개</span>`
    : '';
  return `${renderLocalPill(item)}${renderEvidencePill(item)}${renderLiquidityPill(item)}${renderMileageBadge(item.mileageType)}${turnoverWarning}${marketWarning}${thinWarning}`;
}

// 상세 탭 표. 상품 이름·판매가·1억당 현금이 먼저 보이고, 판매가는 줄을 펼쳐 순위 탭과 같은 칸으로 고친다.
function renderTable(rows, rankByKey = new Map(), rankChanges = new Map()) {
  const tbody = $('#item-rows');
  if (!rows.length) {
    setHtml(tbody, $('#empty-template').innerHTML);
    return;
  }

  setHtml(tbody, rows.map(item => {
    const isReference = Boolean(item.referenceOnly);
    const key = rowIdentity(item);
    const rankNumber = isReference ? null : rankByKey.get(key);
    const saleInfo = !isReference ? saleWindowSummary(item) : {};
    const rank = isReference
      ? '<span class="source-pill seed">참고</span>'
      : renderRankBadge(item, rankNumber, rankChanges.get(key) || 0, saleInfo);
    const itemMeta = isReference
      ? `<span class="item-meta">마일리지 전용 · 판매 불가 · ${REFERENCE_CATEGORY}</span>`
      : `<span class="item-meta">${escapeHtml(item.category || '캐시 아이템')}${saleMetaText(item, saleInfo)}</span>
         <span class="item-badges">${renderItemBadges(item)}</span>`;
    const cost = isReference
      ? `${nf.format(Number(item.mileagePrice || item.cashPrice || 0))} 마일리지`
      : `${nf.format(Number(item.cashPrice || 0))}원`;
    const expanded = !isReference && state.expandedComponentKeys.has(key);
    const price = isReference
      ? renderReferencePrice(item)
      : `${renderPrice(item.listingPrice)}${renderEditToggle(item, key, expanded)}`;
    const result = isReference
      ? `<span class="eff-value">${formatReferenceMeso(item.referenceMesoPerThousand)}</span><span class="price-meta">1,000 마일리지당 절약</span>`
      : `<span class="eff-value">${formatWon(item.listingEfficiency)}</span>${item.listingPrice?.source === 'pending' ? '<span class="price-meta">확인된 구성품 합계</span>' : ''}${
          hasCreditValue(item)
            ? `<span class="price-meta credit-meta" title="넥슨캐시 5% 적립 크레딧을 모아 크레딧샵 상품을 사서 판다고 가정한 추정치입니다.">크레딧 포함 ${formatWon(item.creditEfficiency)}</span>`
            : ''}`;
    const rowClass = [
      isReference ? 'reference-row' : '',
      isPackageItem(item) ? 'package-row' : '',
      item.listingPrice?.source === 'pending' ? 'market-pending-row' : '',
      rank.includes('source-pill') ? 'has-tag' : '',
      expanded ? 'is-open' : '',
      rankNumber && rankNumber <= 3 ? `top-rank rank-${rankNumber}` : ''
    ].filter(Boolean).join(' ');

    const itemRow = `
      <tr${rowClass ? ` class="${rowClass}"` : ''}>
        <td data-label="순위">${rank}</td>
        <td data-label="상품">
          <span class="item-name">${escapeHtml(item.name)}</span>
          <span class="item-meta-row">${itemMeta}</span>
          <span class="item-cost">${isReference ? '마일리지 가격' : '캐시 가격'} <b>${cost}</b></span>
        </td>
        <td data-label="판매가"><div class="price-cell">${price}</div></td>
        <td data-label="1억당 현금">${result}</td>
      </tr>
    `;
    return itemRow + (expanded ? `<tr class="row-detail-row"><td colspan="4">${renderRowDetail(item)}</td></tr>` : '');
  }).join(''));
}

function renderReferencePrice(item) {
  return `
    <span class="price-display">
      <span class="price-line">
        <span class="price-value">${formatMeso(item.referenceMesoValue)}</span>
        <span class="source-pill seed">대체 구매가</span>
      </span>
    </span>
  `;
}

function renderPrice(price) {
  const status = price.auctionStatus || 'unverified';
  const isSheetOverride = String(price.marketHistoryBasis || '').includes('구글 시트');
  const label = price.source === 'manual'
    ? '수동입력'
    : price.source === 'history'
      ? isSheetOverride ? '시트 보정' : '시세 반영'
      : price.source === 'pending'
        ? '확인 필요'
        : price.source === 'live'
          ? '체결 확인'
          : price.source === 'mixed'
            ? '일부 확인'
            : auctionStatusLabel(status);
  const klass = ['live', 'manual', 'history', 'pending', 'mixed'].includes(price.source) ? price.source : status;
  const note = price.source === 'pending'
    ? `<span class="price-note warning">체결 미확인 ${nf.format(price.pendingMarketCount || 0)}개 제외</span>`
    : '';
  return `
    <span class="price-display">
      <span class="price-line">
        <span class="price-value">${formatMeso(price.meso)}</span>
        <span class="source-pill ${klass}">${escapeHtml(label)}</span>
      </span>
      ${note}
    </span>
  `;
}

// 줄을 펼치는 버튼. 단품은 판매가 하나, 패키지는 구성품마다 고친다.
function renderEditToggle(item, key, expanded) {
  const breakdown = componentBreakdown(item);
  const tradableCount = breakdown ? breakdown.tradable.reduce((sum, component) => sum + component.quantity, 0) : 0;
  const label = breakdown && breakdown.tradable.length ? `구성품 ${nf.format(tradableCount)}개 고치기` : '판매가 고치기';
  return `
    <button class="edit-toggle" type="button"
      data-component-toggle="${escapeAttribute(key)}" aria-expanded="${expanded}">
      <span>${label}</span><span class="edit-chevron" aria-hidden="true"></span>
    </button>
  `;
}

function componentDisplayName(component) {
  return component.quantity > 1 ? `${component.name} ×${nf.format(component.quantity)}` : component.name;
}

function componentBreakdown(item) {
  const tradable = componentList(item.components);
  const bonus = bonusComponentsFor(item);
  if (!tradable.length && !bonus.length) return null;

  const prices = new Map(
    (item.listingPrice?.components || []).map(entry => [normalizeKey(entry.component?.name), entry.price])
  );
  const tradableCount = tradable.reduce((sum, component) => sum + component.quantity, 0);
  const bonusCount = bonus.reduce((sum, component) => sum + component.quantity, 0);
  const label = bonus.length
    ? `전체 ${tradableCount + bonusCount}개 · 합산 ${tradableCount}개 · 제외 ${bonusCount}개`
    : `구성품 ${tradableCount}개`;

  return { tradable, bonus, prices, label };
}

function renderMileageBadge(rawType) {
  // 남은 마일리지 계산을 켰을 때만 보여 준다. 꺼져 있으면 모든 상품을 넥슨캐시 전액 결제로 본다.
  if (!state.useMileage || !mileageUsable()) return '';
  const type = rawType;
  if (type === 'full') return '<span class="mileage-pill full" title="마일리지로 전액 결제">마일리지 100%</span>';
  if (type === 'partial') return '<span class="mileage-pill partial" title="마일리지로 30% 할인">마일리지 30%</span>';
  return '<span class="mileage-pill none" title="마일리지 할인 불가">마일리지 불가</span>';
}

function setActiveTab(name, { focus = false } = {}) {
  document.querySelectorAll('[data-tab]').forEach(tab => {
    const active = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.hidden = panel.id !== `panel-${name}`;
  });
  drawPriceCharts();
}

// 계산 기준과 보기 토글만 되돌린다. 손으로 고친 가격은 '고친 가격 되돌리기'가 맡는다.
function restoreDefaults() {
  state.settings = { ...DEFAULT_SETTINGS };
  state.useMileage = false;
  state.useCredit = false;
  state.officialOnly = false;
  state.includeResting = false;
  persistSettings();
  persistViewSettings();
  syncInputs();
  state.stableRowOrder = [];
  state.page = 1;
  render();
}

// 순위 줄에서 상세 탭으로 넘어갈 때 그 상품 하나만 보이게 필터를 푼다.
function openInDetail(name) {
  state.search = name;
  state.majorFilter = 'all';
  state.jobGroupFilter = 'all';
  state.categoryFilter = '';
  state.statusFilter = '';
  state.packagesVisible = true;
  state.page = 1;
  $('#search-input').value = name;
  $('#status-filter').value = '';
  render();
  setActiveTab('detail');
  $('#panel-detail').scrollIntoView({ block: 'start' });
}

function currentTheme() {
  const chosen = document.documentElement.dataset.theme;
  if (chosen) return chosen;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncThemeButton() {
  const button = $('#theme-toggle');
  if (button) button.textContent = currentTheme() === 'dark' ? '라이트' : '다크';
}

function syncInputs() {
  $('#discount-rate').value = state.settings.discountRate;
  $('#ah-fee-rate').value = state.settings.ahFeeRate;
  $('#base-mp-rate').value = state.settings.baseMpRate;
}

function syncSaleFilterOptions() {
  const group = $('#sale-group-filter');
  group.innerHTML = '<option value="">전체 판매글</option>' + state.saleCatalog
    .map(sale => `<option value="${escapeAttribute(sale.id)}">${escapeHtml(sale.label)}</option>`)
    .join('');
  group.value = state.saleGroupFilter;
}

function renderPresetButton({ kind, value, label, count, active }) {
  const dataAttribute = kind === 'major' ? 'data-major-filter' : 'data-job-group-filter';
  const className = kind === 'major' ? 'major-filter-button' : 'job-group-button';
  return `<button type="button" class="${className} ${active ? 'active' : ''}" ${dataAttribute}="${escapeAttribute(value)}" aria-pressed="${active}">
    <span>${escapeHtml(label)}</span><em>${nf.format(count)}</em>
  </button>`;
}

function renderMajorFilterControls(rows) {
  const majorList = $('#major-filter-list');
  const jobWrap = $('#job-group-filter-wrap');
  const jobList = $('#job-group-filter-list');
  if (!majorList || !jobWrap || !jobList) return;

  majorList.innerHTML = MAJOR_FILTER_OPTIONS.map(([value, label]) => renderPresetButton({
    kind: 'major',
    value,
    label,
    count: rows.filter(item => categoryMatchesMajor(categoryFor(item), value)).length,
    active: state.majorFilter === value
  })).join('');

  jobWrap.hidden = state.majorFilter !== 'job';
  jobList.innerHTML = jobWrap.hidden ? '' : JOB_GROUP_OPTIONS.map(([value, label, category]) => renderPresetButton({
    kind: 'job',
    value,
    label,
    count: category
      ? rows.filter(item => categoryFor(item) === category).length
      : rows.filter(item => categoryMatchesMajor(categoryFor(item), 'job')).length,
    active: state.jobGroupFilter === value
  })).join('');
}

function syncCategoryOptions(rows) {
  const select = $('#category-filter');
  const categories = [...new Set(rows.map(categoryFor))]
    .filter(category => categoryMatchesMajor(category))
    .filter(category => state.packagesVisible || !isPackageCategory(category))
    .sort((a, b) => a.localeCompare(b, 'ko-KR'));
  const current = state.categoryFilter;
  select.innerHTML = '<option value="">전체 세부 분류</option>' + categories
    .map(category => {
      const label = category === REFERENCE_CATEGORY ? `${category} (선택 시 표시)` : category;
      return `<option value="${escapeAttribute(category)}">${escapeHtml(label)}</option>`;
    })
    .join('');
  select.value = categories.includes(current) ? current : '';
  if (select.value !== current) state.categoryFilter = '';
}

function setSyncState(kind, title, detail) {
  const card = $('.sync-card');
  card.classList.remove('ready', 'error');
  if (kind) card.classList.add(kind);
  $('#sync-state').textContent = title;
  $('#sync-detail').textContent = detail;
}

function upsertLocalPrice(name, meso, status = 'live') {
  const cleanName = String(name || '').trim();
  if (!cleanName) return;
  const key = normalizeKey(cleanName);
  const roundedMeso = roundMeso(meso);
  const existing = findPriceRow(cleanName) || {};
  const row = {
    ...existing,
    itemName: cleanName,
    query: cleanName,
    listingLowestMeso: status === 'live' || status === 'seed' ? roundedMeso : 0,
    listingLowestText: status === 'live' || status === 'seed' ? formatMeso(roundedMeso) : '',
    status,
    source: 'manual',
    filter: '수동',
    // priceFor 는 updatedAt 을 먼저 본다. 방금 넣은 값이 원장의 옛 날짜 때문에 낡은 값으로 빠지지 않게 같이 바꾼다.
    collectedAt: nowIso(),
    updatedAt: nowIso()
  };
  const index = state.localAuctionRows.findIndex(price => normalizeKey(price.itemName || price.name || price.query) === key);
  if (index >= 0) state.localAuctionRows.splice(index, 1, row);
  else state.localAuctionRows.push(row);
  persistLocalData();
}

function upsertLocalMarketPrice(name, meso) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return;
  const key = normalizeKey(cleanName);
  const roundedMeso = roundMeso(meso);
  const existing = findPriceRow(cleanName) || {};
  const base = state.auctionRows.find(price => normalizeKey(price.itemName || price.name || price.query) === key) || {};
  const listingMeso = roundMeso(existing.listingLowestMeso);
  const baseMarketMeso = roundMeso(base.marketHistoryMaxMeso || base.marketHistoryMeso);
  const marketHistoryMeso = roundedMeso > 0 ? roundedMeso : baseMarketMeso;
  const row = {
    ...existing,
    itemName: cleanName,
    query: cleanName,
    listingLowestMeso: listingMeso,
    listingLowestText: listingMeso > 0 ? formatMeso(listingMeso) : '',
    // priceFor 는 marketPriceMeso 를 먼저 본다. 손으로 넣은 시세가 원장의 체결가에 가려지지 않게
    // 같은 자리에 넣고, 해제하면 원장 값으로 되돌린다.
    marketPriceMeso: roundedMeso > 0 ? roundedMeso : base.marketPriceMeso,
    marketPriceBasis: roundedMeso > 0 ? 'manual' : base.marketPriceBasis,
    marketPriceAt: roundedMeso > 0 ? nowIso() : base.marketPriceAt,
    marketPriceFrom: roundedMeso > 0 ? undefined : base.marketPriceFrom,
    marketHistoryMaxMeso: marketHistoryMeso,
    marketHistoryMaxText: marketHistoryMeso > 0 ? formatMeso(marketHistoryMeso) : '',
    marketHistoryBasis: roundedMeso > 0
      ? existing.marketHistoryBasis || '시세 탭 체결 상단'
      : base.marketHistoryBasis,
    marketHistoryCollectedAt: roundedMeso > 0 ? nowIso() : base.marketHistoryCollectedAt,
    marketHistoryStatus: roundedMeso > 0 ? 'verified' : base.marketHistoryStatus,
    marketHistoryNote: roundedMeso > 0 ? '' : base.marketHistoryNote,
    status: listingMeso > 0 ? existing.status || 'ok' : 'manual',
    source: 'manual',
    filter: '수동'
  };
  const index = state.localAuctionRows.findIndex(price => normalizeKey(price.itemName || price.name || price.query) === key);
  if (index >= 0) state.localAuctionRows.splice(index, 1, row);
  else state.localAuctionRows.push(row);
  persistLocalData();
}

// 계산은 매물과 시세 중 낮은 쪽을 쓴다. 매물 칸만 고치면 시세보다 높게 적은 값이 무시되므로 둘 다 같은 값으로 넣는다.
function saveSalePrice(name, rawValue) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return;
  const meso = mesoFromInputUnit(rawValue);
  if (meso <= 0) {
    resetSalePrice(cleanName);
    return;
  }
  state.pendingPreviousRanks = new Map(state.currentRanks);
  upsertLocalPrice(cleanName, meso, 'live');
  upsertLocalMarketPrice(cleanName, meso);
  setSyncState('ready', '판매가 적용', `${cleanName} 판매가를 이 브라우저 계산에 반영했습니다.`);
  render();
}

function resetSalePrice(name) {
  const key = normalizeKey(name);
  state.pendingPreviousRanks = new Map(state.currentRanks);
  state.localAuctionRows = state.localAuctionRows.filter(row => normalizeKey(row.itemName || row.name || row.query) !== key);
  persistLocalData();
  setSyncState('ready', '기본 가격 복원', `${name} 판매가를 공용 값으로 되돌렸습니다.`);
  render();
}

function clearAllLocalPrices() {
  if (!state.localAuctionRows.length) {
    setSyncState('ready', '고친 가격 없음', '되돌릴 판매가가 없습니다.');
    return;
  }
  if (!confirm('이 브라우저에서 고친 판매가를 모두 원래 값으로 되돌릴까요?')) return;
  state.pendingPreviousRanks = new Map(state.currentRanks);
  state.localAuctionRows = [];
  persistLocalData();
  setSyncState('ready', '고친 가격 되돌림', '고친 판매가를 모두 원래 값으로 되돌렸습니다.');
  render();
}

function findPriceRow(name) {
  const key = normalizeKey(name);
  return state.localAuctionRows.find(row => normalizeKey(row.itemName || row.name || row.query) === key)
    || state.auctionRows.find(row => normalizeKey(row.itemName || row.name || row.query) === key)
    || state.auctionSkips.find(row => normalizeKey(row.itemName || row.name || row.query) === key)
    || null;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function on(selector, eventName, handler) {
  const element = $(selector);
  if (element) element.addEventListener(eventName, handler);
}

on('#search-input', 'input', event => {
  state.search = event.target.value;
  state.page = 1;
  render();
});

on('#major-filter-list', 'click', event => {
  const button = event.target.closest('button[data-major-filter]');
  if (!button) return;
  state.majorFilter = button.dataset.majorFilter;
  state.jobGroupFilter = 'all';
  state.categoryFilter = state.majorFilter === 'mileage' ? REFERENCE_CATEGORY : '';
  state.packagesVisible = true;
  state.page = 1;
  render();
});

on('#job-group-filter-list', 'click', event => {
  const button = event.target.closest('button[data-job-group-filter]');
  if (!button) return;
  state.majorFilter = 'job';
  state.jobGroupFilter = button.dataset.jobGroupFilter;
  state.categoryFilter = '';
  state.packagesVisible = true;
  state.page = 1;
  render();
});

on('#major-filter-reset', 'click', event => {
  event.preventDefault();
  event.stopPropagation();
  state.majorFilter = 'all';
  state.jobGroupFilter = 'all';
  state.categoryFilter = '';
  state.packagesVisible = true;
  state.page = 1;
  render();
});

function syncViewToggles() {
  const pairs = [['#mileage-toggle', '#mileage-toggle-state', state.useMileage], ['#official-toggle', '#official-toggle-state', state.officialOnly], ['#credit-toggle', '#credit-toggle-state', state.useCredit]];
  for (const [input, label, value] of pairs) {
    if ($(input)) $(input).checked = value;
    if ($(label)) $(label).textContent = value ? 'ON' : 'OFF';
  }
  const mileageWrap = $('#mileage-toggle-wrap');
  if (mileageWrap) mileageWrap.hidden = !mileageUsable();
  // 마일리지가 사라지면 시세 칸도 쓸 데가 없으니 단계째 숨긴다.
  const mileageStep = $('#mileage-step');
  if (mileageStep) mileageStep.hidden = !mileageUsable();
}

function latestAuctionUpdatedAtForPremise() {
  return [state.metadata.auctionUpdatedAt, state.localAuctionRows.length ? state.localDataUpdatedAt : null]
    .filter(Boolean)
    .sort((a, b) => (Date.parse(b) || 0) - (Date.parse(a) || 0))[0] || null;
}

// 숫자가 어떤 전제 위에 서 있는지 한 줄로 밝힌다.
function renderPremiseLine(updatedAt) {
  const lines = document.querySelectorAll('.premise-line');
  if (!lines.length) return;
  const mileageWon = Math.round(FIXED_MILEAGE_MESO_RATE * Number(state.settings.baseMpRate || 0) / 100000000 * 100) / 100;
  const parts = [
    `가격 ${formatDate(updatedAt)} 기준`,
    `상품권 할인 ${Number(state.settings.discountRate || 0)}%`,
    `경매장 수수료 ${Number(state.settings.ahFeeRate || 0)}%`,
    state.useCredit ? '크레딧 적립 포함' : '크레딧 적립은 뺀 값',
    state.useMileage && mileageUsable() ? `남은 마일리지 30% 사용(1점을 ${mileageWon}원으로 침)` : '',
    '파는 데 걸리는 시간은 넣지 않음'
  ].filter(Boolean);
  lines.forEach(line => { line.textContent = parts.join(' · '); });
}

// 화면에 보이는 숫자를 그대로 내보낸다. 영상에 쓴 순위표의 근거를 날짜와 함께 남길 때 쓴다.
window.kirakiSnapshot = () => {
  const rows = enrichItems().filter(item => !item.referenceOnly).sort(compareRankRows);
  const ranks = createRankMap(rows);
  return {
    takenAt: nowIso(),
    auctionUpdatedAt: latestAuctionUpdatedAtForPremise(),
    settings: { ...state.settings, useMileage: state.useMileage && mileageUsable(), useCredit: state.useCredit, officialOnly: state.officialOnly, includeResting: state.includeResting },
    credit: { ...state.creditRate, earnRate: state.creditShop.earnRate },
    rows: rows.filter(item => ranks.has(rowIdentity(item))).map(item => ({
      rank: ranks.get(rowIdentity(item)), name: item.name, cashPrice: item.cashPrice,
      adoptedMeso: item.listingPrice.meso, listingMeso: item.listingPrice.listingMeso || null,
      marketMeso: item.listingPrice.marketHistoryMeso || null, listingCount: item.listingPrice.listingCount || null,
      saleCount3m: item.listingPrice.saleCount || null, lowLiquidity: Boolean(lowLiquidityNote(item.listingPrice)) && !componentList(item.components).length,
      gapPercent: Math.round((item.listingPrice.marketGapRate || 0) * 10) / 10,
      collectedAt: item.listingPrice.collectedAt || null, marketAt: item.listingPrice.marketHistoryCollectedAt || null,
      wonPerEok: Math.round(item.listingEfficiency * 10) / 10,
      wonPerEokWithCredit: Math.round(item.creditEfficiency * 10) / 10,
      exchangeEvidence: exchangeEvidenceLevel(item) || null, saleStatus: item.saleStatus,
      components: componentList(item.components).length || 0
    }))
  };
};

for (const [selector, key] of [['#mileage-toggle', 'useMileage'], ['#official-toggle', 'officialOnly'], ['#credit-toggle', 'useCredit']]) {
  on(selector, 'change', event => {
    state[key] = event.target.checked;
    persistViewSettings();
    state.stableRowOrder = [];
    state.page = 1;
    render();
  });
}

on('#resting-toggle', 'change', event => {
  state.includeResting = event.target.checked;
  persistViewSettings();
  // 순위 집합이 바뀌므로 고정해 둔 행 순서를 버리고 새 순위대로 다시 세운다.
  state.stableRowOrder = [];
  state.page = 1;
  render();
});

on('#package-filter-toggle', 'change', event => {
  state.packagesVisible = event.target.checked;
  if (!state.packagesVisible && isPackageCategory(state.categoryFilter)) state.categoryFilter = '';
  state.page = 1;
  render();
});

on('#category-filter', 'change', event => {
  state.categoryFilter = event.target.value;
  if (state.majorFilter === 'job' && state.categoryFilter) {
    state.jobGroupFilter = JOB_GROUP_OPTIONS.find(([, , category]) => category === state.categoryFilter)?.[0] || 'all';
  }
  state.page = 1;
  render();
});

on('#status-filter', 'change', event => {
  state.statusFilter = event.target.value;
  state.page = 1;
  render();
});

on('#sale-search-input', 'input', event => {
  state.saleSearch = event.target.value;
  render();
});

on('#sale-group-filter', 'change', event => {
  state.saleGroupFilter = event.target.value;
  render();
});

on('#sale-type-filter', 'change', event => {
  state.saleTypeFilter = event.target.value;
  render();
});

on('#sale-review-filter', 'change', event => {
  state.saleReviewFilter = event.target.value;
  render();
});

on('#page-size', 'change', event => {
  state.pageSize = Number(event.target.value);
  updateTablePage(1);
});

on('#page-prev', 'click', () => updateTablePage(state.page - 1));
on('#page-next', 'click', () => updateTablePage(state.page + 1));

on('#discount-rate', 'input', event => {
  state.settings.discountRate = Number(event.target.value || 0);
  state.page = 1;
  persistSettings();
  render();
});

on('#ah-fee-rate', 'change', event => {
  state.settings.ahFeeRate = Number(event.target.value || 5);
  state.page = 1;
  persistSettings();
  render();
});

on('#base-mp-rate', 'input', event => {
  state.settings.baseMpRate = Number(event.target.value || 0);
  state.page = 1;
  persistSettings();
  render();
});

on('.view-tabs', 'click', event => {
  const tab = event.target.closest('button[data-tab]');
  if (tab) setActiveTab(tab.dataset.tab);
});

on('.view-tabs', 'keydown', event => {
  const tabs = [...document.querySelectorAll('[data-tab]')];
  const current = tabs.indexOf(document.activeElement);
  if (current < 0 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const step = event.key === 'ArrowRight' ? 1 : -1;
  setActiveTab(tabs[(current + step + tabs.length) % tabs.length].dataset.tab, { focus: true });
});

on('#restore-defaults', 'click', restoreDefaults);

on('#theme-toggle', 'click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (_) { /* 저장 못 해도 이번 화면은 바뀐다 */ }
  syncThemeButton();
});

on('main', 'click', event => {
  const goto = event.target.closest('button[data-goto-tab]');
  if (goto) {
    // 누른 버튼이 숨는 탭에 있으므로 키보드 위치를 새 탭으로 옮긴다.
    setActiveTab(goto.dataset.gotoTab, { focus: true });
    return;
  }
  const open = event.target.closest('button[data-open-detail]');
  if (open) {
    openInDetail(open.dataset.openDetail);
    return;
  }
  const saleSave = event.target.closest('button[data-sale-price-save]');
  if (saleSave) {
    const input = saleSave.closest('.sale-editor-row')?.querySelector('.sale-editor-input');
    saveSalePrice(saleSave.dataset.salePriceSave, input?.value);
    return;
  }
  const saleReset = event.target.closest('button[data-sale-price-reset]');
  if (saleReset) {
    resetSalePrice(saleReset.dataset.salePriceReset);
    return;
  }
  const row = event.target.closest('button[data-row-toggle]');
  if (row) {
    const key = row.dataset.rowToggle;
    if (state.expandedRowKeys.has(key)) state.expandedRowKeys.delete(key);
    else state.expandedRowKeys.add(key);
    render();
  }
});

on('main', 'keydown', event => {
  if (event.key !== 'Enter' || !event.target.matches('.sale-editor-input')) return;
  event.preventDefault();
  saveSalePrice(event.target.dataset.salePriceName, event.target.value);
});

on('main', 'click', event => {
  const discount = event.target.closest('button[data-discount]');
  if (discount) {
    const input = $('#discount-rate');
    input.value = discount.dataset.discount;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const fee = event.target.closest('button[data-fee]');
  if (fee) {
    const select = $('#ah-fee-rate');
    select.value = fee.dataset.fee;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
});

on('#rank-more', 'click', () => {
  state.rankListAll = !state.rankListAll;
  render();
});

on('#waiting-more', 'click', () => {
  state.waitingListAll = !state.waitingListAll;
  render();
});

on('#resting-quick-toggle', 'click', () => $('#resting-toggle').click());

on('#item-rows', 'click', event => {
  const toggle = event.target.closest('button[data-component-toggle]');
  if (!toggle) return;
  const key = toggle.dataset.componentToggle;
  if (state.expandedComponentKeys.has(key)) state.expandedComponentKeys.delete(key);
  else state.expandedComponentKeys.add(key);
  render();
});

on('#reset-local-prices', 'click', clearAllLocalPrices);

window.addEventListener('focus', () => {
  void refreshSheetMarketRows();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void refreshSheetMarketRows();
});

window.setInterval(() => {
  if (!document.hidden) void refreshSheetMarketRows();
}, SHEET_REFRESH_INTERVAL_MS);

let chartResizeFrame = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(chartResizeFrame);
  chartResizeFrame = requestAnimationFrame(() => drawPriceCharts());
});

syncThemeButton();
loadData();
