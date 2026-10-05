/**
 * 메이플크레딧 적립 계산 검사. app.js 의 함수를 그대로 꺼내 손으로 계산한 값과 맞춰 본다.
 * 사용: node scripts/test_credit.js
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(path.dirname(__dirname), 'app.js'), 'utf8');

function grab(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error('app.js 에서 못 찾음: ' + name);
  let depth = 0;
  for (let j = src.indexOf('{', start); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (!depth) return src.slice(start, j + 1); }
  }
}
const consts = src.match(/^const (FIXED_MILEAGE_MESO_RATE|DEFAULT_CREDIT_SHOP) = .*$/gm).join('\n');
const build = (nowIso, prices) => new Function('prices', 'nowMs',
  consts + `
  const realNow = Date.now; Date.now = () => nowMs;
  const state = { settings: { discountRate: 6, ahFeeRate: 5, baseMpRate: 6990 }, creditShop: null, creditRate: { rate: 0, name: '' }, useMileage: true };
  const priceFor = target => prices[target.name] || { meso: 0, source: 'unverified' };
  ` + ['normalizeCreditShop', 'mileageUsable', 'effectiveMileageType', 'creditMesoRate', 'calculateEfficiency'].map(grab).join('\n') + `
  return { state, normalizeCreditShop, creditMesoRate, calculateEfficiency, mileageUsable };`)(prices, new Date(nowIso).getTime());

let failed = 0;
const near = (label, got, want) => {
  const ok = Number.isFinite(want) ? Math.abs(got - want) < 1e-6 * Math.max(1, Math.abs(want)) : got === want;
  if (!ok) { failed++; console.log(`  실패 ${label}: ${got} (기대 ${want})`); }
};

// 1) 효율식
{
  const m = build('2026-10-05T12:00:00+09:00', {});
  m.state.creditShop = m.normalizeCreditShop({});
  m.state.creditRate = { rate: 50000, name: 'x' };
  near('기본은 크레딧을 뺀 값', m.calculateEfficiency({ cashPrice: 10000, mileageType: 'none' }, 5e8), 9400 / (5e8 * .95 / 1e8));
  near('적립 포함', m.calculateEfficiency({ cashPrice: 10000, mileageType: 'none' }, 5e8, true), 9400 / ((5e8 * .95 + 500 * 50000 * .95) / 1e8));
  near('10캐시 미만은 적립 없음', m.calculateEfficiency({ cashPrice: 5 }, 5e8, true), 4.7 / (5e8 * .95 / 1e8));
  near('마일리지 30% (소멸 전)', m.calculateEfficiency({ cashPrice: 10000, mileageType: 'partial' }, 5e8, true),
    (7000 * .94 + 3000 * (10000 * 6990 / 1e8)) / ((5e8 * .95 + 350 * 50000 * .95) / 1e8));
  near('마일리지 전액 (소멸 전)', m.calculateEfficiency({ cashPrice: 10000, mileageType: 'full' }, 5e8), (10000 * (10000 * 6990 / 1e8)) / (5e8 * .95 / 1e8));
  // 남은 마일리지 사용을 끄면(기본) 30%·전액 상품도 넥슨캐시 전액 결제로 본다
  m.state.useMileage = false;
  near('마일리지 꺼짐 30%', m.calculateEfficiency({ cashPrice: 10000, mileageType: 'partial' }, 5e8), 9400 / (5e8 * .95 / 1e8));
  near('마일리지 꺼짐 전액', m.calculateEfficiency({ cashPrice: 10000, mileageType: 'full' }, 5e8, true), 9400 / ((5e8 * .95 + 500 * 50000 * .95) / 1e8));
  m.state.useMileage = true;
  near('메소 값 없음', m.calculateEfficiency({ cashPrice: 10000 }, 0), Infinity);
  m.state.creditRate = { rate: 0, name: '' };
  near('크레딧 가치 모름', m.calculateEfficiency({ cashPrice: 10000 }, 5e8, true), 9400 / (5e8 * .95 / 1e8));
}
// 2) 마일리지가 사라진 뒤에는 30%·전액 결제를 계산하지 않는다
{
  const m = build('2026-11-19T00:00:00+09:00', {});
  m.state.creditShop = m.normalizeCreditShop({});
  m.state.creditRate = { rate: 50000, name: 'x' };
  near('소멸 시각부터 사용 불가', m.mileageUsable(), false);
  near('소멸 뒤 30%', m.calculateEfficiency({ cashPrice: 10000, mileageType: 'partial' }, 5e8, true), 9400 / ((5e8 * .95 + 500 * 50000 * .95) / 1e8));
  const before = build('2026-11-18T23:59:59+09:00', {});
  before.state.creditShop = before.normalizeCreditShop({});
  near('소멸 직전은 사용 가능', before.mileageUsable(), true);
}
// 3) 크레딧 1점의 값: 낡지 않은 최근 체결가로 교차 확인된 상품 중 가장 높은 것.
//    가격 판정은 흉내 내지 않고 app.js 의 priceFor 를 그대로 부른다.
{
  const real = (() => {
    const c = src.match(/^const (FIXED_MILEAGE_MESO_RATE|DEFAULT_CREDIT_SHOP|ISO_MOMENT|EVIDENCE_STALE_DAYS|THIN_LISTING_COUNT|MESO_PRECISION) = .*$/gm).join('\n');
    const fns = ['toNumber', 'roundMeso', 'normalizeKey', 'windowBound', 'isEvidenceStale', 'isMarketHistoryPending',
      'marketHistoryStatusLabel', 'priceFor', 'normalizeCreditShop', 'creditMesoRate'].map(grab).join('\n');
    return new Function('nowMs', c + `
      Date.now = () => nowMs;
      const state = { localDataUpdatedAt: null, metadata: {}, creditShop: null };
      ` + fns + `
      return { state, normalizeCreditShop, creditMesoRate, normalizeKey };`)(new Date('2026-10-05T12:00:00+09:00').getTime());
  })();
  const fresh = '2026-10-04T12:00:00+09:00', old = '2026-09-01T12:00:00+09:00';
  const row = extra => ({ status: 'ok', listingLowestMeso: 5e8, resultCount: 10, updatedAt: fresh,
    marketPriceMeso: 4e8, marketPriceAt: fresh, marketPriceBasis: 'recentSale', marketHistoryStatus: 'verified', ...extra });
  const rateOf = (rows, credits = 10000) => {
    const index = { byId: new Map(), byName: new Map(), skippedById: new Map(), skippedByName: new Map() };
    Object.entries(rows).forEach(([name, r]) => index.byName.set(real.normalizeKey(name), { itemName: name, ...r }));
    real.state.creditShop = real.normalizeCreditShop({ items: Object.keys(rows).map(name => ({ name, credits })).concat([{ name: '원장에 없는 상품', credits: 1 }]) });
    return real.creditMesoRate(index);
  };
  near('교차 확인된 행', rateOf({ A: row() }).rate, 40000);
  near('시세가 낡음(코덱스 1005 v1)', rateOf({ A: row({ marketPriceAt: old }) }).rate, 0);
  near('체결 0건 상태(코덱스 1005 v1)', rateOf({ A: row({ marketHistoryStatus: 'no_sales' }) }).rate, 0);
  near('체결 대기 상태', rateOf({ A: row({ marketHistoryStatus: 'listing_unconfirmed' }) }).rate, 0);
  near('매물이 낡음 — 시세만으로 선다', rateOf({ A: row({ updatedAt: old }) }).rate, 40000);
  near('둘 다 낡음', rateOf({ A: row({ updatedAt: old, marketPriceAt: old }) }).rate, 0);
  near('3개월 최고가뿐', rateOf({ A: row({ marketPriceMeso: 0, marketPriceBasis: '', marketHistoryMaxMeso: 4e8, marketHistoryCollectedAt: fresh }) }).rate, 0);
  near('기준이 legacyMax', rateOf({ A: row({ marketPriceBasis: 'legacyMax' }) }).rate, 0);
  near('손으로 넣은 참고가(코덱스 1005 v5)', rateOf({ A: row({ marketPriceBasis: 'manual', source: 'manual' }) }).rate, 0);
  near('기준이 비어 있음', rateOf({ A: row({ marketPriceBasis: '' }) }).rate, 0);
  near('호가뿐', rateOf({ A: row({ marketPriceMeso: 0, marketPriceAt: null, marketPriceBasis: '' }) }).rate, 0);
  near('저매물 호가뿐', rateOf({ A: row({ marketPriceMeso: 0, marketPriceBasis: '', resultCount: 1 }) }).rate, 0);
  near('미포착', rateOf({ A: row({ status: 'uncaptured' }) }).rate, 0);
  near('매물 없음', rateOf({ A: row({ status: 'no_listing', listingLowestMeso: 0, marketPriceMeso: 0 }) }).rate, 0);
  const best = rateOf({ 싼것: row({ listingLowestMeso: 3e8, marketPriceMeso: 3e8 }), 비싼것: row({ listingLowestMeso: 6e8, marketPriceMeso: 5e8 }), 낡은것: row({ listingLowestMeso: 9e8, marketPriceMeso: 9e8, marketPriceAt: old, updatedAt: old }) });
  near('최고값', best.rate, 50000);
  near('기준 상품', best.name, '비싼것');
  real.state.creditShop = real.normalizeCreditShop(null);
  near('가격표가 비면 0', real.creditMesoRate({ byId: new Map(), byName: new Map(), skippedById: new Map(), skippedByName: new Map() }).rate, 0);
}
// 4) 가격표 파일이 이상해도 기본값으로 선다
{
  const m = build('2026-10-05T12:00:00+09:00', {});
  for (const bad of [null, [], 'x', { earnRate: 'a', minCashPrice: -1, items: 'no' }]) {
    const shop = m.normalizeCreditShop(bad);
    near('기본 적립률', shop.earnRate, .05);
    near('기본 최소 금액', shop.minCashPrice, 10);
    near('빈 가격표', shop.items.length, 0);
  }
  near('적립률 상한', m.normalizeCreditShop({ earnRate: 7 }).earnRate, 1);
}
// 5) 화면에서 손으로 넣은 시세는 원장의 체결가에 가려지지 않는다(코덱스 1005 v4)
{
  const c = src.match(/^const (ISO_MOMENT|EVIDENCE_STALE_DAYS|THIN_LISTING_COUNT|MESO_PRECISION|MESO_INPUT_UNIT) = .*$/gm).join('\n');
  const fns = ['toNumber', 'roundMeso', 'normalizeKey', 'windowBound', 'isEvidenceStale', 'isMarketHistoryPending',
    'marketHistoryStatusLabel', 'priceFor', 'upsertLocalMarketPrice', 'upsertLocalPrice'].map(grab).join('\n');
  const m = new Function('nowMs', c + `
    Date.now = () => nowMs;
    const state = { localDataUpdatedAt: null, metadata: {}, auctionRows: [], localAuctionRows: [] };
    const nowIso = () => new Date(nowMs).toISOString();
    const formatMeso = v => String(v);
    const persistLocalData = () => {};
    const findPriceRow = name => state.localAuctionRows.find(r => normalizeKey(r.itemName) === normalizeKey(name))
      || state.auctionRows.find(r => normalizeKey(r.itemName) === normalizeKey(name));
    ` + fns + `
    const indexOf = () => { const byName = new Map(); for (const r of [...state.auctionRows, ...state.localAuctionRows]) byName.set(normalizeKey(r.itemName), r);
      return { byId: new Map(), byName, skippedById: new Map(), skippedByName: new Map() }; };
    return { state, upsertLocalMarketPrice, upsertLocalPrice, price: name => priceFor({ name }, indexOf()) };`)(new Date('2026-10-05T12:00:00+09:00').getTime());
  const fresh = '2026-10-04T12:00:00+09:00';
  m.state.auctionRows = [{ itemName: 'A', status: 'ok', listingLowestMeso: 5e8, resultCount: 10, updatedAt: fresh,
    marketPriceMeso: 4e8, marketPriceAt: fresh, marketPriceBasis: 'recentSale', marketHistoryStatus: 'verified' }];
  near('원장 값', m.price('A').meso, 4e8);
  m.upsertLocalMarketPrice('A', 2e8);
  near('손으로 넣은 시세가 채택된다', m.price('A').meso, 2e8);
  m.upsertLocalMarketPrice('A', 6e8);
  near('매물보다 높게 넣으면 매물이 상한', m.price('A').meso, 5e8);
  m.upsertLocalMarketPrice('A', 0);
  near('해제하면 원장 값으로', m.price('A').meso, 4e8);
  // 원장의 매물 날짜가 낡았어도 방금 손으로 넣은 매물가는 신선한 값이다(코덱스 1005 v7)
  m.state.localAuctionRows = [];
  m.state.auctionRows = [{ itemName: 'B', status: 'ok', listingLowestMeso: 5e8, resultCount: 10, updatedAt: '2026-09-01T12:00:00+09:00',
    collectedAt: '2026-09-01T12:00:00+09:00', marketPriceMeso: 4e8, marketPriceAt: fresh, marketPriceBasis: 'recentSale', marketHistoryStatus: 'verified' }];
  near('낡은 매물은 빠지고 시세', m.price('B').meso, 4e8);
  m.upsertLocalPrice('B', 2e8, 'live');
  near('손으로 넣은 매물가가 채택된다', m.price('B').meso, 2e8);
}
console.log(failed ? `크레딧 계산 검사 실패 ${failed}건` : '크레딧 계산 검사 통과');
process.exitCode = failed ? 1 : 0;
