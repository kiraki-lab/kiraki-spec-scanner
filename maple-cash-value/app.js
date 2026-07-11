const DATA_PATHS = {
  items: './data/items.json',
  auction: './data/auction-prices.json',
  notices: './data/cashshop-notices.json',
  saleItems: './data/cashshop-sale-items.json'
};

const STORAGE_KEY = 'maple-cash-value-settings-v1';
const FIXED_MILEAGE_MESO_RATE = 10000;
const REFERENCE_CATEGORY = '마일리지 구매 참고';
const DEFAULT_SETTINGS = {
  baseMpRate: 6990,
  discountRate: 6,
  ahFeeRate: 5
};

const state = {
  items: [],
  auctionRows: [],
  auctionSkips: [],
  notices: [],
  saleCatalog: [],
  metadata: {},
  search: '',
  hiddenCategories: new Set([REFERENCE_CATEGORY]),
  hiddenAuctionStatuses: new Set(),
  saleSearch: '',
  saleGroupFilter: '',
  saleTypeFilter: '',
  saleReviewFilter: 'all',
  page: 1,
  pageSize: 15,
  settings: { ...DEFAULT_SETTINGS }
};

// BONUS 구성품은 넥슨 공지 기준 교환 불가라 효율 계산에는 넣지 않고, 패키지 확인용으로만 보여준다.
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
  '영웅 팬텀 패키지(여)': ['영웅 팬텀 햇'],
  '모험가 썬콜 패키지(여)': ['모험가 썬콜 머리띠(여)'],
  '모험가 비숍 패키지(남)': ['모험가 비숍 모자'],
  '모험가 비숍 패키지(여)': ['모험가 비숍 모자'],
  '모험가 보우마스터 패키지(남)': ['모험가 보우마스터 귀고리(남)'],
  '모험가 보우마스터 패키지(여)': ['모험가 보우마스터 깃털(여)'],
  '모험가 신궁 패키지(남)': ['모험가 신궁 모자'],
  '모험가 신궁 패키지(여)': ['모험가 신궁 모자'],
  '모험가 패스파인더 패키지': ['모험가 패스파인더 후드'],
  '모험가 나이트로드 패키지(남)': ['모험가 나이트로드 헤어밴드(남)'],
  '모험가 나이트로드 패키지(여)': ['모험가 나이트로드 헤어밴드(여)'],
  '모험가 듀얼블레이드 패키지': ['모험가 듀얼블레이드 헤어밴드'],
  '모험가 섀도어 패키지': ['모험가 섀도어 마스크'],
  '모험가 캐논슈터 패키지(남)': ['모험가 캐논슈터 헤어밴드(남)', '모험가 캐논슈터 귀고리'],
  '모험가 캐논슈터 패키지(여)': ['모험가 캐논슈터 헤어밴드(여)', '모험가 캐논슈터 귀고리'],
  '모험가 캡틴 패키지(남)': ['모험가 캡틴 모자(남)'],
  '모험가 캡틴 패키지(여)': ['모험가 캡틴 모자(여)']
});

const AUCTION_STATUS_OPTIONS = Object.freeze([
  ['live', '가격 있음'],
  ['seed', '기본값'],
  ['no_listing', '매물 없음'],
  ['no_candidate', '정확한 품목 없음'],
  ['unverified', '미확인']
]);

const AUCTION_STATUS_LABELS = Object.freeze(Object.fromEntries(AUCTION_STATUS_OPTIONS));
const $ = selector => document.querySelector(selector);
const nf = new Intl.NumberFormat('ko-KR');
const won = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

function normalizeKey(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
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

function loadStoredSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    state.settings = {
      ...DEFAULT_SETTINGS,
      ...Object.fromEntries(Object.entries(saved).filter(([, value]) => Number.isFinite(Number(value))))
    };
  } catch (_) {
    state.settings = { ...DEFAULT_SETTINGS };
  }
}

function persistSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
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
    state.items = Array.isArray(itemsDoc.items) ? itemsDoc.items : [];
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

function normalizeAuctionRows(rawPrices) {
  if (Array.isArray(rawPrices)) return rawPrices;
  if (rawPrices && typeof rawPrices === 'object') {
    return Object.entries(rawPrices).map(([key, value]) => ({ itemId: key, ...value }));
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
  if (/서약|사인|아메리카노|업무 자료|크리스탈 키|모자|간식|머리띠/.test(name) && /원더베리|루나|펫|쁘띠/.test(text)) return '펫장비';
  if (/사원|치치|카카|랑랑|정령|백야|설아|쁘띠|펫/.test(text)) return '펫';
  if (/투구|햇|모자|크라운|가면|써클릿|머리띠|모노클|아머|슈트|로브|드레스|부츠|슈즈|소드|스태프|보우|표창|너클|도서|폴암|샤이닝로드|듀얼보우건|케인|엑스|윙|골든윙즈|스피어|완드|활|석궁|단검|건|갑옷|방패|이펙트|케이프|핀|깃털|귀고리|후드|마스크|얼굴장식|글러브|데스페라도|건틀렛|리볼버|에너지소드|부름|헤어핀|헤어밴드|바이저|이어피스|크레스트|인시그니아|클로크|멜로디|후디|스카프|마들렌|마카롱|에리|쇼트케이크|렐름|도미넌스|해머|캐논|무기|환영지화|환호지선|청야립|청몽장|청야운율|정몽선율|청야운|청몽운/.test(name)) return '치장';
  return '기타';
}

function flattenSaleSearchItems(catalog = state.saleCatalog) {
  return catalog.flatMap(sale => sale.items.map(item => ({ ...item, saleId: sale.id })));
}

function componentList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(component => (typeof component === 'string' ? { name: component } : component))
    .filter(component => component && component.name);
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

function buildPriceIndex() {
  const byId = new Map();
  const byName = new Map();
  const skippedById = new Map();
  const skippedByName = new Map();

  for (const row of state.auctionRows) {
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
  const liveValue = Number(row?.listingLowestMeso || 0);
  if (liveValue > 0) {
    return {
      meso: liveValue,
      source: 'live',
      auctionStatus: 'live',
      collectedAt: row.collectedAt || row.updatedAt || state.metadata.auctionUpdatedAt
    };
  }

  const skippedById = id ? index.skippedById.get(id) : null;
  const skippedByName = names.map(name => index.skippedByName.get(normalizeKey(name))).find(Boolean);
  const skipped = skippedById || skippedByName;
  const seedMeso = Number(target.seedMesoPrice || target.defaultMesoPrice || 0);
  const auctionStatus = skipped?.status || (seedMeso > 0 ? 'seed' : 'unverified');

  return {
    meso: seedMeso,
    source: seedMeso > 0 ? 'seed' : auctionStatus,
    auctionStatus,
    collectedAt: null
  };
}

function totalPriceFor(item, index) {
  if (!Array.isArray(item.components) || !item.components.length) {
    return priceFor(item, index);
  }

  let liveCount = 0;
  let latest = null;
  const components = item.components.map(component => {
    const price = priceFor(component, index);
    if (price.source === 'live') liveCount += 1;
    if (price.collectedAt && (!latest || new Date(price.collectedAt) > new Date(latest))) latest = price.collectedAt;
    return { component, price };
  });
  const componentPrices = components.map(entry => entry.price);
  const meso = componentPrices.reduce((sum, price) => sum + price.meso, 0);

  return {
    meso,
    source: liveCount === item.components.length ? 'live' : liveCount > 0 ? 'mixed' : 'seed',
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
    if (state.hiddenCategories.has(categoryFor(item))) return false;
    if (!item.referenceOnly && state.hiddenAuctionStatuses.has(item.auctionStatus || 'unverified')) return false;
    if (!q) return true;
    const componentText = Array.isArray(item.components) ? item.components.map(component => component.name).join(' ') : '';
    const bonusText = bonusComponentsFor(item).map(component => component.name).join(' ');
    return normalizeKey([item.name, categoryFor(item), auctionStatusLabel(item.auctionStatus), componentText, bonusText, ...(item.aliases || [])].join(' ')).includes(q);
  });
}

function render() {
  const allRows = enrichItems();
  renderFilterChips(allRows);
  const rows = filteredRows(allRows).sort((a, b) => {
    if (Boolean(a.referenceOnly) !== Boolean(b.referenceOnly)) return a.referenceOnly ? 1 : -1;
    if (a.referenceOnly) return b.referenceMesoPerThousand - a.referenceMesoPerThousand;
    return a.listingEfficiency - b.listingEfficiency;
  });
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
  const saleRankOffset = rows.slice(0, pageStart).filter(item => !item.referenceOnly).length;

  $('#rank-mode-label').textContent = '매물 최저가';
  $('#row-count').textContent = referenceCount ? `${saleRows.length}개 + 참고 ${referenceCount}개` : `${saleRows.length}개`;
  $('#sale-item-count').textContent = visibleSaleCount === totalSaleCount ? `${totalSaleCount}개` : `${visibleSaleCount}/${totalSaleCount}개`;
  $('#auction-updated').textContent = formatDate(state.metadata.auctionUpdatedAt);
  $('#best-efficiency').textContent = saleRows.length ? formatWon(saleRows[0].listingEfficiency) : '-';

  renderNotices();
  renderSaleItems(visibleSaleCatalog);
  renderTable(pageRows, saleRankOffset);
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

function renderTable(rows, saleRankOffset = 0) {
  const tbody = $('#item-rows');
  if (!rows.length) {
    tbody.innerHTML = $('#empty-template').innerHTML;
    return;
  }

  let saleRank = saleRankOffset;
  tbody.innerHTML = rows.map(item => {
    const isReference = Boolean(item.referenceOnly);
    const rankNumber = isReference ? null : ++saleRank;
    const rank = isReference
      ? '<span class="source-pill seed">참고</span>'
      : `<span class="rank">${rankNumber}</span>`;
    const itemMeta = isReference
      ? `<span class="item-meta">마일리지 전용 · 판매 불가 · ${REFERENCE_CATEGORY}</span>`
      : `<span class="item-meta">${escapeHtml(item.category || '캐시 아이템')}</span>${renderMileageBadge(item.mileageType)}`;
    const cost = isReference
      ? `${nf.format(Number(item.mileagePrice || item.cashPrice || 0))} 마일리지`
      : `${nf.format(Number(item.cashPrice || 0))}원`;
    const price = isReference ? renderReferencePrice(item) : renderPrice(item.listingPrice);
    const result = isReference
      ? `<span class="eff-value">${formatReferenceMeso(item.referenceMesoPerThousand)}</span><span class="price-meta">1,000 마일리지당 절약</span>`
      : `<span class="eff-value">${formatWon(item.listingEfficiency)}</span><span class="price-meta">1억당 현금</span>`;
    const rowClass = [
      isReference ? 'reference-row' : '',
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
        <td data-label="매물가/참고가">${price}</td>
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
  const label = price.source === 'live' ? '확인가' : price.source === 'mixed' ? '일부 확인' : auctionStatusLabel(status);
  const klass = price.source === 'live' || price.source === 'mixed' ? 'live' : status;
  const date = price.collectedAt ? `<span class="price-meta">${escapeHtml(formatDate(price.collectedAt))}</span>` : '';
  return `<span class="price-value">${formatMeso(price.meso)}</span>${date}<span class="source-pill ${klass}">${label}</span>`;
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

function renderComponents(item) {
  const tradable = componentList(item.components);
  const bonus = bonusComponentsFor(item);
  if (!tradable.length && !bonus.length) return '';

  const breakdown = new Map(
    (item.listingPrice?.components || []).map(entry => [normalizeKey(entry.component?.name), entry.price])
  );
  const label = bonus.length
    ? `구성품 ${tradable.length + bonus.length}개 · 가격 반영 ${tradable.length} / 계산 제외 ${bonus.length}`
    : `구성품별 가격 ${tradable.length}개`;

  return `
    <details>
      <summary>${escapeHtml(label)}</summary>
      <div class="component-list">
        ${tradable.map(component => `
          <div class="component-row">
            <span class="component-name">${escapeHtml(component.name)}</span>
            ${renderComponentQuote(breakdown.get(normalizeKey(component.name)))}
          </div>
        `).join('')}
        ${bonus.map(component => `
          <div class="component-row bonus">
            <span class="component-name">${escapeHtml(component.name)}</span>
            <span class="component-quote"><strong>계산 제외</strong><em>추가 구성</em></span>
          </div>
        `).join('')}
      </div>
    </details>
  `;
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

function setSyncState(kind, title, detail) {
  const card = $('.sync-card');
  card.classList.remove('ready', 'error');
  if (kind) card.classList.add(kind);
  $('#sync-state').textContent = title;
  $('#sync-detail').textContent = detail;
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

function renderFilterChips(rows) {
  renderCategoryFilterChips(rows);
  renderStatusFilterChips(rows);
}

function renderCategoryFilterChips(rows) {
  const counts = new Map();
  for (const item of rows) {
    const category = categoryFor(item);
    counts.set(category, (counts.get(category) || 0) + 1);
  }
  const categories = [...counts.keys()].sort((a, b) => a.localeCompare(b, 'ko-KR'));
  $('#category-filter-list').innerHTML = categories.map(category => renderFilterChip({
    group: 'category',
    value: category,
    label: category,
    count: counts.get(category),
    checked: !state.hiddenCategories.has(category)
  })).join('');
}

function renderStatusFilterChips(rows) {
  const counts = new Map(AUCTION_STATUS_OPTIONS.map(([status]) => [status, 0]));
  for (const item of rows) {
    if (item.referenceOnly) continue;
    const status = item.auctionStatus || 'unverified';
    counts.set(status, (counts.get(status) || 0) + 1);
  }
  $('#status-filter-list').innerHTML = AUCTION_STATUS_OPTIONS.map(([status, label]) => renderFilterChip({
    group: 'status',
    value: status,
    label,
    count: counts.get(status) || 0,
    checked: !state.hiddenAuctionStatuses.has(status)
  })).join('');
}

function renderFilterChip({ group, value, label, count, checked }) {
  return `
    <label class="filter-chip ${checked ? 'active' : ''}">
      <input type="checkbox" data-filter-group="${escapeAttribute(group)}" value="${escapeAttribute(value)}" ${checked ? 'checked' : ''}>
      <span>${escapeHtml(label)}<em>${nf.format(count)}</em></span>
    </label>
  `;
}

function updateHiddenFilter(set, value, visible) {
  if (visible) set.delete(value);
  else set.add(value);
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

$('#search-input').addEventListener('input', event => {
  state.search = event.target.value;
  state.page = 1;
  render();
});


$('#category-filter-list').addEventListener('change', event => {
  const input = event.target.closest('input[data-filter-group="category"]');
  if (!input) return;
  updateHiddenFilter(state.hiddenCategories, input.value, input.checked);
  state.page = 1;
  render();
});

$('#status-filter-list').addEventListener('change', event => {
  const input = event.target.closest('input[data-filter-group="status"]');
  if (!input) return;
  updateHiddenFilter(state.hiddenAuctionStatuses, input.value, input.checked);
  state.page = 1;
  render();
});

$('#category-filter-reset').addEventListener('click', () => {
  state.hiddenCategories.clear();
  state.page = 1;
  render();
});

$('#status-filter-reset').addEventListener('click', () => {
  state.hiddenAuctionStatuses.clear();
  state.page = 1;
  render();
});
$('#sale-search-input').addEventListener('input', event => {
  state.saleSearch = event.target.value;
  render();
});

$('#sale-group-filter').addEventListener('change', event => {
  state.saleGroupFilter = event.target.value;
  render();
});

$('#sale-type-filter').addEventListener('change', event => {
  state.saleTypeFilter = event.target.value;
  render();
});

$('#sale-review-filter').addEventListener('change', event => {
  state.saleReviewFilter = event.target.value;
  render();
});

const pageSizeControl = $('#page-size');
if (pageSizeControl) {
  pageSizeControl.addEventListener('change', event => {
    state.pageSize = Number(event.target.value);
    updateTablePage(1);
  });
}
const previousPage = $('#page-prev');
if (previousPage) previousPage.addEventListener('click', () => updateTablePage(state.page - 1));
const nextPage = $('#page-next');
if (nextPage) nextPage.addEventListener('click', () => updateTablePage(state.page + 1));

$('#discount-rate').addEventListener('input', event => {
  state.settings.discountRate = Number(event.target.value || 0);
  state.page = 1;
  persistSettings();
  render();
});

$('#ah-fee-rate').addEventListener('change', event => {
  state.settings.ahFeeRate = Number(event.target.value || 5);
  state.page = 1;
  persistSettings();
  render();
});

$('#base-mp-rate').addEventListener('input', event => {
  state.settings.baseMpRate = Number(event.target.value || 0);
  state.page = 1;
  persistSettings();
  render();
});

loadData();
