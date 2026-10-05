/**
 * 수집기의 세대 토큰 검사. 브라우저 없이 run 루프만 돌린다.
 * 사용: node scripts/test_collector.js
 */
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, 'auction_collector.js'), 'utf8');

function boot() {
  const store = {};
  const pending = [];
  const env = {
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
    document: { body: { innerText: '검색 횟수 1 / 100' }, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null },
    location: { pathname: '/buy', search: '' },
    performance: { now: () => Date.now() },
    MessageChannel: class { constructor() { const self = this; this.port1 = {}; this.port2 = { postMessage() { setImmediate(() => self.port1.onmessage && self.port1.onmessage()); } }; } },
  };
  const window = {};
  // search 만 대역으로 바꾼다. 부르면 약속을 쌓아 두고 검사 쪽에서 원하는 때에 돌려준다.
  const patched = src.replace('async function search(name, type) {', 'async function search(name, type) { return __fake(name, type); }\n  async function __realSearch(name, type) {')
    .replace('const COOLDOWN_MS = 7500;', 'const COOLDOWN_MS = 0;');
  new Function('window', 'localStorage', 'document', 'location', 'performance', 'MessageChannel', '__fake', patched)(
    window, env.localStorage, env.document, env.location, env.performance, env.MessageChannel,
    (name, type) => new Promise(resolve => pending.push({ name, resolve: (status, patch) => resolve({ itemName: name, gameName: name, type, status, hdr: { name, count: 1 }, allCategories: true, rows: [], at: new Date().toISOString(), ...patch }) })));
  return { kr: window.__kr, pending, state: () => JSON.parse(store.kr_run || '{"results":[]}') };
}
const tick = () => new Promise(r => setTimeout(r, 20));
let failed = 0;
const check = (label, ok) => { if (!ok) { failed++; console.log('  실패 ' + label); } };

(async () => {
  // 1) 이전 검색 대기 → stop → 새 회차 완료 → 이전 검색 반환. 새 기록이 덮이면 안 된다(코덱스 1005 v3).
  {
    const t = boot();
    t.kr.run([['old', 'listing']]); await tick();
    const oldSearch = t.pending.shift();
    t.kr.stop(); await tick();
    check('멈추면 상태가 cancelled', t.state().state === 'stopped:cancelled');
    t.kr.run([['new', 'listing']], { fresh: true }); await tick();
    t.pending.shift().resolve('searched'); await tick(); await tick();
    check('새 회차 완료', t.state().state === 'done' && t.state().results.map(r => r.itemName).join() === 'new');
    oldSearch.resolve('searched'); await tick(); await tick();
    check('이전 루프가 새 기록을 덮지 않는다', t.state().results.map(r => r.itemName).join() === 'new');
    check('상태도 그대로', t.state().state === 'done');
  }
  // 2) stop 뒤에 돌아온 검색은 기록되지 않고 done 도 찍히지 않는다
  {
    const t = boot();
    t.kr.run([['a', 'listing'], ['b', 'listing']]); await tick();
    const first = t.pending.shift();
    t.kr.stop(); first.resolve('searched'); await tick(); await tick();
    check('멈춘 뒤 결과 없음', t.state().results.length === 0);
    check('멈춘 뒤 done 아님', t.state().state === 'stopped:cancelled');
    check('다음 품목을 검색하지 않는다', t.pending.length === 0);
  }
  // 3) 결과 제목이 다르거나 분류 필터가 걸린 검색은 rejected 로 남고 멈춘다. 다시 부르면 그 품목부터 한다
  for (const [label, patch] of [['제목 불일치', { hdr: { name: '다른 것', count: 3 } }], ['분류 필터', { allCategories: false }], ['제목 없음', { hdr: null }]]) {
    const t = boot();
    t.kr.run([['a', 'listing'], ['b', 'listing']]); await tick();
    t.pending.shift().resolve('searched', patch); await tick(); await tick();
    check(label + ': rejected', t.state().results.map(r => r.status).join() === 'rejected');
    check(label + ': 멈춤', t.state().state === 'stopped:unexpected_result' && t.pending.length === 0);
    t.kr.run([['a', 'listing'], ['b', 'listing']]); await tick();
    check(label + ': 같은 품목부터 다시', t.pending[0] && t.pending[0].name === 'a');
  }
  // 4) 실패로 멈춘 품목은 다시 부르면 그 품목부터 한다. 건너뛰고 done 이 되면 안 된다(코덱스 1005 v5)
  for (const status of ['nav_failed', 'not_triggered', 'error', 'whatever_new']) {
    const t = boot();
    t.kr.run([['a', 'listing'], ['b', 'listing']]); await tick();
    t.pending.shift().resolve('searched'); await tick(); await tick();
    t.pending.shift().resolve(status); await tick(); await tick();
    check(status + ': 멈춤', t.state().state === 'stopped:' + status);
    t.kr.run([['a', 'listing'], ['b', 'listing']]); await tick();
    check(status + ': done 이 아니다', t.state().state === 'running');
    check(status + ': 실패한 품목을 다시 검색', t.pending.length === 1 && t.pending[0].name === 'b');
    t.pending.shift().resolve('searched'); await tick(); await tick();
    check(status + ': 끝나면 done', t.state().state === 'done' && t.state().results.filter(r => r.status === 'searched').length === 2);
  }
  // 자동완성에 없는 이름은 다시 부르지 않는다
  {
    const t = boot();
    t.kr.run([['a', 'listing']]); await tick();
    t.pending.shift().resolve('no_autocomplete'); await tick(); await tick();
    check('자동완성 없음도 done', t.state().state === 'done');
    t.kr.run([['a', 'listing']]); await tick();
    check('다시 검색하지 않는다', t.pending.length === 0);
  }
  console.log(failed ? `수집기 검사 실패 ${failed}건` : '수집기 검사 통과');
  process.exit(failed ? 1 : 0);
})();
