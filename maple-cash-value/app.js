const DATA_PATHS = {
  items: './data/items.json',
  auction: './data/auction-prices.json',
  notices: './data/cashshop-notices.json',
  saleItems: './data/cashshop-sale-items.json'
};

const STORAGE_KEY = 'maple-cash-value-settings-v1';
const FIXED_MILEAGE_MESO_RATE = 10000;
const DEFAULT_SETTINGS = {
  baseMpRate: 6990,
  discountRate: 6,
  ahFeeRate: 5
};

const state = {
  items: [],
  auctionRows: [],
  notices: [],
  saleCatalog: [],
  metadata: {},
  rankMode: 'listingLowestMeso',
  search: '',
  categoryFilter: '',
  saleSearch: '',
  saleGroupFilter: '',
  saleTypeFilter: '',
  saleReviewFilter: 'all',
  settings: { ...DEFAULT_SETTINGS }
};

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
      loadJson(DATA_PATHS.auction, { prices: [] }),
      loadJson(DATA_PATHS.notices, { notices: [] }),
      loadJson(DATA_PATHS.saleItems, { sales: [] })
    ]);
    state.items = Array.isArray(itemsDoc.items) ? itemsDoc.items : [];
    state.metadata.itemsUpdatedAt = itemsDoc.updatedAt;
    state.metadata.auctionUpdatedAt = auctionDoc.generatedAt || auctionDoc.updatedAt;
    state.metadata.saleItemsUpdatedAt = saleDoc.generatedAt;
    state.metadata.world = auctionDoc.world || saleDoc.world || itemsDoc.world || '스카니아';
    state.auctionRows = normalizeAuctionRows(auctionDoc.prices);
    state.notices = normalizeNotices(noticeDoc.notices || noticeDoc.cashshopNotice || []);
    state.saleCatalog = normalizeSaleCatalog(saleDoc.sales || []);
    syncCategoryFilterOptions();
    syncSaleFilterOptions();
    setSyncState('ready', '데이터 로딩 완료', `${state.metadata.world} 기준 데이터를 불러왔습니다.`);
  } catch (error) {
    console.error(error);
    setSyncState('error', '데이터 로딩 실패', error.message || 'JSON 파일을 확인할 수 없습니다.');
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
  if (/투구|햇|크라운|가면|써클릿|아머|슈트|로브|드레스|부츠|슈즈|소드|스태프|보우|표창|너클|도서|폴암|샤이닝로드|듀얼보우건|케인|엑스|윙|스피어|완드|활|석궁|단검|건|갑옷|헤어핀|헤어밴드|바이저|이어피스|크레스트|인시그니아|클로크|멜로디|후디|스카프|마들렌|마카롱|에리|쇼트케이크|렐름|도미넌스|해머|캐논|무기/.test(name)) return '치장';
  return '기타';
}

function flattenSaleSearchItems(catalog = state.saleCatalog) {
  return catalog.flatMap(sale => sale.items.map(item => ({ ...item, saleId: sale.id })));
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
  for (const row of state.auctionRows) {
    if (row.itemId != null) byId.set(String(row.itemId), row);
    const names = [row.itemName, row.name, row.query, ...(row.aliases || [])].filter(Boolean);
    for (const name of names) byName.set(normalizeKey(name), row);
  }
  return { byId, byName };
}

function priceFor(target, mode, index) {
  const id = target.id != null ? String(target.id) : null;
  const rowById = id ? index.byId.get(id) : null;
  const names = [target.name, ...(target.aliases || [])].filter(Boolean);
  const rowByName = names.map(name => index.byName.get(normalizeKey(name))).find(Boolean);
  const row = rowById || rowByName;
  const liveValue = Number(row?.[mode] || 0);
  if (liveValue > 0) {
    return {
      meso: liveValue,
      source: 'live',
      collectedAt: row.collectedAt || row.updatedAt || state.metadata.auctionUpdatedAt
    };
  }
  return {
    meso: Number(target.seedMesoPrice || target.defaultMesoPrice || 0),
    source: 'seed',
    collectedAt: null
  };
}

function totalPriceFor(item, mode, index) {
  if (!Array.isArray(item.components) || !item.components.length) {
    return priceFor(item, mode, index);
  }

  let liveCount = 0;
  let latest = null;
  const meso = item.components.reduce((sum, component) => {
    const price = priceFor(component, mode, index);
    if (price.source === 'live') liveCount += 1;
    if (price.collectedAt && (!latest || new Date(price.collectedAt) > new Date(latest))) latest = price.collectedAt;
    return sum + price.meso;
  }, 0);

  return {
    meso,
    source: liveCount === item.components.length ? 'live' : liveCount > 0 ? 'mixed' : 'seed',
    collectedAt: latest
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
    const listing = totalPriceFor(item, 'listingLowestMeso', index);
    const market = totalPriceFor(item, 'marketTabLowestMeso', index);
    return {
      ...item,
      listingPrice: listing,
      marketPrice: market,
      listingEfficiency: calculateEfficiency(item, listing.meso),
      marketEfficiency: calculateEfficiency(item, market.meso)
    };
  });
}

function filteredRows() {
  const q = normalizeKey(state.search);
  return enrichItems().filter(item => {
    if (state.categoryFilter && item.category !== state.categoryFilter) return false;
    if (!q) return true;
    const componentText = Array.isArray(item.components) ? item.components.map(component => component.name).join(' ') : '';
    return normalizeKey([item.name, item.category, componentText, ...(item.aliases || [])].join(' ')).includes(q);
  });
}

function render() {
  const rankKey = state.rankMode === 'marketTabLowestMeso' ? 'marketEfficiency' : 'listingEfficiency';
  const rows = filteredRows().sort((a, b) => a[rankKey] - b[rankKey]);
  const visibleSaleCatalog = filteredSaleCatalog();
  const visibleSaleCount = flattenSaleSearchItems(visibleSaleCatalog).length;
  const totalSaleCount = flattenSaleSearchItems().length;

  $('#rank-mode-label').textContent = state.rankMode === 'marketTabLowestMeso' ? '시세탭 최저' : '매물 최저가';
  $('#row-count').textContent = `${rows.length}개`;
  $('#sale-item-count').textContent = visibleSaleCount === totalSaleCount ? `${totalSaleCount}개` : `${visibleSaleCount}/${totalSaleCount}개`;
  $('#auction-updated').textContent = formatDate(state.metadata.auctionUpdatedAt);
  $('#best-efficiency').textContent = rows.length ? formatWon(rows[0][rankKey]) : '-';

  renderNotices();
  renderSaleItems(visibleSaleCatalog);
  renderTable(rows);
}

function renderNotices() {
  const list = $('#notice-list');
  if (!state.notices.length) {
    list.innerHTML = '<div class="notice-item"><strong>캐시샵 공지 없음</strong><span>API 갱신 후 표시됩니다.</span></div>';
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
      ? `<details class="sale-item" open>${body}<a class="sale-link" href="${escapeAttribute(sale.url)}" target="_blank" rel="noreferrer">공지 열기</a></details>`
      : `<details class="sale-item" open>${body}</details>`;
  }).join('');
}

function renderTable(rows) {
  const tbody = $('#item-rows');
  if (!rows.length) {
    tbody.innerHTML = $('#empty-template').innerHTML;
    return;
  }
  tbody.innerHTML = rows.map((item, index) => `
    <tr>
      <td><span class="rank">${index + 1}</span></td>
      <td>
        <span class="item-name">${escapeHtml(item.name)}</span>
        <span class="item-meta">마일리지 ${mileageLabel(item.mileageType)} · ${escapeHtml(item.category || '캐시 아이템')}</span>
        ${renderComponents(item)}
      </td>
      <td>${nf.format(Number(item.cashPrice || 0))}원</td>
      <td>${renderPrice(item.listingPrice)}</td>
      <td><span class="eff-value">${formatWon(item.listingEfficiency)}</span><span class="price-meta">1억당 현금</span></td>
      <td>${renderPrice(item.marketPrice)}</td>
      <td><span class="eff-value">${formatWon(item.marketEfficiency)}</span><span class="price-meta">1억당 현금</span></td>
    </tr>
  `).join('');
}

function renderPrice(price) {
  const label = price.source === 'live' ? '수집값' : price.source === 'mixed' ? '일부 수집' : '기본값';
  const klass = price.source === 'seed' ? 'seed' : 'live';
  const date = price.collectedAt ? `<span class="price-meta">${escapeHtml(formatDate(price.collectedAt))}</span>` : '';
  return `<span class="price-value">${formatMeso(price.meso)}</span>${date}<span class="source-pill ${klass}">${label}</span>`;
}

function renderComponents(item) {
  if (!Array.isArray(item.components) || !item.components.length) return '';
  return `
    <details>
      <summary>구성품 ${item.components.length}개</summary>
      <div class="component-list">
        ${item.components.map(component => `<span>${escapeHtml(component.name)}</span>`).join('')}
      </div>
    </details>
  `;
}

function mileageLabel(type) {
  if (type === 'full') return '100%';
  if (type === 'partial') return '30%';
  return '불가';
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

function syncCategoryFilterOptions() {
  const select = $('#category-filter');
  const categories = [...new Set(state.items.map(item => item.category || '캐시 아이템'))]
    .sort((a, b) => a.localeCompare(b, 'ko-KR'));
  select.innerHTML = '<option value="">전체</option>' + categories
    .map(category => `<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`)
    .join('');
  select.value = state.categoryFilter;
}

function syncSaleFilterOptions() {
  const group = $('#sale-group-filter');
  group.innerHTML = '<option value="">전체 판매글</option>' + state.saleCatalog
    .map(sale => `<option value="${escapeAttribute(sale.id)}">${escapeHtml(sale.label)}</option>`)
    .join('');
  group.value = state.saleGroupFilter;
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
  render();
});

$('#category-filter').addEventListener('change', event => {
  state.categoryFilter = event.target.value;
  render();
});

document.querySelectorAll('input[name="rank-mode"]').forEach(input => {
  input.addEventListener('change', event => {
    state.rankMode = event.target.value;
    render();
  });
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

$('#discount-rate').addEventListener('input', event => {
  state.settings.discountRate = Number(event.target.value || 0);
  persistSettings();
  render();
});

$('#ah-fee-rate').addEventListener('change', event => {
  state.settings.ahFeeRate = Number(event.target.value || 5);
  persistSettings();
  render();
});

$('#base-mp-rate').addEventListener('input', event => {
  state.settings.baseMpRate = Number(event.target.value || 0);
  persistSettings();
  render();
});

loadData();
