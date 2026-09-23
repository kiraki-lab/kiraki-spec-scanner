const DATA_PATHS = {
  items: './data/items.json',
  auction: './data/auction-prices.json',
  notices: './data/cashshop-notices.json',
  saleItems: './data/cashshop-sale-items.json',
  collections: './data/collections.json'
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
const FIXED_MILEAGE_MESO_RATE = 10000;
const MESO_INPUT_UNIT = 100000000;
const MESO_PRECISION = 1000000;
const REFERENCE_CATEGORY = '마일리지 구매 참고';
// 이 일수를 넘긴 근거는 판매가 후보에서 뺀다. PRICE_VERIFICATION.md 4절 참고.
const EVIDENCE_STALE_DAYS = 14;
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
  sheetDataUpdatedAt: null,
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
  // 휴지기(다음 판매를 기다리는 컬렉션) 상품도 순위에 넣어 볼지. 기본은 끔.
  includeResting: false,
  saleSearch: '',
  saleGroupFilter: '',
  saleTypeFilter: '',
  saleReviewFilter: 'all',
  page: 1,
  pageSize: 10,
  adminItemId: '',
  priceTargetName: '',
  stableRowOrder: [],
  currentRanks: new Map(),
  pendingPreviousRanks: null,
  expandedComponentKeys: new Set(),
  expandedMarketKeys: new Set(),
  settings: { ...DEFAULT_SETTINGS }
};

const $ = selector => document.querySelector(selector);
const nf = new Intl.NumberFormat('ko-KR');
const won = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

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

function canEditPrices() {
  return true;
}

function canEditItems() {
  return false;
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
    state.sheetDataUpdatedAt = result.rows
      .map(row => row.marketHistoryCollectedAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    setSyncState(
      'ready',
      '데이터 로딩 완료',
      `${state.metadata.world || '스카니아'} 기준 · 시세 보정 ${result.rows.length}개 연결`
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
    const [itemsDoc, auctionDoc, noticeDoc, saleDoc, collectionsDoc] = await Promise.all([
      loadJson(DATA_PATHS.items, { items: [], settings: DEFAULT_SETTINGS }),
      loadJson(DATA_PATHS.auction, { prices: [], skipped: [] }),
      loadJson(DATA_PATHS.notices, { notices: [] }),
      loadJson(DATA_PATHS.saleItems, { sales: [] }),
      loadJson(DATA_PATHS.collections, { collections: {} })
    ]);

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
    setSyncState('ready', '데이터 로딩 완료', `${state.metadata.world} 기준 데이터를 불러왔습니다.`);
    void refreshSheetMarketRows();
  } catch (error) {
    console.error(error);
    setSyncState('error', '데이터 로딩 실패', '잠시 후 다시 시도해 주세요.');
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
    return `<span class="source-pill seed" title="${escapeHtml(last)}주기 판매 컬렉션입니다. 다음 회차가 공지되면 자동으로 순위에 돌아옵니다.">휴지기</span>`;
  }
  if (status === 'upcoming') {
    const next = info.nextStart ? `${formatDate(info.nextStart)} 판매 시작 예정. ` : '';
    return `<span class="source-pill seed" title="${escapeHtml(next)}시작 전이라 아직 살 수 없습니다.">판매 예정</span>`;
  }
  if (status === 'unknown') {
    return '<span class="source-pill seed" title="가리키는 판매 컬렉션을 찾지 못했습니다. collections.json 을 확인해 주세요.">기간 미확인</span>';
  }
  return '<span class="source-pill seed" title="캐시샵 판매 기간이 끝나 구매할 수 없습니다.">판매 종료</span>';
}

function saleMetaText(item, info) {
  const status = item.saleStatus;
  if (status === 'resting') {
    return info.lastEnd ? ` · ${escapeHtml(formatDate(info.lastEnd))} 판매 종료 · 다음 회차 대기` : ' · 다음 회차 대기';
  }
  if (status === 'upcoming') {
    return info.nextStart ? ` · ${escapeHtml(formatDate(info.nextStart))} 판매 시작` : ' · 판매 예정';
  }
  if (status === 'ended' && info.lastEnd) return ` · ${escapeHtml(formatDate(info.lastEnd))} 판매 종료`;
  return '';
}

// 순위에 올릴 수 있는 판매 상태인가. 휴지기는 보기에서 켰을 때만 넣는다.
function isRankableSale(item) {
  if (item.purchasable !== false) return true;
  return state.includeResting && item.saleStatus === 'resting';
}

function loadViewSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEW_KEY) || '{}');
    state.includeResting = saved.includeResting === true;
  } catch (_) {
    state.includeResting = false;
  }
}

function persistViewSettings() {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify({ includeResting: state.includeResting }));
  } catch (_) { /* 저장 못 해도 화면은 그대로 동작한다 */ }
}

function syncRestingToggle(restingCount) {
  const toggle = $('#resting-toggle');
  const status = $('#resting-toggle-state');
  const banner = $('#resting-banner');
  if (toggle) toggle.checked = state.includeResting;
  if (status) status.textContent = state.includeResting ? 'ON' : 'OFF';
  if (banner) {
    banner.hidden = !restingCount;
    const text = $('#resting-banner-text');
    if (text) {
      text.textContent = state.includeResting
        ? `휴지기 상품 ${restingCount}개를 참고 순위에 넣어 보고 있습니다. 지금은 살 수 없습니다.`
        : `휴지기 상품 ${restingCount}개는 순위에서 뺐습니다. 주기 판매 컬렉션이라 다음 회차가 공지되면 돌아옵니다.`;
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
  if (!value) return true;
  const at = new Date(value).getTime();
  if (!Number.isFinite(at)) return true;
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

function calculateEfficiency(item, mesoPrice) {
  let nominalCashPaid = Number(item.cashPrice || 0);
  let mileageUsed = 0;
  let mileageEarned = nominalCashPaid * .05;

  if (item.mileageType === 'partial') {
    nominalCashPaid *= .7;
    mileageUsed = Number(item.cashPrice || 0) * .3;
    mileageEarned = nominalCashPaid * .05;
  } else if (item.mileageType === 'full') {
    nominalCashPaid = 0;
    mileageUsed = Number(item.cashPrice || 0);
    mileageEarned = 0;
  }

  const actualCashCost = nominalCashPaid * (1 - Number(state.settings.discountRate || 0) / 100);
  const mileageCashValue = FIXED_MILEAGE_MESO_RATE * (Number(state.settings.baseMpRate || 0) / 100000000);
  const totalCost = actualCashCost + mileageUsed * mileageCashValue;
  const netMeso = Number(mesoPrice || 0) * (1 - Number(state.settings.ahFeeRate || 0) / 100);
  const totalReturn = netMeso + mileageEarned * FIXED_MILEAGE_MESO_RATE;

  // 메소 값이 없으면 남는 수익은 마일리지 5% 적립뿐이다. 그 숫자는 '가치가 낮다'가
  // 아니라 '아직 모른다'는 뜻이므로 효율로 내보내지 않는다. price_audit.py 의
  // approx_ranking 도 같은 행을 순위에서 뺀다.
  if (!(Number(mesoPrice) > 0)) return Infinity;
  return totalReturn > 0 ? totalCost / (totalReturn / 100000000) : Infinity;
}

function enrichItems() {
  const index = buildPriceIndex();
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
        : calculateEfficiency(item, listing.meso)
    };
  });
}

function filteredRows(sourceRows = enrichItems()) {
  const q = normalizeKey(state.search);
  return sourceRows.filter(item => {
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

function render() {
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
  syncRestingToggle(allRows.filter(item => !item.referenceOnly && item.saleStatus === 'resting').length);
  $('#rank-mode-label').textContent = '시세 우선 적용가';
  $('#row-count').textContent = referenceCount ? `${saleRows.length}개 + 참고 ${referenceCount}개` : `${saleRows.length}개`;
  $('#sale-item-count').textContent = `${rows.length}개`;
  const latestAuctionUpdatedAt = [
    state.metadata.auctionUpdatedAt,
    state.localAuctionRows.length ? state.localDataUpdatedAt : null
  ]
    .filter(Boolean)
    .sort((a, b) => (Date.parse(b) || 0) - (Date.parse(a) || 0))[0] || null;
  $('#auction-updated').textContent = formatDate(latestAuctionUpdatedAt);
  // 요약의 '최고 효율'은 지금 살 수 있는 상품만 본다. 휴지기 참고 순위는 넣지 않는다.
  const bestBuyable = rankedVisibleSales.find(item => item.purchasable !== false
    && !isThinListingRow(item) && !hasNoPriceEvidence(item));
  $('#best-efficiency').textContent = bestBuyable ? formatWon(bestBuyable.listingEfficiency) : '-';
  renderNotices();
  renderSaleItems(visibleSaleCatalog);
  renderTable(pageRows, rankByKey, rankChanges);
  renderPagination(rows.length, pageStart, pageEnd, totalPages);
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
    list.innerHTML = '<div class="notice-item"><strong>캐시샵 업데이트 없음</strong><span>최근 등록된 내역이 없습니다.</span></div>';
    return;
  }
  list.innerHTML = state.notices.map(notice => {
    const title = escapeHtml(notice.title);
    const meta = `<span>${escapeHtml(formatDate(notice.date))}</span>`;
    const tags = renderNoticeItems(notice.items);
    const summary = !tags && notice.summary ? `<p class="notice-summary">${escapeHtml(notice.summary)}</p>` : '';
    const body = `<strong>${title}</strong>${meta}${tags}${summary}`;
    return notice.url
      ? `<a class="notice-item" href="${escapeAttribute(notice.url)}" target="_blank" rel="noreferrer">${body}</a>`
      : `<div class="notice-item">${body}</div>`;
  }).join('');
}

function renderNoticeItems(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return `<div class="notice-tags">${items.map(item => `<span class="notice-tag">${escapeHtml(item)}</span>`).join('')}</div>`;
}

function renderSaleItems(catalog) {
  const list = $('#sale-item-list');
  if (!catalog.length) {
    list.innerHTML = '<div class="sale-item"><strong>검색 결과 없음</strong><span>다른 분류나 검색어를 선택해보세요.</span></div>';
    return;
  }
  list.innerHTML = catalog.map(sale => {
    const chips = sale.items.map(item => (
      `<span class="sale-tag${item.needsReview ? ' review' : ''}" title="${escapeAttribute(item.type)}">${escapeHtml(item.name)}<em>${escapeHtml(item.type)}</em></span>`
    )).join('');
    const reviewCount = sale.items.filter(item => item.needsReview).length;
    const meta = `${sale.items.length}개${reviewCount ? ` · 검수 ${reviewCount}` : ''}`;
    const body = `<summary><strong>${escapeHtml(sale.label)}</strong><span>${escapeHtml(meta)}</span></summary><div class="sale-tags">${chips}</div>`;
    return sale.url
      ? `<details class="sale-item">${body}<a class="sale-link" href="${escapeAttribute(sale.url)}" target="_blank" rel="noreferrer">공지 열기</a></details>`
      : `<details class="sale-item">${body}</details>`;
  }).join('');
}

function renderTable(rows, rankByKey = new Map(), rankChanges = new Map()) {
  const tbody = $('#item-rows');
  if (!rows.length) {
    tbody.innerHTML = $('#empty-template').innerHTML;
    return;
  }

  tbody.innerHTML = rows.map(item => {
    const isReference = Boolean(item.referenceOnly);
    const key = rowIdentity(item);
    const rankNumber = isReference ? null : rankByKey.get(key);
    const rankDelta = rankChanges.get(key) || 0;
    const rankChange = rankDelta > 0
      ? `<small class="rank-change up">↑${rankDelta}</small>`
      : rankDelta < 0
        ? `<small class="rank-change down">↓${Math.abs(rankDelta)}</small>`
        : '';
    const soldOut = !isReference && !isRankableSale(item);
    const restingRanked = !isReference && item.purchasable === false && isRankableSale(item);
    const saleInfo = !isReference ? saleWindowSummary(item) : {};
    const thinRow = !isReference && !soldOut && isThinListingRow(item);
    const noPrice = !isReference && !soldOut && !thinRow && hasNoPriceEvidence(item);
    const rank = isReference
      ? '<span class="source-pill seed">참고</span>'
      : soldOut
        ? salePill(item, saleInfo)
        : thinRow
          ? `<span class="source-pill seed" title="매물 ${item.listingPrice?.listingCount || 0}건이 유일한 근거입니다. 시세 검증 전까지 순위에서 제외합니다.">검증 필요</span>`
          : noPrice
            ? (isSeedOnly(item)
                ? '<span class="source-pill seed" title="경매장에서 확인한 값이 아니라 손으로 적어 둔 초기값입니다. 순위에는 올리지 않습니다.">초기값</span>'
                : '<span class="source-pill seed" title="경매장 매물과 시세가 모두 없어 효율을 계산할 수 없습니다. 다음 회차에 조회합니다.">가격 없음</span>')
            : `<span class="rank-cell"><span class="rank">${rankNumber}</span>${rankChange}${
                restingRanked ? '<small class="rank-tag" title="지금은 살 수 없습니다. 다음 판매 회차 기준의 참고 순위입니다.">휴지기</small>' : ''}</span>`;
    const turnoverWarning = !isReference && isPackageItem(item)
      ? '<span class="turnover-pill" title="패키지는 판매까지 시간이 걸릴 수 있습니다." aria-label="회전율 주의">회전율 주의</span>'
      : '';
    const marketWarning = !isReference && Number(item.listingPrice?.pendingMarketCount || 0) > 0
      ? `<span class="market-warning-pill" title="시세 탭 검증 전 구성품은 보수 합산에서 제외됩니다.">시세 검증 ${item.listingPrice.pendingMarketCount}개</span>`
      : '';
    const thinWarning = !isReference && Number(item.listingPrice?.thinListingCount || 0) > 0
      ? `<span class="market-warning-pill" title="매물 ${THIN_LISTING_COUNT}건 이하가 유일한 근거인 구성품입니다. 호가 하나에 값이 흔들립니다.">저매물 ${item.listingPrice.thinListingCount}개</span>`
      : '';
    const itemMeta = isReference
      ? `<span class="item-meta">마일리지 전용 · 판매 불가 · ${REFERENCE_CATEGORY}</span>`
      : `<span class="item-meta">${escapeHtml(item.category || '캐시 아이템')}${
            isReference ? '' : saleMetaText(item, saleInfo)}</span>
         <span class="item-badges">${renderMileageBadge(item.mileageType)}${turnoverWarning}${marketWarning}${thinWarning}</span>`;
    const cost = isReference
      ? `${nf.format(Number(item.mileagePrice || item.cashPrice || 0))} 마일리지`
      : `${nf.format(Number(item.cashPrice || 0))}원`;
    const price = isReference
      ? renderReferencePrice(item)
      : isPackageItem(item)
        ? renderPrice(item.listingPrice)
        : renderInlinePriceEditor(item.name, item.listingPrice);
    const result = isReference
      ? `<span class="eff-value">${formatReferenceMeso(item.referenceMesoPerThousand)}</span><span class="price-meta">1,000 마일리지당 절약</span>`
      : `<span class="eff-value">${formatWon(item.listingEfficiency)}</span><span class="price-meta">${item.listingPrice?.source === 'pending' ? '검증 합산 기준' : '1억당 현금'}</span>`;
    const rowClass = [
      isReference ? 'reference-row' : '',
      isPackageItem(item) ? 'package-row' : '',
      item.listingPrice?.source === 'pending' ? 'market-pending-row' : '',
      rankNumber && rankNumber <= 3 ? `top-rank rank-${rankNumber}` : ''
    ].filter(Boolean).join(' ');

    const itemRow = `
      <tr${rowClass ? ` class="${rowClass}"` : ''}>
        <td data-label="순위">${rank}</td>
        <td data-label="아이템">
          <span class="item-name">${escapeHtml(item.name)}</span>
          <span class="item-meta-row">${itemMeta}</span>
          ${renderComponentToggle(item, key)}
        </td>
        <td data-label="구매 가격"><span class="cash-value">${cost}</span></td>
        <td data-label="매물가/참고가"><div class="price-cell">${price}</div></td>
        <td data-label="판매 효율/절약">${result}</td>
      </tr>
    `;
    return itemRow + renderComponentDetailRow(item, key);
  }).join('');
}

function renderReferencePrice(item) {
  const date = item.referenceUpdatedAt
    ? `<time class="price-date">${escapeHtml(formatDate(item.referenceUpdatedAt))}</time>`
    : '';
  return `
    <span class="price-display">
      <span class="price-line">
        <span class="price-value">${formatMeso(item.referenceMesoValue)}</span>
        <span class="source-pill seed">대체 구매가</span>
      </span>
      ${date}
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
        ? '검증 필요'
        : price.source === 'live'
          ? '확인가'
          : price.source === 'mixed'
            ? '일부 확인'
            : auctionStatusLabel(status);
  const klass = ['live', 'manual', 'history', 'pending', 'mixed'].includes(price.source) ? price.source : status;
  const date = price.collectedAt
    ? `<time class="price-date">${escapeHtml(formatDate(price.collectedAt))}</time>`
    : '';
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
      ${date}
    </span>
  `;
}

function renderInlinePriceEditor(name, price, compact = false) {
  const appliedMeso = roundMeso(price?.meso);
  const listingMeso = roundMeso(price?.listingMeso || (price?.marketHistoryMeso ? 0 : price?.meso));
  const marketHistoryMeso = roundMeso(price?.marketHistoryMeso);
  const marketHistoryStatus = price?.marketHistoryStatus || '';
  const pendingMarketHistory = price?.source === 'pending';
  const inputMeso = mesoToInputUnit(listingMeso);
  const marketInputMeso = mesoToInputUnit(marketHistoryMeso);
  const status = price?.auctionStatus || 'unverified';
  const label = price?.source === 'manual'
    ? '수동입력'
    : price?.source === 'history' || pendingMarketHistory
      ? '현재 매물'
      : price?.source === 'live'
        ? '확인가'
        : auctionStatusLabel(status);
  const meta = listingMeso > 0 ? `${formatMeso(listingMeso)} · ${label}` : label;
  const date = price?.collectedAt && !compact
    ? `<time class="inline-price-date">${escapeHtml(formatDate(price.collectedAt))}</time>`
    : '';
  const marketKey = normalizeKey(name);
  const marketExpanded = state.expandedMarketKeys.has(marketKey);
  const gap = Number(price?.marketGapRate || 0);
  const marketDate = price?.marketHistoryCollectedAt
    ? `<time>${escapeHtml(formatDate(price.marketHistoryCollectedAt))}</time>`
    : '';
  const marketLabel = String(price?.marketHistoryBasis || '').includes('구글 시트') ? '시트 보정' : '시세 탭';
  const marketMeta = pendingMarketHistory
    ? `<small class="market-reference-meta warning">
        <strong>${escapeHtml(price?.marketHistoryNote || marketHistoryStatusLabel(marketHistoryStatus))}</strong>
        <span>보수 계산 제외</span>
        ${marketDate}
      </small>`
    : marketHistoryMeso > 0
      ? `<small class="market-reference-meta">
          <strong>${marketLabel} ${formatMeso(marketHistoryMeso)}</strong>
          <span>계산 ${formatMeso(appliedMeso)}</span>
          ${gap > 0 ? `<span class="market-gap">괴리 ${Math.round(gap)}%</span>` : ''}
          ${marketDate}
        </small>`
      : '';
  const marketEditor = marketExpanded
    ? `<span class="inline-market-row">
        <span class="inline-market-label">시세</span>
        <input class="inline-market-input" type="number" min="0" step="0.01" inputmode="decimal"
          value="${marketInputMeso || ''}" data-inline-market-name="${escapeAttribute(name)}"
          aria-label="${escapeAttribute(name)} 시세 탭 참고가 (억 메소)">
        <span class="inline-price-unit">억</span>
        <button class="inline-market-save" type="button"
          data-inline-market-save="${escapeAttribute(name)}"
          aria-label="${escapeAttribute(name)} 시세 참고가 적용" title="시세 참고가 적용">&#10003;</button>
      </span>`
    : '';
  return `
    <span class="inline-price-editor${compact ? ' compact' : ''}${marketHistoryMeso > 0 || pendingMarketHistory ? ' has-market' : ''}">
      <span class="inline-price-row">
        <input class="inline-price-input" type="number" min="0" step="0.01" inputmode="decimal"
          value="${inputMeso || ''}" data-inline-price-name="${escapeAttribute(name)}"
          aria-label="${escapeAttribute(name)} 현재 매물가 (억 메소)">
        <span class="inline-price-unit">억</span>
        <button class="inline-market-toggle${marketHistoryMeso > 0 ? ' has-value' : ''}${pendingMarketHistory ? ' has-warning' : ''}" type="button"
          data-inline-market-toggle="${escapeAttribute(name)}" aria-expanded="${marketExpanded}"
          aria-label="${escapeAttribute(name)} 시세 참고가 입력" title="시세 탭 참고가 입력">시세</button>
        <button class="inline-price-save" type="button"
          data-inline-price-save="${escapeAttribute(name)}"
          aria-label="${escapeAttribute(name)} 매물가 적용" title="매물가 적용">&#10003;</button>
      </span>
      <small class="inline-price-meta"><span>${escapeHtml(meta)}</span>${date}</small>
      ${marketMeta}
      ${marketEditor}
    </span>
  `;
}

function renderComponentQuote(price) {
  if (!price) {
    return '<span class="component-quote"><strong>미확인</strong><em>가격 없음</em></span>';
  }
  if (price.source === 'pending') {
    return '<span class="component-quote"><strong>검증 필요</strong><em>보수 계산 제외</em></span>';
  }
  const status = price.auctionStatus || 'unverified';
  if (Number(price.meso || 0) <= 0) {
    return `<span class="component-quote"><strong>${escapeHtml(auctionStatusLabel(status))}</strong><em>가격 없음</em></span>`;
  }
  const isSheetOverride = String(price.marketHistoryBasis || '').includes('구글 시트');
  const label = price.source === 'manual'
    ? '수동입력'
    : price.source === 'history'
      ? isSheetOverride ? '시트 보정' : '시세 반영'
      : price.source === 'live'
        ? '확인가'
        : price.source === 'mixed'
          ? '일부 확인'
          : auctionStatusLabel(status);
  return `<span class="component-quote"><strong>${formatMeso(price.meso)}</strong><em>${escapeHtml(label)}</em></span>`;
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

function renderComponentToggle(item, key) {
  const breakdown = componentBreakdown(item);
  if (!breakdown) return '';
  const expanded = state.expandedComponentKeys.has(key);
  return `
    <button class="component-toggle" type="button"
      data-component-toggle="${escapeAttribute(key)}" aria-expanded="${expanded}">
      <span aria-hidden="true">${expanded ? '▾' : '▸'}</span>
      <span>${escapeHtml(breakdown.label)}</span>
    </button>
  `;
}

function renderComponentDetailRow(item, key) {
  const breakdown = componentBreakdown(item);
  if (!breakdown || !state.expandedComponentKeys.has(key)) return '';

  return `
    <tr class="component-detail-row">
      <td colspan="5">
        <div class="component-detail-shell">
          <div class="component-detail-header">
            <strong>${escapeHtml(item.name)} 구성품</strong>
            <span>${escapeHtml(breakdown.label)}</span>
          </div>
          <div class="component-list">
            ${breakdown.tradable.map(component => `
              <div class="component-row">
                <span class="component-name">${escapeHtml(componentDisplayName(component))}</span>
                ${renderInlinePriceEditor(component.name, breakdown.prices.get(normalizeKey(component.name)), true)}
              </div>
            `).join('')}
            ${breakdown.bonus.map(component => `
              <div class="component-row bonus">
                <span class="component-name">${escapeHtml(componentDisplayName(component))}</span>
                <span class="component-quote"><strong>계산 제외</strong><em>추가 구성</em></span>
              </div>
            `).join('')}
          </div>
        </div>
      </td>
    </tr>
  `;
}

function renderMileageBadge(type) {
  if (type === 'full') return '<span class="mileage-pill full" title="마일리지로 전액 결제">마일리지 100%</span>';
  if (type === 'partial') return '<span class="mileage-pill partial" title="마일리지로 30% 할인">마일리지 30%</span>';
  return '<span class="mileage-pill none" title="마일리지 할인 불가">마일리지 불가</span>';
}

function mileageLabel(type) {
  if (type === 'full') return '마일리지 전액 결제';
  if (type === 'partial') return '마일리지 30% 할인';
  return '마일리지 할인 불가';
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

function allPriceTargets() {
  const targets = new Map();
  const add = value => {
    const name = String(value?.name || '').trim();
    if (!name) return;
    const key = normalizeKey(name);
    if (!targets.has(key)) targets.set(key, name);
  };
  state.items.forEach(item => {
    if (item.referenceOnly) return;
    add(item);
    componentList(item.components).forEach(add);
  });
  return [...targets.values()].sort((a, b) => a.localeCompare(b, 'ko-KR'));
}

function syncPriceTargetOptions() {
  const select = $('#price-target-select');
  if (!select) return;
  const current = state.priceTargetName;
  select.innerHTML = '<option value="">직접 입력</option>' + allPriceTargets()
    .map(name => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`)
    .join('');
  select.value = current;
}

function syncAdminItemOptions() {
  const select = $('#admin-item-select');
  if (!select) return;
  const current = state.adminItemId;
  select.innerHTML = '<option value="">새 항목</option>' + state.items
    .map(item => `<option value="${escapeAttribute(item.id)}">${escapeHtml(item.name)}</option>`)
    .join('');
  select.value = current;
}

function setSyncState(kind, title, detail) {
  const card = $('.sync-card');
  card.classList.remove('ready', 'error');
  if (kind) card.classList.add(kind);
  $('#sync-state').textContent = title;
  $('#sync-detail').textContent = detail;
}

function nextItemId() {
  const maxId = state.items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  return maxId + 1;
}

function upsertItem(item) {
  const id = String(item.id);
  const index = state.items.findIndex(row => String(row.id) === id);
  const normalized = normalizeItemList([item])[0];
  if (index >= 0) state.items.splice(index, 1, normalized);
  else state.items.push(normalized);
  state.hasLocalItems = true;
  persistLocalData();
}

function deleteSelectedItem() {
  if (!canEditItems() || !state.adminItemId) return;
  const item = state.items.find(row => String(row.id) === String(state.adminItemId));
  if (!item || !confirm(`${item.name} 항목을 삭제할까요?`)) return;
  state.items = state.items.filter(row => String(row.id) !== String(state.adminItemId));
  state.adminItemId = '';
  state.hasLocalItems = true;
  persistLocalData();
  writeItemEditor(null);
  render();
}

function resetAdminItems() {
  if (!canEditItems() || !confirm('항목 수정 데이터를 기본값으로 되돌릴까요?')) return;
  state.items = [...state.baseItems];
  state.hasLocalItems = false;
  state.adminItemId = '';
  persistLocalData();
  writeItemEditor(null);
  render();
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
    collectedAt: nowIso()
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

function saveInlinePrice(name, rawValue) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return;
  const meso = mesoFromInputUnit(rawValue);
  state.pendingPreviousRanks = new Map(state.currentRanks);
  if (meso > 0) {
    upsertLocalPrice(cleanName, meso, 'live');
    setSyncState('ready', '매물가 적용', `${cleanName} 가격을 이 브라우저 계산에 반영했습니다.`);
  } else {
    const key = normalizeKey(cleanName);
    state.localAuctionRows = state.localAuctionRows.filter(row => normalizeKey(row.itemName || row.name || row.query) !== key);
    persistLocalData();
    setSyncState('ready', '기본 가격 복원', `${cleanName}의 로컬 가격을 해제했습니다.`);
  }
  render();
}

function saveInlineMarketPrice(name, rawValue) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return;
  const meso = mesoFromInputUnit(rawValue);
  state.pendingPreviousRanks = new Map(state.currentRanks);
  upsertLocalMarketPrice(cleanName, meso);
  state.expandedMarketKeys.delete(normalizeKey(cleanName));
  setSyncState(
    'ready',
    meso > 0 ? '시세 참고가 적용' : '시세 참고가 해제',
    meso > 0
      ? `${cleanName} 시세를 보수 계산에 반영했습니다.`
      : `${cleanName}의 브라우저 시세 참고값을 해제했습니다.`
  );
  render();
}

function clearLocalPrice() {
  if (!canEditPrices()) return;
  const name = $('#price-item-name').value.trim() || state.priceTargetName;
  const key = normalizeKey(name);
  if (!key) return;
  state.localAuctionRows = state.localAuctionRows.filter(row => normalizeKey(row.itemName || row.name || row.query) !== key);
  persistLocalData();
  writePriceEditor(name);
  setSyncState('ready', '내 가격 삭제', `${name}의 브라우저 가격을 삭제했습니다.`);
  render();
}

function clearAllLocalPrices() {
  if (!state.localAuctionRows.length) {
    setSyncState('ready', '로컬 수정 없음', '초기화할 매물가나 시세 참고가가 없습니다.');
    return;
  }
  if (!confirm('이 브라우저에서 수정한 매물가와 시세 참고가를 모두 삭제하고 공용 기본값으로 되돌릴까요?')) return;
  state.pendingPreviousRanks = new Map(state.currentRanks);
  state.localAuctionRows = [];
  state.priceTargetName = '';
  state.expandedMarketKeys.clear();
  persistLocalData();
  setSyncState('ready', '전체 초기화 완료', '로컬 매물가와 시세 참고가를 공용 기본값으로 되돌렸습니다.');
  render();
}

function savePriceEditor() {
  if (!canEditPrices()) return;
  const name = $('#price-item-name').value.trim() || state.priceTargetName;
  const status = $('#price-status').value || 'live';
  const meso = mesoFromInputUnit($('#price-meso').value);
  if (!name) {
    setSyncState('error', '가격 저장 실패', '품목명을 입력해 주세요.');
    return;
  }
  if ((status === 'live' || status === 'seed') && meso <= 0) {
    setSyncState('error', '가격 저장 실패', '가격을 입력해 주세요.');
    return;
  }
  upsertLocalPrice(name, meso, status);
  setSyncState('ready', '내 가격 적용', `${name} 가격을 이 브라우저 계산에 반영했습니다.`);
  render();
}

function findPriceRow(name) {
  const key = normalizeKey(name);
  return state.localAuctionRows.find(row => normalizeKey(row.itemName || row.name || row.query) === key)
    || state.auctionRows.find(row => normalizeKey(row.itemName || row.name || row.query) === key)
    || state.auctionSkips.find(row => normalizeKey(row.itemName || row.name || row.query) === key)
    || null;
}

function writePriceEditor(name) {
  const row = findPriceRow(name);
  $('#price-item-name').value = name || '';
  $('#price-meso').value = mesoToInputUnit(row?.listingLowestMeso) || '';
  $('#price-status').value = row?.listingLowestMeso > 0 ? 'live' : row?.status || 'live';
}

function writeItemEditor(item) {
  $('#admin-item-name').value = item?.name || '';
  $('#admin-item-category').value = item?.category || '';
  $('#admin-item-cash').value = item?.cashPrice || '';
  $('#admin-item-seed').value = mesoToInputUnit(item?.seedMesoPrice) || '';
  $('#admin-item-mileage').value = item?.mileageType || 'none';
  $('#admin-item-aliases').value = Array.isArray(item?.aliases) ? item.aliases.join('\n') : '';
  $('#admin-item-components').value = componentList(item?.components).map(component => {
    const fields = [component.name];
    if (component.seedMesoPrice || component.quantity > 1) fields.push(mesoToInputUnit(component.seedMesoPrice) || 0);
    if (component.quantity > 1) fields.push(component.quantity);
    return fields.join(' | ');
  }).join('\n');
}

function readItemEditor() {
  const selected = state.items.find(item => String(item.id) === String(state.adminItemId));
  return {
    ...(selected || {}),
    id: selected?.id || nextItemId(),
    name: $('#admin-item-name').value.trim(),
    category: $('#admin-item-category').value.trim() || '캐시 아이템',
    cashPrice: toNumber($('#admin-item-cash').value, 0),
    seedMesoPrice: mesoFromInputUnit($('#admin-item-seed').value),
    mileageType: $('#admin-item-mileage').value || 'none',
    aliases: parseAliasText($('#admin-item-aliases').value),
    components: parseComponentsText($('#admin-item-components').value)
  };
}

function parseAliasText(text) {
  return String(text || '').split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
}

function parseComponentsText(text) {
  return String(text || '').split(/\n+/).map(line => line.trim()).filter(Boolean).map(line => {
    const [name, price, rawQuantity] = line.split('|').map(value => value.trim());
    const component = { name };
    const seedMesoPrice = mesoFromInputUnit(price);
    const quantity = Math.max(1, Math.floor(toNumber(rawQuantity, 1)));
    if (seedMesoPrice > 0) component.seedMesoPrice = seedMesoPrice;
    if (quantity > 1) component.quantity = quantity;
    return component;
  }).filter(component => component.name);
}

function saveAdminItem() {
  if (!canEditItems()) return;
  const item = readItemEditor();
  if (!item.name || item.cashPrice <= 0) {
    setSyncState('error', '항목 저장 실패', '아이템명과 캐시 가격을 입력해 주세요.');
    return;
  }
  upsertItem(item);
  state.adminItemId = String(item.id);
  setSyncState('ready', '항목 저장 완료', `${item.name} 항목을 저장했습니다.`);
  render();
}

function exportItems() {
  const doc = {
    version: 3,
    world: state.metadata.world || '스카니아',
    updatedAt: nowIso(),
    settings: {
      ...state.settings,
      mileageMesoRate: FIXED_MILEAGE_MESO_RATE
    },
    items: state.items
  };
  downloadJson('items.local.json', doc);
}

function exportPrices() {
  const doc = {
    version: 2,
    world: state.metadata.world || '스카니아',
    generatedAt: nowIso(),
    source: 'manual-browser-overrides',
    policy: {
      priceBasis: 'marketHistoryMaxMeso || listingLowestMeso',
      marketHistorySupported: true,
      manualEditable: true
    },
    prices: mergedAuctionRows(),
    skipped: state.auctionSkips
  };
  downloadJson('auction-prices.local.json', doc);
}

function importItems() {
  if (!canEditItems()) return;
  const doc = parseImportJson();
  const items = Array.isArray(doc) ? doc : doc.items;
  if (!Array.isArray(items)) {
    setImportState('항목 배열 없음');
    return;
  }
  state.items = normalizeItemList(items);
  state.hasLocalItems = true;
  persistLocalData();
  state.adminItemId = '';
  writeItemEditor(null);
  setImportState(`${state.items.length}개 항목 반영`);
  render();
}

function importPrices() {
  if (!canEditPrices()) return;
  const doc = parseImportJson();
  const prices = Array.isArray(doc) ? doc : doc.prices || doc.auctionPrices;
  if (!Array.isArray(prices)) {
    setImportState('가격 배열 없음');
    return;
  }
  state.localAuctionRows = normalizeAuctionRows(prices);
  persistLocalData();
  setImportState(`${state.localAuctionRows.length}개 가격 반영`);
  render();
}

function parseImportJson() {
  try {
    return JSON.parse($('#data-import').value || '{}');
  } catch (_) {
    setImportState('데이터 형식 오류');
    return {};
  }
}

function setImportState(text) {
  $('#import-state').textContent = text;
}

function downloadJson(filename, doc) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

on('#item-rows', 'click', event => {
  const toggle = event.target.closest('button[data-component-toggle]');
  if (toggle) {
    const key = toggle.dataset.componentToggle;
    if (state.expandedComponentKeys.has(key)) state.expandedComponentKeys.delete(key);
    else state.expandedComponentKeys.add(key);
    render();
    return;
  }

  const marketToggle = event.target.closest('button[data-inline-market-toggle]');
  if (marketToggle) {
    const key = normalizeKey(marketToggle.dataset.inlineMarketToggle);
    if (state.expandedMarketKeys.has(key)) state.expandedMarketKeys.delete(key);
    else state.expandedMarketKeys.add(key);
    render();
    return;
  }

  const marketButton = event.target.closest('button[data-inline-market-save]');
  if (marketButton) {
    const editor = marketButton.closest('.inline-price-editor');
    const input = editor?.querySelector('.inline-market-input');
    saveInlineMarketPrice(marketButton.dataset.inlineMarketSave, input?.value);
    return;
  }

  const button = event.target.closest('button[data-inline-price-save]');
  if (!button) return;
  const editor = button.closest('.inline-price-editor');
  const input = editor?.querySelector('.inline-price-input');
  saveInlinePrice(button.dataset.inlinePriceSave, input?.value);
});

on('#item-rows', 'input', event => {
  if (!event.target.matches('.inline-price-input, .inline-market-input')) return;
  event.target.closest('.inline-price-editor')?.classList.add('is-dirty');
});

on('#item-rows', 'keydown', event => {
  if (event.key !== 'Enter') return;
  if (event.target.matches('.inline-price-input')) {
    event.preventDefault();
    saveInlinePrice(event.target.dataset.inlinePriceName, event.target.value);
  }
  if (event.target.matches('.inline-market-input')) {
    event.preventDefault();
    saveInlineMarketPrice(event.target.dataset.inlineMarketName, event.target.value);
  }
});

on('#price-target-select', 'change', event => {
  state.priceTargetName = event.target.value;
  writePriceEditor(state.priceTargetName);
});

on('#save-price-row', 'click', savePriceEditor);
on('#clear-price-row', 'click', clearLocalPrice);
on('#reset-local-prices', 'click', clearAllLocalPrices);
on('#export-prices', 'click', exportPrices);

on('#admin-item-select', 'change', event => {
  state.adminItemId = event.target.value;
  const item = state.items.find(row => String(row.id) === String(state.adminItemId));
  writeItemEditor(item || null);
});

on('#save-admin-item', 'click', saveAdminItem);
on('#delete-admin-item', 'click', deleteSelectedItem);
on('#reset-admin-items', 'click', resetAdminItems);
on('#export-items', 'click', exportItems);
on('#import-prices', 'click', importPrices);
on('#import-items', 'click', importItems);
on('#clear-import', 'click', () => {
  $('#data-import').value = '';
  setImportState('대기');
});

window.addEventListener('focus', () => {
  void refreshSheetMarketRows();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void refreshSheetMarketRows();
});

window.setInterval(() => {
  if (!document.hidden) void refreshSheetMarketRows();
}, SHEET_REFRESH_INTERVAL_MS);

loadData();
