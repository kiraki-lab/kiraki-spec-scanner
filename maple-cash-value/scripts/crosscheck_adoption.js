/**
 * app.js 의 priceFor 와 price_audit.py 의 grade_row 가 같은 값을 채택하는지
 * 원장 전 행에 대해 대조한다.
 *
 * 두 구현이 조용히 갈라지는 것이 이 저장소의 주된 사고 유형이다(코덱스 판정
 * 2026-09-20 에서 THIN_LISTING / FRESHNESS / PENDING 세 건이 한 번에 나왔다).
 * 사람이 읽어서는 못 잡으므로 기계로 센다.
 *
 * 원장 전 행에 더해 `scripts/adoption-cases.json` 의 합성 사례도 함께 돌린다.
 * 코덱스가 잡은 결함 셋 중 둘은 원장에 없는 조합이었다. 전수 대조만으로는
 * 그 사각을 못 본다.
 *
 * 판매 상태(판매 중·휴지기·판매 종료…)도 상품 전부와 합성 사례로 맞춰 본다.
 * 순위에 올라갈지를 가르는 첫 관문이라, 여기가 갈리면 나머지 대조가 의미 없다.
 *
 * 사용: node scripts/crosscheck_adoption.js [기준일]
 *   기준일을 주면 그 시각(그날 23:59:59 KST)으로 고정한다. 안 주면 지금.
 *   어느 쪽이든 계산기와 감사가 **같은 순간**을 쓰도록 --now 로 못박아 넘긴다.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE = path.dirname(__dirname);
const src = fs.readFileSync(path.join(BASE, 'app.js'), 'utf8');

function grab(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error('app.js 에서 못 찾음: ' + name);
  let depth = 0;
  for (let j = src.indexOf('{', start); j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (!depth) return src.slice(start, j + 1); }
  }
}

const baseDate = process.argv[2];
// 계산기와 감사가 같은 순간을 보게 한다. 기준일이 없으면 지금 이 순간을 못박는다.
// (날짜만 넘기면 감사는 오늘이면 실제 현재 시각을, 계산기는 23:59:59 를 써서 갈라진다.)
const pinnedIso = baseDate ? `${baseDate}T23:59:59+09:00` : new Date().toISOString();
const pinnedMs = new Date(pinnedIso).getTime();
const realNow = Date.now;
Date.now = () => pinnedMs;
// 감사에 넘길 날짜는 KST 기준이어야 한다. toISOString 은 UTC 라 자정 무렵 하루가 어긋난다.
const kstDate = new Date(pinnedMs + 9 * 3600 * 1000).toISOString().slice(0, 10);

const consts = src.match(/^const (EVIDENCE_STALE_DAYS|THIN_LISTING_COUNT|MESO_PRECISION|ISO_MOMENT) = .*$/gm).join('\n');
const fns = ['toNumber', 'roundMeso', 'normalizeKey', 'isEvidenceStale',
             'isMarketHistoryPending', 'marketHistoryStatusLabel', 'priceFor',
             // 순위 제외 판정은 규칙을 베껴 쓰지 말고 앱의 함수를 그대로 부른다.
             // 베껴 쓰면 앱을 고쳐도 검사가 안 걸린다(실제로 한 번 놓쳤다).
             'componentList', 'isSeedOnly', 'hasNoPriceEvidence', 'isThinListingRow',
             'summarizeAuctionStatus', 'auctionStatusLabel', 'totalPriceFor',
             // 판매 상태도 앱의 함수를 그대로 부른다.
             'saleWindows', 'windowBound', 'isWindowObject', 'windowSpan', 'saleStatus', 'isPurchasable']
  .map(grab).join('\n\n');

const roundLikeApp = v => {
  const m = Math.max(0, Number(v) || 0);
  const P = Number(consts.match(/MESO_PRECISION = (\d+)/)[1]);
  return Math.round(m / P) * P;
};

const mod = new Function(
  consts + '\nconst state = { localDataUpdatedAt: null, metadata: {}, collections: {} };\n' +
  fns + '\nreturn { priceFor, normalizeKey, hasNoPriceEvidence, isThinListingRow, totalPriceFor,' +
  ' saleStatus, setCollections(c) { state.collections = c; } };')();

// 계산기의 loadData 와 같은 방식으로 컬렉션을 싣는다.
const collectionsFile = path.join(BASE, 'data/collections.json');
const collectionsDoc = fs.existsSync(collectionsFile)
  ? JSON.parse(fs.readFileSync(collectionsFile, 'utf8')) : { collections: {} };
const loadedCollections = collectionsDoc && collectionsDoc.collections;
const appCollections = loadedCollections && typeof loadedCollections === 'object'
  && !Array.isArray(loadedCollections) ? loadedCollections : {};
mod.setCollections(appCollections);

const pricesDoc = JSON.parse(fs.readFileSync(path.join(BASE, 'data/auction-prices.json'), 'utf8'));

// 합성 사례를 원장 뒤에 붙여 감사를 한 번 더 돌린다. 원본 파일은 건드리지 않는다.
const casesPath = path.join(__dirname, 'adoption-cases.json');
const cases = fs.existsSync(casesPath)
  ? JSON.parse(fs.readFileSync(casesPath, 'utf8')).cases : [];
const why = new Map(cases.map(c => [c.itemName, c.why]));
// 사례는 상품 쪽 필드(seedMesoPrice 등)도 줄 수 있다. 이름만 넘기면 상품 초기값
// 같은 조합을 영영 검사하지 못한다 — 코덱스 v6 이 이 사각을 짚었다.
const itemFields = new Map(cases.map(c => [c.itemName, c.item || null]));
const prices = pricesDoc.prices.concat(
  cases.map(c => Object.assign({ itemName: c.itemName }, c.row)));

// 파일을 쓰지 않는다. 표준 입력으로 넘기고 표준 출력으로 받는다 — 읽기 전용
// 환경(검증자 샌드박스)에서도 그대로 돌아야 대조 결과를 남이 재현할 수 있다.
const PY_ENV = Object.assign({}, process.env, { PYTHONIOENCODING: 'utf-8' });
let audit;
try {
  const outText = execFileSync('python', [path.join(__dirname, 'price_audit.py'), kstDate,
                                          '--now', pinnedIso, '--prices', '-', '--out', '-'],
    { input: JSON.stringify(Object.assign({}, pricesDoc, { prices })), env: PY_ENV,
      stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  audit = JSON.parse(outText);
} catch (e) {
  console.error('price_audit.py 실행 실패:', e.message);
  process.exit(2);
}
const byName = new Map(audit.rows.map(r => [r.itemName, r]));

const idx = { byId: new Map(), byName: new Map(), skippedById: new Map(), skippedByName: new Map() };
// 앱의 정규화를 그대로 쓴다. 직접 만들면 영문 대소문자에서 갈라진다.
const nk = mod.normalizeKey;

let checked = 0;
const valueGap = [], thinGap = [], gradeGap = [], rankGap = [], gapRateGap = [];
for (const row of prices) {
  const g = byName.get(row.itemName);
  if (!g) continue;
  idx.byName.clear();
  idx.byName.set(nk(row.itemName), row);
  const target = Object.assign({ name: row.itemName }, itemFields.get(row.itemName) || {});
  const p = mod.priceFor(target, idx);
  checked++;

  // 계산기는 표시·계산 전에 MESO_PRECISION 으로 반올림한다. 감사는 원값을 들고 있다.
  // 반올림 차이를 채택 규칙의 차이로 세면 안 되므로 같은 자로 맞춘 뒤 비교한다.
  const js = Math.round(p.meso || 0);
  // 감사는 두 값을 들고 있다. 화면과 맞춰야 하는 것은 계산기 채택가 쪽이다.
  const py = roundLikeApp(g.calcAdoptedMeso || 0);

  // 순위에 올릴 수 있는 행인가. seedMesoPrice 는 값이 있어도 근거가 아니다(5절).
  const enriched = Object.assign({}, target, { listingPrice: p, referenceOnly: false });
  const jsRankable = !mod.hasNoPriceEvidence(enriched);
  const pyRankable = py > 0;
  if (jsRankable !== pyRankable) {
    rankGap.push({ name: row.itemName, jsRankable, pyRankable,
                   source: p.source, js, py, grade: g.grade });
  }
  // 초기값은 계산기가 가격 칸에 그대로 보여 주므로 값이 다른 것은 의도된 차이다.
  if (jsRankable && js !== py) {
    valueGap.push({ name: row.itemName, js, py, grade: g.grade, reason: g.reason });
  }

  // 괴리율. 감사는 이 값으로 A·B·C 를 가르고 계산기는 화면에 보여 준다. 분모가 달랐던 적이 있다.
  const jsGap = Number(p.marketGapRate || 0);
  const pyGap = g.gapRate == null ? 0 : Number(g.gapRate);
  if (Math.abs(jsGap - pyGap) > 1e-9) gapRateGap.push({ name: row.itemName, jsGap, pyGap, grade: g.grade });

  const jsThin = Boolean(p.thinListingOnly);
  const pyThin = Boolean(g.thinOnly);
  if (jsThin !== pyThin) thinGap.push({ name: row.itemName, jsThin, pyThin, grade: g.grade });

  // 문서 5절: 저매물 단독 근거는 D 다. 등급과 순위 제외 사유가 어긋나면 안 된다.
  if (pyThin && g.grade !== 'D') {
    gradeGap.push({ name: row.itemName, grade: g.grade, reason: g.reason });
  }
}

const fmt = v => v >= 1e8 ? (v / 1e8).toFixed(2) + '억' : String(v);
console.log(`대조 ${checked}행 (원장 ${pricesDoc.prices.length} + 합성 사례 ${cases.length}) · 기준 ${baseDate || '지금'}`);
console.log(`  채택가 불일치 ${valueGap.length}행`);
for (const d of valueGap.slice(0, 20)) {
  console.log(`    ${d.name.slice(0, 26).padEnd(26)} 계산기 ${fmt(d.js).padStart(8)} · 감사 ${fmt(d.py).padStart(8)}  [${d.grade}] ${d.reason}`);
}
if (valueGap.length > 20) console.log(`    ... ${valueGap.length - 20}행 더`);
console.log(`  저매물 판정 불일치 ${thinGap.length}행`);
for (const d of thinGap.slice(0, 20)) {
  console.log(`    ${d.name.slice(0, 26).padEnd(26)} 계산기 ${d.jsThin} · 감사 ${d.pyThin}  [${d.grade}]`);
}
// --- 패키지 합산 -----------------------------------------------------------
// 지금까지는 단독 행만 봤다. 구성품을 더하는 경로(totalPriceFor)는 검사 밖이었고,
// 실제로 구성품 초기값이 그 문으로 들어왔다(코덱스 v8 PACKAGE_SEED_RANKING_DIVERGENCE).
const casesDoc = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, 'utf8')) : {};
const items = JSON.parse(fs.readFileSync(path.join(BASE, 'data/items.json'), 'utf8')).items
  .concat(casesDoc.packageCases || []);
const fullIdx = { byId: new Map(), byName: new Map(), skippedById: new Map(), skippedByName: new Map() };
for (const row of prices) {
  fullIdx.byName.set(nk(row.itemName), row);
  for (const a of (row.aliases || [])) if (!fullIdx.byName.has(nk(a))) fullIdx.byName.set(nk(a), row);
}
const auditByKey = new Map(audit.rows.map(r => [nk(r.itemName), r]));
const pkgGap = [];
let pkgChecked = 0;
for (const item of items) {
  const comps = item.components || [];
  if (!comps.length || item.referenceOnly) continue;
  pkgChecked++;
  const js = roundLikeApp(mod.totalPriceFor(item, fullIdx).meso);
  // price_audit.approx_ranking 과 같은 식: 구성품의 calcAdoptedMeso x 수량
  const py = roundLikeApp(comps.reduce((sum, c) =>
    sum + ((auditByKey.get(nk(c.name)) || {}).calcAdoptedMeso || 0) * (c.quantity || 1), 0));
  if (js !== py) pkgGap.push({ name: item.name, js, py, comps: comps.length });
}
console.log(`  패키지 합산 불일치 ${pkgGap.length}개 (검사 ${pkgChecked}개)`);
for (const d of pkgGap.slice(0, 20)) {
  console.log(`    ${d.name.slice(0, 30).padEnd(30)} 계산기 ${fmt(d.js).padStart(9)} · 감사 ${fmt(d.py).padStart(9)}  구성품 ${d.comps}개`);
}
// --- 판매 상태 --------------------------------------------------------------
// 상품 전부: 계산기 saleStatus 와 감사 itemStatus 를 같은 순간에서 맞춘다.
const auditStatus = new Map((audit.itemStatus || []).map(r => [r.name, r.status]));
const saleGap = [];
for (const item of JSON.parse(fs.readFileSync(path.join(BASE, 'data/items.json'), 'utf8')).items) {
  const js = mod.saleStatus(item);
  const py = auditStatus.get(item.name);
  if (js !== py) saleGap.push({ name: item.name, js, py });
}
// 합성 사례: 사례마다 자기 시각·자기 컬렉션으로 두 구현을 돌리고, 기대값도 본다.
const saleCases = (casesDoc.saleCases || []);
const saleCaseGap = [], saleExpectGap = [];
if (saleCases.length) {
  let pyOut;
  try {
    pyOut = JSON.parse(execFileSync('python', [path.join(__dirname, 'price_audit.py'),
      '--sale-cases', '-'], { input: JSON.stringify(saleCases), env: PY_ENV }).toString('utf8'));
  } catch (e) {
    console.error('price_audit.py --sale-cases 실패:', e.message);
    process.exit(2);
  }
  const pyByName = new Map(pyOut.map(r => [r.name, r.status]));
  for (const c of saleCases) {
    const at = new Date(c.now).getTime();
    Date.now = () => at;
    mod.setCollections('collections' in c ? c.collections : appCollections);
    let js;
    try { js = mod.saleStatus(c.item); } catch (e) { js = 'THROW:' + e.message; }
    const py = pyByName.get(c.name);
    if (js !== py) saleCaseGap.push({ name: c.name, js, py });
    if (c.expect && js !== c.expect) saleExpectGap.push({ name: c.name, expect: c.expect, got: js });
  }
  Date.now = () => pinnedMs;
  mod.setCollections(appCollections);
}
console.log(`  괴리율 불일치 ${gapRateGap.length}행`);
for (const d of gapRateGap.slice(0, 20)) {
  console.log(`    ${d.name.slice(0, 30).padEnd(30)} 계산기 ${d.jsGap.toFixed(2)}% · 감사 ${d.pyGap.toFixed(2)}%  [${d.grade}]`);
}
console.log(`  판매 상태 불일치 ${saleGap.length}개 (상품 ${auditStatus.size}개)`);
for (const d of saleGap.slice(0, 20)) console.log(`    ${d.name.slice(0, 30).padEnd(30)} 계산기 ${d.js} · 감사 ${d.py}`);
console.log(`  판매 상태 사례 불일치 ${saleCaseGap.length}개 · 기대와 다름 ${saleExpectGap.length}개 (사례 ${saleCases.length}개)`);
for (const d of saleCaseGap) {
  console.log(`    ${d.name.slice(0, 30).padEnd(30)} 계산기 ${d.js} · 감사 ${d.py}`);
  const c = saleCases.find(x => x.name === d.name);
  if (c && c.why) console.log(`        ${c.why}`);
}
for (const d of saleExpectGap) console.log(`    ${d.name.slice(0, 30).padEnd(30)} 기대 ${d.expect} · 실제 ${d.got}`);
console.log(`  순위 가능 여부 불일치 ${rankGap.length}행`);
for (const d of rankGap.slice(0, 20)) {
  console.log(`    ${d.name.slice(0, 30).padEnd(30)} 계산기 ${d.jsRankable}(${d.source}) · 감사 ${d.pyRankable}  [${d.grade}]`);
  if (why.has(d.name)) console.log(`        ${why.get(d.name)}`);
}
console.log(`  저매물인데 등급이 D 가 아닌 행 ${gradeGap.length}행`);
for (const d of gradeGap.slice(0, 20)) {
  console.log(`    ${d.name.slice(0, 30).padEnd(30)} [${d.grade}] ${d.reason}`);
}
process.exitCode = (valueGap.length || thinGap.length || gradeGap.length
                    || rankGap.length || pkgGap.length
                    || saleGap.length || saleCaseGap.length || saleExpectGap.length
                    || gapRateGap.length) ? 1 : 0;
