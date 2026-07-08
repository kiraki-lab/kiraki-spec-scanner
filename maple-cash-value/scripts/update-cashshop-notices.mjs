import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_KEY = process.env.NEXON_OPEN_API_KEY;
const LIMIT = Number(process.env.CASHSHOP_NOTICE_LIMIT || 8);
const OUT_FILE = path.resolve('data/cashshop-notices.json');
const LIST_URL = 'https://open.api.nexon.com/maplestory/v1/notice-cashshop';
const DETAIL_URL = 'https://open.api.nexon.com/maplestory/v1/notice-cashshop/detail';

if (!API_KEY) {
  console.log('NEXON_OPEN_API_KEY is not set. Keeping an empty notice dataset.');
  await writeJson({
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'nexon-open-api',
    endpoint: '/maplestory/v1/notice-cashshop',
    status: 'missing-api-key',
    notices: []
  });
  process.exit(0);
}

try {
  const listPayload = await requestJson(LIST_URL);
  const list = pickNoticeArray(listPayload).slice(0, LIMIT);
  const notices = [];

  for (const raw of list) {
    const notice = normalizeNotice(raw);
    if (notice.id) {
      await sleep(250);
      try {
        const detail = await requestJson(`${DETAIL_URL}?notice_id=${encodeURIComponent(notice.id)}`);
        Object.assign(notice, normalizeNoticeDetail(detail, notice));
      } catch (error) {
        notice.detailError = toPublicError(error);
      }
    }
    notices.push(notice);
  }

  await writeJson({
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'nexon-open-api',
    endpoint: '/maplestory/v1/notice-cashshop',
    status: 'ok',
    notices
  });
} catch (error) {
  const message = toPublicError(error);
  console.warn(`Cashshop notice update failed: ${message}`);
  await writeJson({
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'nexon-open-api',
    endpoint: '/maplestory/v1/notice-cashshop',
    status: 'api-error',
    error: message,
    notices: []
  });
}

async function requestJson(url) {
  const response = await fetch(url, {
    headers: { 'x-nxopen-api-key': API_KEY }
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Nexon API ${response.status}: ${body.slice(0, 300)}`);
  }
  return JSON.parse(body);
}

function pickNoticeArray(payload) {
  for (const key of ['cashshop_notice', 'notice', 'notices', 'list', 'rows']) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload)) return payload;
  return [];
}

function normalizeNotice(raw) {
  const title = raw.title || raw.notice_title || raw.noticeTitle || '제목 없음';
  return {
    id: raw.notice_id || raw.noticeId || raw.id || null,
    title,
    date: raw.date || raw.notice_date || raw.noticeDate || raw.update_date || null,
    url: raw.url || raw.link || null,
    items: extractTitleItems(title)
  };
}

function normalizeNoticeDetail(payload, baseNotice = {}) {
  const detail = payload?.cashshop_notice_detail || payload?.notice_detail || payload?.detail || payload || {};
  const html = detail.contents || detail.content || '';
  const text = stripHtml(html);
  const title = detail.title || detail.notice_title || baseNotice.title;
  const date = detail.date || detail.notice_date || baseNotice.date;
  const url = detail.url || detail.link || baseNotice.url || null;
  const items = uniqueItems([
    ...(baseNotice.items || []),
    ...extractTitleItems(title),
    ...extractAltItems(html),
    ...extractTextItems(text)
  ]);
  const next = {
    summary: text.slice(0, 240),
    items
  };
  if (title) next.title = title;
  if (date) next.date = date;
  if (url) next.url = url;
  return next;
}

function extractTitleItems(title) {
  const text = normalizeSpaces(title);
  if (!text || text === '제목 없음') return [];
  const suffix = text.includes(' - ') ? text.split(' - ').pop() : text.replace(/^\d+월\s*\d+일\s*캐시아이템\s*업데이트\s*-?\s*/u, '');
  return splitProductPhrase(suffix);
}

function extractAltItems(html) {
  const items = [];
  const source = String(html || '');
  const pattern = /<img\b[^>]*\balt=["']([^"']+)["'][^>]*>/giu;
  for (const match of source.matchAll(pattern)) {
    const alt = decodeHtml(match[1]);
    if (!isNoiseText(alt)) items.push(...splitProductPhrase(alt));
  }
  return items;
}

function extractTextItems(text) {
  const items = [];
  const source = normalizeSpaces(text);
  const labelPattern = /(?:아이템명|상품명|판매\s*상품|판매\s*아이템|패키지명|구성품)\s*[:：]\s*([^.!?\n]{2,80})/giu;
  for (const match of source.matchAll(labelPattern)) {
    items.push(...splitProductPhrase(match[1]));
  }

  const keywordPattern = /([가-힣A-Za-z0-9][가-힣A-Za-z0-9\s:+&()·ㆍ.'-]{1,40}(?:쿠폰|패스|PLUS|원더베리|크리스탈|로얄스타일|마스터피스|컬렉션|패키지|상자|교환권))/gu;
  for (const match of source.matchAll(keywordPattern)) {
    items.push(cleanProductName(match[1]));
  }
  return uniqueItems(items).slice(0, 16);
}

function splitProductPhrase(value) {
  const cleaned = cleanProductName(value);
  if (!cleaned) return [];
  if (/컬렉션\s*:/u.test(cleaned)) return [cleaned];
  const parts = cleaned
    .replace(/\s+(?:및|그리고)\s+/gu, ' & ')
    .split(/\s*(?:&|\+|,|·|ㆍ|\/|\|)\s*/u)
    .map(cleanProductName)
    .filter(Boolean);
  if (parts.length > 1 && parts.every(part => [...part].length >= 4)) return parts;
  return [cleaned];
}

function cleanProductName(value) {
  return normalizeSpaces(value)
    .replace(/^[-–—:：\s]+|[-–—:：\s]+$/gu, '')
    .replace(/^(?:수정|NEW|신규)\s+/iu, '')
    .replace(/\s*캐시아이템\s*업데이트\s*/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueItems(items) {
  const seen = new Set();
  const result = [];
  for (const item of items.map(cleanProductName).filter(Boolean)) {
    if (isNoiseText(item)) continue;
    const key = item.replace(/\s+/g, '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function isNoiseText(value) {
  const text = normalizeSpaces(value);
  if (!text || text.length < 2) return true;
  return /^(?:이미지|본문|공지|목록|이전|다음|주소복사|본\s*유저수|판매기간|가격|확률|상세|댓글)$/u.test(text);
}

function stripHtml(value) {
  return normalizeSpaces(decodeHtml(String(value || '')
    .replace(/<\s*br\s*\/?\s*>/giu, '\n')
    .replace(/<\/(?:p|div|li|tr|h\d)>/giu, '\n')
    .replace(/<[^>]*>/g, ' ')));
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function normalizeSpaces(value) {
  return String(value || '').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function toPublicError(error) {
  return String(error?.message || error || 'Unknown error')
    .replaceAll(API_KEY || '', '[redacted]')
    .slice(0, 320);
}

async function writeJson(value) {
  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${OUT_FILE}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
