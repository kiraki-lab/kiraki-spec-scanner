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
        Object.assign(notice, normalizeNoticeDetail(detail));
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
  return {
    id: raw.notice_id || raw.noticeId || raw.id || null,
    title: raw.title || raw.notice_title || raw.noticeTitle || '제목 없음',
    date: raw.date || raw.notice_date || raw.noticeDate || raw.update_date || null,
    url: raw.url || raw.link || null
  };
}

function normalizeNoticeDetail(payload) {
  const detail = payload?.cashshop_notice_detail || payload?.notice_detail || payload?.detail || payload || {};
  return {
    title: detail.title || detail.notice_title,
    date: detail.date || detail.notice_date,
    url: detail.url || detail.link || null,
    summary: stripHtml(detail.contents || detail.content || '').slice(0, 240)
  };
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
