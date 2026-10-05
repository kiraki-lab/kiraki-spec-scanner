// 경매장(auction.maplestory.nexon.com) 탭에서 실행하는 수집기.
// 로그인·캐릭터 선택은 사람이 한다. 이 스크립트는 검색과 읽기만 하고 구매·판매 버튼은 건드리지 않는다.
//
//   __kr.run([["혈맹의 반지","listing"],["혈맹의 반지","market"], ...])   // 시작 (기다리지 않는다)
//   __kr.status()                                                        // 진행 상황
//   __kr.dump()                                                          // 결과를 <article id="krdump"> 에 찍는다
//   __kr.stop()                                                          // 중단
//
// 겪은 함정이 그대로 들어 있다 (PRICE_VERIFICATION.md 8절).
// - 검색은 자동완성에서 정확일치를 고른 뒤 Enter. 「필터 검색」 버튼은 방어구 필터가 같이 걸려 쿠폰류가 0건이 된다.
// - 원장 이름과 게임 표기는 띄어쓰기가 다르다(슈트(여) ↔ 슈트 (여)). 공백을 빼고 비교한다.
// - 탭이 뒤에 있으면 setTimeout 이 조여진다. MessageChannel 로 기다린다.
// - 결과는 검색마다 localStorage 에 쓴다. 탭이 닫혀도 남는다.
// - 장비와 소비 아이템은 결과 행 모양이 다르다. 칸 위치가 아니라 '메소' 글자 앞의 값을 읽는다.
// - 한도(100회)에 걸리면 멈추지 않고 30초마다 카운터를 본다. 자정에 되감기면 그 품목부터 잇는다(6절).
window.__kr = (() => {
  const KEY = 'kr_run';
  const COOLDOWN_MS = 7500;
  const LIMIT = 100;
  const LIMIT_POLL_MS = 30000;
  const ch = new MessageChannel();
  let waiters = [];
  ch.port1.onmessage = () => {
    const now = performance.now();
    const pending = waiters; waiters = [];
    for (const w of pending) { if (now >= w.t) w.r(); else waiters.push(w); }
    if (waiters.length) ch.port2.postMessage(0);
  };
  const sleep = ms => new Promise(r => { waiters.push({ t: performance.now() + ms, r }); if (waiters.length === 1) ch.port2.postMessage(0); });
  const nk = s => s.replace(/\s/g, '');
  const kstDay = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const meso = s => {
    let t = 0; const m = s.replace(/[,\s]/g, '');
    const a = m.match(/(\d+)조/), b = m.match(/(\d+)억/), c = m.match(/(\d+)만/), d = m.match(/(?:^|[조억만])(\d+)$/);
    if (a) t += +a[1] * 1e12; if (b) t += +b[1] * 1e8; if (c) t += +c[1] * 1e4; if (d) t += +d[1];
    return t;
  };
  const counter = () => { const m = document.body.innerText.match(/검색 횟수\s*(\d+)\s*\/\s*(\d+)/); return m ? +m[1] : null; };
  const character = () => { const m = document.body.innerText.match(/\n\s*([^\n]+?)\s*\n\s*Lv\.\d+/); return m ? m[1].replace(/[▾▼]/g, '').trim() : null; };
  const header = () => {
    const m = document.body.innerText.match(/[“"]\s*([^\n”"]+?)\s*[”"]\s*\n?\s*(?:필터 )?검색 결과\s*([\d,]+)건/);
    return m ? { name: m[1].trim(), count: +m[2].replace(/,/g, '') } : null;
  };
  const sortOf = () => (location.search.match(/sortType=([A-Z_]+)/) || [])[1];
  const rows = n => {
    const label = location.pathname.startsWith('/price') ? '구매검색' : '시세검색';
    return [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === label).slice(0, n).map(b => {
      const p = b.closest('div.isolate').innerText.split(/\n+/).map(x => x.trim()).filter(Boolean);
      const ms = []; p.forEach((x, i) => { if (x === '메소') ms.push(meso(p[i - 1])); });
      const q = p.find(x => /^\d+개$/.test(x));
      return { name: p.find(x => !/^\d+$/.test(x)), qty: q ? parseInt(q) : 1, per: ms[0] || 0, date: p.find(x => /^\d{4}-\d{2}-\d{2}$/.test(x)) || null };
    });
  };
  const fire = (el, types) => { for (const t of types) el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window })); };
  const CLICK = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];

  async function pick(name) {
    const clear = document.querySelector('button[aria-label="검색어 지우기"]'); if (clear) clear.click();
    await sleep(400);
    const cb = document.querySelector('input[role=combobox]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(cb, name);
    cb.focus(); cb.dispatchEvent(new Event('input', { bubbles: true }));
    let opt = null, seen = [];
    for (let i = 0; i < 20 && !opt; i++) {
      await sleep(300);
      const lb = document.getElementById(cb.getAttribute('aria-controls'));
      if (!lb) continue;
      const os = [...lb.querySelectorAll('[role=option]')];
      seen = os.map(o => o.innerText.trim());
      opt = os.find(o => o.innerText.trim() === name) || os.find(o => nk(o.innerText) === nk(name));
    }
    if (!opt) return { ok: false, seen };
    const gameName = opt.innerText.trim();
    opt.click(); await sleep(700);
    return { ok: true, gameName };
  }
  async function goto(type) {
    const path = type === 'market' ? '/price' : '/buy';
    if (location.pathname.startsWith(path)) return true;
    const tab = [...document.querySelectorAll('a,button')].find(e => e.textContent.trim() === (type === 'market' ? '시세' : '구매'));
    if (!tab) return false;
    tab.click();
    for (let i = 0; i < 30 && !location.pathname.startsWith(path); i++) await sleep(300);
    await sleep(1500);
    return location.pathname.startsWith(path);
  }
  async function setSort(text) {
    const box = [...document.querySelectorAll('div[role=combobox]')].find(e => /가격순|시간순|가나다순/.test(e.textContent));
    if (!box) return false;
    fire(box, CLICK); await sleep(800);
    const o = [...document.querySelectorAll('[role=option]')].find(e => e.textContent.trim() === text);
    if (!o) return false;
    fire(o, CLICK); await sleep(2500);
    return true;
  }
  async function search(name, type) {
    if (!await goto(type)) return { itemName: name, type, status: 'nav_failed' };
    const before = counter();
    const pk = await pick(name);
    if (!pk.ok) return { itemName: name, type, status: 'no_autocomplete', seen: pk.seen.slice(0, 5), counter: before, at: new Date().toISOString() };
    const cb = document.querySelector('input[role=combobox]'); cb.focus();
    for (const t of ['keydown', 'keypress', 'keyup']) cb.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
    // 검색이 나갔는지는 카운터로만 판단한다. 같은 품목을 다시 조회하면 주소가 안 바뀔 수 있다.
    let triggered = false;
    for (let i = 0; i < 50 && !triggered; i++) { await sleep(300); const now = counter(); triggered = now !== null && now !== before; }
    await sleep(1800);
    const want = type === 'market' ? 'TRADE_DATE_DESC' : 'PRICE_PER_ITEM_ASC';
    const h = header();
    if (triggered && sortOf() !== want && h && h.count > 0) await setSort(type === 'market' ? '최신 판매 시간순' : '개당 낮은 가격순');
    return {
      itemName: name, gameName: pk.gameName, type, status: triggered ? 'searched' : 'not_triggered',
      counterBefore: before, counter: counter(), hdr: header(), sort: sortOf(),
      allCategories: /itemCategory=ALL_CATEGORIES/.test(location.search),
      rows: rows(3), at: new Date().toISOString(),
    };
  }

  const load = () => JSON.parse(localStorage.getItem(KEY) || '{"results":[]}');
  const save = st => localStorage.setItem(KEY, JSON.stringify(st));
  let gen = 0;
  // 세대 토큰. stop() 이나 새 run() 이 부르면 이전 루프는 더 이상 아무것도 쓰지 않는다.
  // 기다리던 검색이 뒤늦게 돌아와도 새 회차의 기록을 덮지 못한다.
  async function run(queue, { fresh = false } = {}) {
    const my = ++gen;
    const alive = () => my === gen;
    const st = fresh ? { results: [] } : load();
    st.state = 'running'; st.character = character(); st.startedAt = st.startedAt || new Date().toISOString(); save(st);
    const stopWith = why => { if (alive()) { st.state = 'stopped:' + why; save(st); } };
    for (const [name, type] of queue) {
      if (!alive()) return;
      // 끝난 것만 건너뛴다(값을 얻었거나 자동완성에 없는 이름). 그 밖의 실패는 전부 다시 한다.
      if (st.results.some(r => r.itemName === name && r.type === type && ['searched', 'no_autocomplete'].includes(r.status))) continue;
      let r;
      for (;;) {
        try { r = await search(name, type); } catch (e) { r = { itemName: name, type, status: 'error', msg: String(e) }; }
        if (!alive()) return;
        // 눌렀는데 카운터가 안 오르고 한도에 차 있으면 소진이다. 날짜가 넘어갈 때까지 기다렸다가 같은 품목을 다시 한다.
        if (r.status !== 'not_triggered' || counter() < LIMIT) break;
        st.state = 'waiting_reset'; save(st);
        // 화면의 카운터는 검색해야 바뀐다. 날짜(KST)가 넘어간 뒤 같은 품목을 다시 눌러 본다.
        const day = kstDay();
        while (counter() >= LIMIT && kstDay() === day) {
          await sleep(LIMIT_POLL_MS);
          if (!alive()) return;
        }
        await sleep(LIMIT_POLL_MS);
        if (!alive()) return;
        st.state = 'running'; save(st);
      }
      // 결과 제목이 검색한 이름과 다르거나 분류 필터가 걸린 결과는 값으로 치지 않는다.
      // 횟수는 썼으므로 'rejected' 로 남겨 허비한 검색으로 센다(필터가 걸리면 쿠폰류가 0건으로 나온다).
      if (r.status === 'searched' && (!r.hdr || r.hdr.name !== r.gameName || !r.allCategories)) r.status = 'rejected';
      st.results.push(r); save(st);
      if (r.status === 'no_autocomplete') continue;           // 횟수를 쓰지 않았다
      if (r.status === 'rejected') return stopWith('unexpected_result');
      if (r.status !== 'searched') return stopWith(r.status); // 화면이 바뀌었거나 검색이 안 눌렸다
      await sleep(COOLDOWN_MS);
      if (!alive()) return;
    }
    if (!alive()) return;
    st.state = 'done'; st.finishedAt = new Date().toISOString(); save(st);
  }
  // 멈춘 사실은 멈추는 쪽이 적는다. 무효가 된 루프는 쓰지 않는다.
  const stop = () => { gen++; const st = load(); if (st.state === 'running' || st.state === 'waiting_reset') { st.state = 'stopped:cancelled'; save(st); } };
  const status = () => {
    const st = load();
    return JSON.stringify({
      state: st.state, character: st.character, counter: counter(), done: st.results.length,
      searched: st.results.filter(r => r.status === 'searched').length,
      noAutocomplete: st.results.filter(r => r.status === 'no_autocomplete').map(r => r.itemName),
      last: st.results.slice(-1).map(r => [r.itemName, r.type, r.status])[0],
    });
  };
  // 결과를 화면에 찍는다. 도구 출력이 길이에서 잘리므로 get_page_text 로 읽는다.
  const dump = () => {
    const st = load();
    const compact = st.results.map(r => [r.itemName, r.type === 'market' ? 'm' : 'l', r.status,
      r.hdr ? r.hdr.count : null, r.sort || null, r.at || null, r.counterBefore ?? null, r.counter ?? null,
      (r.rows || []).map(x => r.type === 'market' ? [x.per, x.date] : [x.per, x.qty, x.name === r.gameName ? 1 : 0]),
      r.gameName && r.gameName !== r.itemName ? r.gameName : null]);
    let checksum = 0n; const M = 1000000007n;
    for (const r of compact) { checksum = (checksum * 31n + BigInt(r[3] || 0)) % M; for (const x of r[8]) checksum = (checksum * 31n + BigInt(x[0])) % M; }
    let a = document.getElementById('krdump');
    if (!a) { a = document.createElement('article'); a.id = 'krdump'; document.body.prepend(a); }
    a.textContent = 'KRDUMP_START' + JSON.stringify({ character: st.character, state: st.state, checksum: String(checksum), results: compact }) + 'KRDUMP_END';
    return compact.length + ' rows · checksum ' + checksum;
  };
  return { run, status, dump, stop, clear: () => { gen++; localStorage.removeItem(KEY); }, counter, character, search };
})();
'collector ready';
