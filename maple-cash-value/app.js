const DATA_PATHS = {
  items: './data/items.json',
  auction: './data/auction-prices.json',
  notices: './data/cashshop-notices.json',
  saleItems: './data/cashshop-sale-items.json'
};

const SETTINGS_KEY = 'maple-cash-value-settings-v2';
const LOCAL_DATA_KEY = 'maple-cash-value-local-data-v1';
const FIXED_MILEAGE_MESO_RATE = 10000;
const MESO_INPUT_UNIT = 1000000;
const REFERENCE_CATEGORY = '마일리지 구매 참고';
const DEFAULT_SETTINGS = {
  baseMpRate: 6990,
  discountRate: 6,
  ahFeeRate: 5
};

const MODE_PASSWORDS = Object.freeze({
  '0322': 'admin',
  '0722': 'member'
});

const MODE_LABELS = Object.freeze({
  public: '공개 모드',
  member: '멤버십 모드',
  admin: '관리자 모드'
});

const MODE_DETAILS = Object.freeze({
  public: '수동 계산 · 내 브라우저 가격 수정',
  member: '내 가격 저장 · 데이터 연동',
  admin: '항목 수정 · 내 가격 저장 · 데이터 연동'
});

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
  mode: 'public',
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
  pageSize: 15,
  adminItemId: '',
  priceTargetName: '',
  stableRowOrder: [],
  currentRanks: new Map(),
  pendingPreviousRanks: null,
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
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatMeso(value) {
  const meso = Number(value || 0);
  if (!meso) return '-';
  const eok = meso / 100000000;
  return `${eok >= 10 ? eok.toFixed(1) : eok.toFixed(2)}억`;
}

function formatReferenceMeso(value) {
  const meso = Number(value || 0);
  if (!meso) return '-';
  if (meso >= 100000000) return formatMeso(meso);
  if (meso >= 10000) return `${nf.format(Math.round(meso / 10000))}만`;
  return nf.format(Math.round(meso));
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
  return Math.round(meso / MESO_INPUT_UNIT) * MESO_INPUT_UNIT;
}

function mesoToInputUnit(value) {
  return roundMeso(value) / MESO_INPUT_UNIT;
}

function mesoFromInputUnit(value) {
  return roundMeso(toNumber(value, 0) * MESO_INPUT_UNIT);
}

function canEditPrices() {
  return true;
}

function canEditItems() {
  return state.mode === 'admin';
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
  renderMode();
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
  const liveValue = roundMeso(row?.listingLowestMeso);

  if (liveValue > 0) {
    return {
      meso: liveValue,
      source: row.source === 'manual' ? 'manual' : 'live',
      auctionStatus: 'live',
      collectedAt: row.collectedAt || row.updatedAt || state.localDataUpdatedAt || state.metadata.auctionUpdatedAt
    };
  }

  if (row?.status && row.status !== 'ok' && row.status !== 'manual') {
    return {
      meso: 0,
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
  let latest = null;
  const components = tradableComponents.map(component => {
    const price = priceFor(component, index);
    if (price.source === 'live') liveCount += 1;
    if (price.source === 'manual') manualCount += 1;
    if (price.collectedAt && (!latest || new Date(price.collectedAt) > new Date(latest))) latest = price.collectedAt;
    return { component, price };
  });
  const componentPrices = components.map(entry => entry.price);
  const meso = components.reduce((sum, { component, price }) => sum + price.meso * component.quantity, 0);
  const filledCount = liveCount + manualCount;

  return {
    meso,
    source: filledCount === tradableComponents.length ? (manualCount ? 'manual' : 'live') : filledCount > 0 ? 'mixed' : 'seed',
    auctionStatus: summarizeAuctionStatus(componentPrices),
    collectedAt: latest,
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
      listingPrice: listing,
      auctionStatus: listing.auctionStatus || 'unverified',
      listingEfficiency: calculateEfficiency(item, listing.meso)
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
  if (a.referenceOnly) return b.referenceMesoPerThousand - a.referenceMesoPerThousand;
  return a.listingEfficiency - b.listingEfficiency;
}

function createRankMap(rows) {
  const ranks = new Map();
  let rank = 0;
  rows.forEach(item => {
    if (!item.referenceOnly) ranks.set(rowIdentity(item), ++rank);
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
  syncPriceTargetOptions();
  syncAdminItemOptions();

  $('#rank-mode-label').textContent = '매물 최저가';
  $('#row-count').textContent = referenceCount ? `${saleRows.length}개 + 참고 ${referenceCount}개` : `${saleRows.length}개`;
  $('#sale-item-count').textContent = visibleSaleCount === totalSaleCount ? `${totalSaleCount}개` : `${visibleSaleCount}/${totalSaleCount}개`;
  $('#auction-updated').textContent = formatDate(state.localAuctionRows.length ? state.localDataUpdatedAt : state.metadata.auctionUpdatedAt);
  $('#best-efficiency').textContent = rankedVisibleSales.length ? formatWon(rankedVisibleSales[0].listingEfficiency) : '-';
  const localPriceCount = $('#local-price-count');
  if (localPriceCount) localPriceCount.textContent = `${state.localAuctionRows.length}개`;
  $('#item-override-state').textContent = state.hasLocalItems ? '수정 데이터' : '기본 데이터';

  renderMode();
  renderManualResult();
  renderNotices();
  renderSaleItems(visibleSaleCatalog);
  renderTable(pageRows, rankByKey, rankChanges);
  renderPagination(rows.length, pageStart, pageEnd, totalPages);
}

function renderMode() {
  document.body.dataset.mode = state.mode;
  $('#mode-label').textContent = MODE_LABELS[state.mode];
  $('#mode-detail').textContent = MODE_DETAILS[state.mode];
  $('#management-mode').textContent = MODE_LABELS[state.mode];
  $('#manual-save-state').textContent = canEditItems() ? '항목·가격 저장' : '내 가격 저장';
  $('#management-panel').hidden = state.mode === 'public';
  $('#lock-mode').hidden = state.mode === 'public';
  document.querySelectorAll('.member-only').forEach(element => {
    element.hidden = !canEditPrices();
  });
  document.querySelectorAll('.admin-only').forEach(element => {
    element.hidden = !canEditItems();
  });
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
    const rank = isReference
      ? '<span class="source-pill seed">참고</span>'
      : `<span class="rank-cell"><span class="rank">${rankNumber}</span>${rankChange}</span>`;
    const turnoverWarning = !isReference && isPackageItem(item)
      ? '<span class="turnover-pill" title="패키지는 판매까지 시간이 걸릴 수 있습니다.">회전율 주의</span>'
      : '';
    const itemMeta = isReference
      ? `<span class="item-meta">마일리지 전용 · 판매 불가 · ${REFERENCE_CATEGORY}</span>`
      : `<span class="item-meta">${escapeHtml(item.category || '캐시 아이템')}</span>${renderMileageBadge(item.mileageType)}${turnoverWarning}`;
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
      : `<span class="eff-value">${formatWon(item.listingEfficiency)}</span><span class="price-meta">1억당 현금</span>`;
    const rowClass = [
      isReference ? 'reference-row' : '',
      isPackageItem(item) ? 'package-row' : '',
      rankNumber && rankNumber <= 3 ? `top-rank rank-${rankNumber}` : ''
    ].filter(Boolean).join(' ');

    return `
      <tr${rowClass ? ` class="${rowClass}"` : ''}>
        <td data-label="순위">${rank}</td>
        <td data-label="아이템">
          <span class="item-name">${escapeHtml(item.name)}</span>
          ${itemMeta}
          ${renderComponents(item)}
        </td>
        <td data-label="구매 가격"><span class="cash-value">${cost}</span></td>
        <td data-label="매물가/참고가"><div class="price-cell">${price}</div></td>
        <td data-label="판매 효율/절약">${result}</td>
      </tr>
    `;
  }).join('');
}

function renderReferencePrice(item) {
  const date = item.referenceUpdatedAt
    ? `<span class="price-meta">${escapeHtml(formatDate(item.referenceUpdatedAt))}</span>`
    : '';
  return `<span class="price-value">${formatMeso(item.referenceMesoValue)}</span>${date}<span class="source-pill seed">대체 구매가</span>`;
}

function renderPrice(price) {
  const status = price.auctionStatus || 'unverified';
  const label = price.source === 'manual'
    ? '수동입력'
    : price.source === 'live'
      ? '확인가'
      : price.source === 'mixed'
        ? '일부 확인'
        : auctionStatusLabel(status);
  const klass = ['live', 'manual', 'mixed'].includes(price.source) ? price.source : status;
  const date = price.collectedAt ? `<span class="price-meta">${escapeHtml(formatDate(price.collectedAt))}</span>` : '';
  return `<span class="price-value">${formatMeso(price.meso)}</span>${date}<span class="source-pill ${klass}">${label}</span>`;
}

function renderInlinePriceEditor(name, price, compact = false) {
  const meso = roundMeso(price?.meso);
  const inputMeso = mesoToInputUnit(meso);
  const status = price?.auctionStatus || 'unverified';
  const label = price?.source === 'manual'
    ? '수동입력'
    : price?.source === 'live'
      ? '확인가'
      : auctionStatusLabel(status);
  const meta = meso > 0 ? `${formatMeso(meso)} · ${label}` : label;
  const date = price?.collectedAt && !compact ? ` · ${formatDate(price.collectedAt)}` : '';
  return `
    <span class="inline-price-editor${compact ? ' compact' : ''}">
      <span class="inline-price-row">
        <input class="inline-price-input" type="number" min="0" step="1" inputmode="numeric"
          value="${inputMeso || ''}" data-inline-price-name="${escapeAttribute(name)}"
          aria-label="${escapeAttribute(name)} 가격 (백만 메소)">
        <span class="inline-price-unit">백만</span>
        <button class="inline-price-save" type="button"
          data-inline-price-save="${escapeAttribute(name)}">적용</button>
      </span>
      <small class="inline-price-meta">${escapeHtml(meta + date)}</small>
    </span>
  `;
}

function renderComponentQuote(price) {
  if (!price) {
    return '<span class="component-quote"><strong>미확인</strong><em>가격 없음</em></span>';
  }
  const status = price.auctionStatus || 'unverified';
  if (Number(price.meso || 0) <= 0) {
    return `<span class="component-quote"><strong>${escapeHtml(auctionStatusLabel(status))}</strong><em>가격 없음</em></span>`;
  }
  const label = price.source === 'manual'
    ? '수동입력'
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

function renderComponents(item) {
  const tradable = componentList(item.components);
  const bonus = bonusComponentsFor(item);
  if (!tradable.length && !bonus.length) return '';

  const breakdown = new Map(
    (item.listingPrice?.components || []).map(entry => [normalizeKey(entry.component?.name), entry.price])
  );
  const tradableCount = tradable.reduce((sum, component) => sum + component.quantity, 0);
  const bonusCount = bonus.reduce((sum, component) => sum + component.quantity, 0);
  const label = bonus.length
    ? `구성품 ${tradableCount + bonusCount}개 · 가격 반영 ${tradableCount} / 계산 제외 ${bonusCount}`
    : `구성품별 가격 ${tradableCount}개`;

  return `
    <details>
      <summary>${escapeHtml(label)}</summary>
      <div class="component-list">
        ${tradable.map(component => `
          <div class="component-row">
            <span class="component-name">${escapeHtml(componentDisplayName(component))}</span>
            ${renderInlinePriceEditor(component.name, breakdown.get(normalizeKey(component.name)), true)}
          </div>
        `).join('')}
        ${bonus.map(component => `
          <div class="component-row bonus">
            <span class="component-name">${escapeHtml(componentDisplayName(component))}</span>
            <span class="component-quote"><strong>계산 제외</strong><em>추가 구성</em></span>
          </div>
        `).join('')}
      </div>
    </details>
  `;
}

function renderManualResult() {
  const item = readManualDraft();
  const detail = $('#manual-detail');
  if (!item.name && !item.cashPrice && !item.seedMesoPrice) {
    $('#manual-efficiency').textContent = '-';
    detail.textContent = '값을 입력하면 바로 계산됩니다.';
    return;
  }
  const efficiency = calculateEfficiency(item, item.seedMesoPrice);
  $('#manual-efficiency').textContent = formatWon(efficiency);
  const netMeso = item.seedMesoPrice * (1 - Number(state.settings.ahFeeRate || 0) / 100);
  detail.textContent = `${formatMeso(item.seedMesoPrice)} · 수수료 후 ${formatMeso(netMeso)}`;
}

function renderMileageBadge(type) {
  if (type === 'full') return '<span class="mileage-pill full">마일리지로 전액 결제</span>';
  if (type === 'partial') return '<span class="mileage-pill partial">마일리지로 30% 할인</span>';
  return '<span class="mileage-pill none">마일리지 할인 불가</span>';
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
  select.innerHTML = '<option value="">전체 판매 항목</option>' + categories
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

function unlockMode() {
  const input = $('#mode-password');
  const mode = MODE_PASSWORDS[input.value.trim()];
  if (!mode) {
    input.value = '';
    setSyncState('error', '모드 잠금', '비밀번호를 확인해 주세요.');
    return;
  }
  state.mode = mode;
  input.value = '';
  setSyncState('ready', MODE_LABELS[mode], MODE_DETAILS[mode]);
  render();
}

function lockMode() {
  state.mode = 'public';
  setSyncState('ready', '공개 모드', MODE_DETAILS.public);
  render();
}

function readManualDraft() {
  return {
    id: 'manual',
    name: $('#manual-name').value.trim(),
    category: $('#manual-category').value.trim() || '수동 계산',
    cashPrice: toNumber($('#manual-cash-price').value, 0),
    seedMesoPrice: mesoFromInputUnit($('#manual-meso-price').value),
    mileageType: $('#manual-mileage-type').value || 'none'
  };
}

function clearManualDraft() {
  ['#manual-name', '#manual-category', '#manual-cash-price', '#manual-meso-price'].forEach(selector => {
    $(selector).value = '';
  });
  $('#manual-mileage-type').value = 'none';
  renderManualResult();
}

function saveManualPrice() {
  if (!canEditPrices()) return;
  const item = readManualDraft();
  if (!item.name || item.seedMesoPrice <= 0) {
    setSyncState('error', '가격 저장 실패', '아이템명과 경매장 가격을 입력해 주세요.');
    return;
  }
  const existing = state.items.find(row => normalizeKey(row.name) === normalizeKey(item.name));
  if (existing && componentList(existing.components).length) {
    setSyncState('error', '구성품 가격을 수정해 주세요', '패키지 가격은 구성품 합계로 계산됩니다.');
    return;
  }
  state.pendingPreviousRanks = new Map(state.currentRanks);
  upsertLocalPrice(item.name, item.seedMesoPrice, 'live');
  setSyncState('ready', '내 가격 적용', `${item.name} 가격을 이 브라우저 계산에 반영했습니다.`);
  render();
}

function saveManualItem() {
  if (!canEditItems()) return;
  const item = readManualDraft();
  if (!item.name || item.cashPrice <= 0) {
    setSyncState('error', '항목 저장 실패', '아이템명과 캐시 가격을 입력해 주세요.');
    return;
  }
  const key = normalizeKey(item.name);
  const existing = state.items.find(row => normalizeKey(row.name) === key);
  const next = { ...item, id: existing?.id || nextItemId() };
  upsertItem(next);
  if (item.seedMesoPrice > 0) upsertLocalPrice(item.name, item.seedMesoPrice, 'live');
  setSyncState('ready', '항목 저장 완료', `${item.name} 항목을 저장했습니다.`);
  render();
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
  const row = {
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

function saveInlinePrice(name, rawValue) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return;
  const meso = mesoFromInputUnit(rawValue);
  state.pendingPreviousRanks = new Map(state.currentRanks);
  if (meso > 0) {
    upsertLocalPrice(cleanName, meso, 'live');
    setSyncState('ready', '가격 적용', `${cleanName} 가격을 이 브라우저 계산에 반영했습니다.`);
  } else {
    const key = normalizeKey(cleanName);
    state.localAuctionRows = state.localAuctionRows.filter(row => normalizeKey(row.itemName || row.name || row.query) !== key);
    persistLocalData();
    setSyncState('ready', '기본 가격 복원', `${cleanName}의 로컬 가격을 해제했습니다.`);
  }
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
    setSyncState('ready', '내 가격 없음', '삭제할 브라우저 가격이 없습니다.');
    return;
  }
  if (!confirm('이 브라우저에 저장한 가격을 모두 삭제할까요?')) return;
  state.localAuctionRows = [];
  state.priceTargetName = '';
  persistLocalData();
  writePriceEditor('');
  setSyncState('ready', '전체 초기화 완료', '브라우저 가격을 모두 기본값으로 되돌렸습니다.');
  render();
}

function savePriceEditor() {
  if (!canEditPrices()) return;
  const name = $('#price-item-name').value.trim() || state.priceTargetName;
  const status = $('#price-status').value || 'live';
  const meso = toNumber($('#price-meso').value, 0);
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
      priceBasis: 'listingLowestMeso',
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

on('#unlock-mode', 'click', unlockMode);
on('#lock-mode', 'click', lockMode);
on('#mode-password', 'keydown', event => {
  if (event.key === 'Enter') unlockMode();
});

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

on('#major-filter-reset', 'click', () => {
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

['#manual-name', '#manual-category', '#manual-cash-price', '#manual-meso-price', '#manual-mileage-type'].forEach(selector => {
  on(selector, 'input', renderManualResult);
  on(selector, 'change', renderManualResult);
});

on('#item-rows', 'click', event => {
  const button = event.target.closest('button[data-inline-price-save]');
  if (!button) return;
  const editor = button.closest('.inline-price-editor');
  const input = editor?.querySelector('.inline-price-input');
  saveInlinePrice(button.dataset.inlinePriceSave, input?.value);
});

on('#item-rows', 'keydown', event => {
  if (event.key !== 'Enter' || !event.target.matches('.inline-price-input')) return;
  event.preventDefault();
  saveInlinePrice(event.target.dataset.inlinePriceName, event.target.value);
});

on('#calculate-manual', 'click', renderManualResult);
on('#save-manual-price', 'click', saveManualPrice);
on('#save-manual-item', 'click', saveManualItem);
on('#clear-manual', 'click', clearManualDraft);

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
