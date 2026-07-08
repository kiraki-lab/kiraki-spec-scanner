import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_FILE = path.resolve('data/auction-prices.json');
const ITEMS_FILE = path.resolve('data/items.json');
const CONFIG_FILE = path.resolve(process.env.AUCTION_CONFIG || 'auction-config.local.json');
const WORLD = process.env.MAPLE_WORLD || '스카니아';
const MIN_DELAY_MS = Number(process.env.AUCTION_MIN_DELAY_MS || 4500);
const MAX_DELAY_MS = Number(process.env.AUCTION_MAX_DELAY_MS || 9000);
const MAX_ITEMS = Number(process.env.AUCTION_MAX_ITEMS || 999);

const config = await readOptionalJson(CONFIG_FILE);
if (!config?.url || !config?.selectors) {
  await writeJson({
    version: 1,
    world: WORLD,
    generatedAt: new Date().toISOString(),
    source: 'chrome-auction-web',
    status: 'missing-local-config',
    prices: []
  });
  console.log(`Missing ${CONFIG_FILE}. Create it from README instructions before running auction collection.`);
  process.exit(0);
}

const { chromium } = await import('playwright');
const itemsDoc = JSON.parse(await readFile(ITEMS_FILE, 'utf8'));
const targets = flattenTargets(itemsDoc.items).slice(0, MAX_ITEMS);
const userDataDir = path.resolve(process.env.CHROME_USER_DATA_DIR || '.chrome-auction-profile');
const browser = await chromium.launchPersistentContext(userDataDir, {
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: process.env.HEADLESS === '1',
  viewport: { width: 1365, height: 900 }
});

const page = await browser.newPage();
const prices = [];

try {
  await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await humanDelay();

  for (const target of targets) {
    const price = await collectTarget(page, target, config.selectors);
    prices.push(price);
    await humanDelay();
  }
} finally {
  await browser.close();
}

await writeJson({
  version: 1,
  world: WORLD,
  generatedAt: new Date().toISOString(),
  source: 'chrome-auction-web',
  prices
});

async function collectTarget(page, target, selectors) {
  const query = target.name;
  await page.locator(selectors.searchInput).fill('');
  await page.locator(selectors.searchInput).type(query, { delay: 80 + Math.floor(Math.random() * 70) });
  await page.locator(selectors.searchButton).click();
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200 + Math.floor(Math.random() * 1300));

  const blocked = selectors.blockedText
    ? await page.getByText(selectors.blockedText, { exact: false }).count().catch(() => 0)
    : 0;
  if (blocked) throw new Error(`Auction page reported a block while searching ${query}`);

  const listingLowestMeso = await readPrice(page, selectors.listingLowest);

  let marketTabLowestMeso = 0;
  if (selectors.marketTab) {
    await page.locator(selectors.marketTab).click();
    await page.waitForTimeout(1200 + Math.floor(Math.random() * 1300));
    marketTabLowestMeso = await readPrice(page, selectors.marketTabLowest);
  }

  return {
    itemId: target.id,
    itemName: target.name,
    query,
    listingLowestMeso,
    marketTabLowestMeso,
    collectedAt: new Date().toISOString()
  };
}

async function readPrice(page, selector) {
  if (!selector) return 0;
  const text = await page.locator(selector).first().innerText({ timeout: 10000 }).catch(() => '');
  return parseMeso(text);
}

function parseMeso(value) {
  const clean = String(value || '').replace(/[^\d]/g, '');
  return clean ? Number(clean) : 0;
}

function flattenTargets(items) {
  const targets = [];
  for (const item of items || []) {
    if (Array.isArray(item.components) && item.components.length) {
      for (const component of item.components) {
        targets.push({ id: component.id || component.name, name: component.name });
      }
    } else {
      targets.push({ id: item.id, name: item.name });
    }
  }
  const seen = new Set();
  return targets.filter(target => {
    const key = target.name.replace(/\s+/g, '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readOptionalJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

async function writeJson(value) {
  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT_FILE}`);
}

async function humanDelay() {
  const span = Math.max(0, MAX_DELAY_MS - MIN_DELAY_MS);
  await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS + Math.floor(Math.random() * span)));
}
