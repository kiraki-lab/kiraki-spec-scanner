const DATA_PATHS = {
  items: './data/items.json',
  auction: './data/auction-prices.json',
  notices: './data/cashshop-notices.json',
  saleItems: './data/cashshop-sale-items.json'
};

const SETTINGS_KEY = 'maple-cash-value-settings-v2';
const LOCAL_DATA_KEY = 'maple-cash-value-local-data-v1';
const FIXED_MILEAGE_MESO_RATE = 10000;
const MESO_INPUT_UNIT = 100000000;
const MESO_PRECISION = 1000000;
const REFERENCE_CATEGORY = '마일리지 구매 참고';
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

async function loadJson(path, fallback) {
  const response = await fetch(`${path}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) return fallback;
  return response.json();
}

async function loadData() {
  loadStoredSettings();
  syncInputs();
  try {
    const [itemsDoc, auctionDoc, noticeDoc, saleDoc] = await Promise.all([
      loadJson(DATA_PATHS.items, { items: [], settings: DEFAULT_SETTINGS }),
      loadJson(DATA_PATHS.auction, { prices: [], skipped: [] }),
      loadJson(DATA_PATHS.notices, { notices: [] }),
      loadJson(DATA_PATHS.saleItems, { sales: [] })
    ]);

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
  } catch (error) {
    console.error(error);
    setSyncState('error', '데이터 로딩 실패', '잠시 후 다시 시도해 주세요.');
  }
  render();
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

function priceFor(target, index) {
  const id = target.id != null ? String(target.id) : null;
  const rowById = id ? index.byId.get(id) : null;
  const names = [target.name, ...(target.aliases || [])].filter(Boolean);
  const rowByName = names.map(name => index.byName.get(normalizeKey(name))).find(Boolean);
  const row = rowById || rowByName;
  const listingMeso = roundMeso(row?.listingLowestMeso);
  const marketHistoryMeso = roundMeso(row?.marketHistoryMaxMeso || row?.marketHistoryMeso);
  const marketHistoryStatus = row?.marketHistoryStatus || '';
  const pendingMarketHistory = isMarketHistoryPending(marketHistoryStatus) && marketHistoryMeso <= 0;
  const candidateMeso = listingMeso > 0 && marketHistoryMeso > 0
    ? Math.min(listingMeso, marketHistoryMeso)
    : listingMeso || marketHistoryMeso;
  const meso = pendingMarketHistory ? 0 : candidateMeso;
  const usesMarketHistory = marketHistoryMeso > 0 && (!listingMeso || marketHistoryMeso < listingMeso);
  const marketGapRate = listingMeso > 0 && marketHistoryMeso > 0 && marketHistoryMeso < listingMeso
    ? (listingMeso - marketHistoryMeso) / listingMeso * 100
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
   …6927 tokens truncated…goryFilter = '';
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
      priceBasis: 'min(listingLowestMeso, marketHistoryMaxMeso)',
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

loadData();
