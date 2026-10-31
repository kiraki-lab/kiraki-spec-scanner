/**
 * 계산기 화면을 Playwright(Chromium)로 띄워 누르면서 확인한다.
 *
 *   node scripts/test_page.js
 *
 * - python -m http.server 로 maple-cash-value 를 직접 띄우고 끝나면 내린다.
 * - 판매 기간과 낡은 값 판정이 오늘 날짜로 바뀌므로 페이지 시계를 가격 원장의
 *   generatedAt 으로 못박고, 시간대도 KST 로 고정한다. 같은 커밋이면 언제 돌려도 같다.
 * - 구글 시트 시세와 웹 글꼴은 밖에서 바뀌므로 가짜 응답으로 막는다.
 */
const assert = require('assert');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const BASE = path.dirname(__dirname);
const PYTHON = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const auction = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'auction-prices.json'), 'utf8'));
const PINNED_AT = new Date(auction.generatedAt || auction.updatedAt);
assert.ok(!Number.isNaN(PINNED_AT.getTime()), 'auction-prices.json 에 generatedAt 이 없다');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function startServer() {
  const port = await freePort();
  const child = spawn(PYTHON, ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', BASE], { stdio: 'ignore' });
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => child.kill() };
    } catch (_) { /* 아직 안 떴다 */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  child.kill();
  throw new Error('http.server 가 뜨지 않았다');
}

async function openPage(browser, url, viewport, { blockHistory = null } = {}) {
  const context = await browser.newContext({ viewport, locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
  // 시트 시세는 응답 처리기를 바로 불러 '실패'로 끝낸다. 6초 대기도, 값 변동도 없다.
  await context.route(/docs\.google\.com/, route => {
    const handler = new URL(route.request().url()).searchParams.get('tqx')?.split(':')[1] || '';
    route.fulfill({ contentType: 'text/javascript', body: /^[\w$]+$/.test(handler) ? `${handler}({status:'error'});` : '' });
  });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, route => route.fulfill({ contentType: 'text/css', body: '' }));
  // 그래프 파일을 못 읽는 경우: 'abort' = 네트워크 실패, 'broken' = 깨진 내용.
  if (blockHistory === 'abort') await context.route(/price-history\.json/, route => route.abort());
  if (blockHistory === 'broken') await context.route(/price-history\.json/, route => route.fulfill({ contentType: 'application/json', body: '{not json' }));
  const page = await context.newPage();
  const errors = [];
  const historyRequests = [];
  page.on('request', request => { if (request.url().includes('price-history.json')) historyRequests.push(request.url()); });
  page.on('console', message => {
    if (message.type() !== 'error') return;
    // 막은 파일을 브라우저가 '불러오기 실패'로 찍는 것은 페이지 오류가 아니다.
    if (blockHistory && message.location().url.includes('price-history.json')) return;
    errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.setFixedTime(PINNED_AT);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('#rank-rows .list-row');
  return { context, page, errors, historyRequests };
}

async function snapshot(page) {
  const shot = await page.evaluate(() => window.kirakiSnapshot());
  delete shot.takenAt;
  return shot;
}

const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push(`  통과  ${name}`);
  } catch (error) {
    results.push(`  실패  ${name}\n        ${String(error.message).split('\n').join('\n        ')}`);
    process.exitCode = 1;
  }
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    const { context, page, errors } = await openPage(browser, server.url, { width: 1280, height: 900 });
    const initial = await snapshot(page);

    await check('페이지가 콘솔 오류 없이 뜬다', async () => {
      assert.deepStrictEqual(errors, []);
      assert.strictEqual(await page.evaluate(() => Date.now()), PINNED_AT.getTime(), '페이지 시계가 고정되지 않았다');
      assert.ok(initial.rows.length > 0, '순위에 오른 상품이 하나도 없다');
    });

    await check('순위 줄 수가 kirakiSnapshot().rows 와 같다', async () => {
      const more = page.locator('#rank-more');
      if (await more.isVisible()) await more.click();
      const names = await page.locator('#rank-rows .list-row .item-name').allTextContents();
      assert.strictEqual(names.length, initial.rows.length);
      assert.deepStrictEqual(names, initial.rows.map(row => row.name));
    });

    await check('크레딧 토글을 켜고 끄면 스냅숏이 처음과 같아진다', async () => {
      const toggle = page.locator('label.switch', { has: page.locator('#credit-toggle') });
      await toggle.click();
      const on = await snapshot(page);
      assert.strictEqual(on.settings.useCredit, true, '켰는데 useCredit 이 true 가 아니다');
      await toggle.click();
      assert.deepStrictEqual(await snapshot(page), initial);
    });

    await check('판매가를 고치고 되돌리면 스냅숏이 처음과 같아진다', async () => {
      const target = initial.rows.find(row => !row.components && row.adoptedMeso > 0);
      assert.ok(target, '판매가를 고칠 단품이 없다');
      const row = page.locator('#rank-rows .list-row').filter({ has: page.locator('.item-name', { hasText: new RegExp(`^${target.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).first();
      await row.locator('.list-row-main').click();
      const input = row.locator('.sale-editor-input');
      const changed = Math.round(target.adoptedMeso * 2 / 1e6) / 100;
      await input.fill(String(changed));
      await row.locator('.sale-editor-save').click();
      const edited = (await snapshot(page)).rows.find(item => item.name === target.name);
      assert.ok(edited, `${target.name} 이 고친 뒤 스냅숏에서 사라졌다`);
      assert.notStrictEqual(edited.adoptedMeso, target.adoptedMeso, '고친 판매가가 계산에 들어가지 않았다');
      await page.locator(`button[data-sale-price-reset]`).click();
      assert.deepStrictEqual(await snapshot(page), initial);
      await page.locator('#rank-rows .list-row-main[aria-expanded="true"]').click();
    });

    await check('할인 버튼이 계산에 반영된다', async () => {
      const before = initial.settings.discountRate;
      const value = Number(before) === 8.5 ? 0 : 8.5;
      await page.click(`button[data-discount="${value}"]`);
      const after = await snapshot(page);
      assert.strictEqual(Number(after.settings.discountRate), value);
      assert.ok(await page.locator(`button[data-discount="${value}"]`).evaluate(el => el.classList.contains('is-active')), '누른 버튼이 켜진 표시가 아니다');
      // 마일리지를 안 쓰면 1억당 현금은 (1 - 할인율) 에 비례한다.
      const ratio = (1 - value / 100) / (1 - Number(before) / 100);
      const byName = new Map(after.rows.map(row => [row.name, row]));
      for (const row of initial.rows) {
        const next = byName.get(row.name);
        assert.ok(next, `${row.name} 이 할인 뒤 순위에서 사라졌다`);
        assert.ok(Math.abs(next.wonPerEok - row.wonPerEok * ratio) <= 0.15,
          `${row.name}: ${row.wonPerEok} × ${ratio.toFixed(4)} 이 아니라 ${next.wonPerEok}`);
      }
      await page.click('#restore-defaults');
      assert.deepStrictEqual(await snapshot(page), initial);
    });

    await check('누르는 동안에도 콘솔 오류가 없다', async () => assert.deepStrictEqual(errors, []));
    await context.close();

    // 판매가 추이 그래프
    const historyDoc = JSON.parse(fs.readFileSync(path.join(BASE, 'data', 'price-history.json'), 'utf8'));
    const [dKey, , , sKey] = historyDoc.fields;
    const salePoints = name => (historyDoc.items[name] || []).filter(point => point[sKey] > 0);
    const graph = await openPage(browser, server.url, { width: 1280, height: 900 });
    await check('줄을 펼치면 판매가 그래프가 그려진다', async () => {
      const { page: gp } = graph;
      assert.deepStrictEqual(graph.historyRequests, [], '줄을 펼치기 전에 그래프 파일을 불렀다');
      const target = initial.rows.find(row => !row.components && salePoints(row.name).length >= 2);
      assert.ok(target, '그래프를 그릴 상품이 없다');
      const more = gp.locator('#rank-more');
      if (await more.isVisible()) await more.click();
      const row = gp.locator('#rank-rows .list-row').filter({ has: gp.locator('.item-name', { hasText: new RegExp(`^${target.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).first();
      await row.locator('.list-row-main').click();
      await row.locator('.price-chart-plot .pc-line').waitFor({ timeout: 5000 });
      assert.strictEqual(graph.historyRequests.length, 1, '그래프 파일을 한 번만 불러야 한다');
      const points = salePoints(target.name);
      assert.strictEqual(await row.locator('.pc-dot').count(), points.length, '점 수가 파일과 다르다');
      const last = points[points.length - 1][sKey];
      assert.strictEqual((await row.locator('.price-chart-stats .is-now').textContent()).trim(), `${(last / 1e8).toFixed(2)}억`);
      // 점에 올리면 그날 매물·체결이 보인다
      const plot = row.locator('.price-chart-plot');
      await plot.scrollIntoViewIfNeeded();
      const box = await plot.boundingBox();
      await plot.hover({ position: { x: box.width - 60, y: box.height / 2 } });
      const tip = await row.locator('.pc-tip').innerText();
      assert.ok(/판매가/.test(tip) && /매물/.test(tip) && /체결/.test(tip), `안내가 비었다: ${tip}`);
      // 판매가를 고쳐도 그래프는 공용 값 그대로
      await row.locator('.sale-editor-input').fill(String(Math.round(target.adoptedMeso * 3 / 1e6) / 100));
      await row.locator('.sale-editor-save').click();
      const edited = gp.locator('#rank-rows .list-row').filter({ has: gp.locator('.item-name', { hasText: new RegExp(`^${target.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).first();
      assert.strictEqual((await edited.locator('.price-chart-stats .is-now').textContent()).trim(), `${(last / 1e8).toFixed(2)}억`, '고친 값이 그래프에 들어갔다');
      await edited.locator('button[data-sale-price-reset]').click();
      // 패키지는 그래프가 없다
      await gp.click('#tab-waiting');
      const pkg = gp.locator('#package-rows .list-row').first();
      if (await pkg.count()) {
        const name = (await pkg.locator('.item-name').textContent()).trim();
        await pkg.locator('.list-row-main').click();
        const single = initial.rows.find(r => r.name === name);
        if (!single || single.components > 1) assert.strictEqual(await pkg.locator('.price-chart').count(), 0, '패키지에 그래프가 그려졌다');
      }
      assert.deepStrictEqual(await snapshot(gp), initial, '그래프를 그린 뒤 스냅숏이 달라졌다');
      assert.deepStrictEqual(graph.errors, []);
    });
    await graph.context.close();

    for (const mode of ['abort', 'broken']) {
      const blocked = await openPage(browser, server.url, { width: 1280, height: 900 }, { blockHistory: mode });
      await check(`그래프 파일을 못 읽어도(${mode === 'abort' ? '네트워크 실패' : '깨진 내용'}) 계산기가 그대로 동작한다`, async () => {
        const { page: bp } = blocked;
        await bp.locator('#rank-rows .list-row-main').first().click();
        await bp.waitForTimeout(500);
        assert.strictEqual(blocked.historyRequests.length, 1, '그래프 파일을 부르지 않았다');
        assert.strictEqual(await bp.locator('.price-chart').count(), 0, '못 읽었는데 그래프 칸이 있다');
        assert.ok(await bp.locator('#rank-rows .sale-editor').count(), '펼친 줄이 그려지지 않았다');
        assert.deepStrictEqual(await snapshot(bp), initial);
        await bp.click('button[data-discount="8.5"]');
        assert.strictEqual(Number((await snapshot(bp)).settings.discountRate), 8.5, '못 읽은 뒤 계산이 멈췄다');
        assert.deepStrictEqual(blocked.errors, []);
      });
      await blocked.context.close();
    }

    const narrow = await openPage(browser, server.url, { width: 320, height: 800 });
    await check('폭 320 에서 가로 스크롤이 없다', async () => {
      await narrow.page.locator('#rank-rows .list-row-main').first().click();
      for (const tab of ['rank', 'detail', 'waiting']) {
        await narrow.page.click(`#tab-${tab}`);
        const overflow = await narrow.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `${tab} 탭이 ${overflow}px 넘친다`);
      }
      assert.deepStrictEqual(narrow.errors, []);
    });
    await narrow.context.close();
  } finally {
    await browser.close();
    server.stop();
  }
  console.log(`화면 검사 (페이지 시계 ${PINNED_AT.toISOString()}, Asia/Seoul)`);
  console.log(results.join('\n'));
  console.log(process.exitCode ? '화면 검사 실패' : '화면 검사 통과');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
