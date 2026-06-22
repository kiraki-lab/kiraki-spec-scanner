(() => {
  'use strict';

  if (window.__kirakiEventCoinWeekPresetsLoaded) return;
  window.__kirakiEventCoinWeekPresetsLoaded = true;

  const WEEKLY_COINS = 4000;
  const TOTAL_WEEKS = 12;
  const nf = typeof number !== 'undefined' ? number : new Intl.NumberFormat('ko-KR');

  function installStyles() {
    if (document.querySelector('#kirakiEventCoinWeekPresetStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiEventCoinWeekPresetStyles';
    style.textContent = `
.event-week-preset-card{padding:15px;border:1px solid color-mix(in srgb,#7c3aed 24%,var(--line));border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,#f3e8ff 62%,var(--surface)),var(--surface))}.event-week-preset-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.event-week-preset-head strong{font-size:1rem;font-weight:950}.event-week-preset-head span{color:#6d28d9;font-size:.72rem;font-weight:900}.event-week-preset-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}.event-week-preset-button{min-height:46px;padding:7px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-weight:950;cursor:pointer}.event-week-preset-button small{display:block;margin-top:2px;color:var(--muted);font-size:.64rem;font-weight:850}.event-week-preset-button:hover{border-color:#7c3aed;color:#6d28d9}.event-week-preset-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.event-week-preset-actions .button{width:100%}@media(max-width:900px){.event-week-preset-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}@media(max-width:560px){.event-week-preset-head{display:grid}.event-week-preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.event-week-preset-actions{grid-template-columns:1fr}}
`;
    document.head.append(style);
  }

  function setInput(selector, value) {
    const input = document.querySelector(selector);
    if (!input) return;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function applyWeek(week, mode = 'current') {
    setInput('#eventCoinWeekly', WEEKLY_COINS);
    setInput('#eventCoinTotalWeeks', TOTAL_WEEKS);
    setInput('#eventCoinCurrentWeek', week);
    const button = document.querySelector(mode === 'full' ? '#eventCoinApplyFull' : '#eventCoinApplyCurrent');
    button?.click();
    if (typeof toast === 'function') {
      const label = mode === 'full' ? '시즌 전체' : `${week}주차까지`;
      toast(`${label} 코인 프리셋을 적용했습니다.`);
    }
  }

  function ensureCard() {
    const panel = document.querySelector('.event-coinshop-panel');
    if (!panel || document.querySelector('#eventCoinWeekPresetCard')) return;
    const after = document.querySelector('#eventCoinRoadmapCard') || document.querySelector('.event-shop-grid');
    const card = document.createElement('article');
    card.id = 'eventCoinWeekPresetCard';
    card.className = 'event-week-preset-card';
    const weekButtons = Array.from({ length: TOTAL_WEEKS }, (_, index) => {
      const week = index + 1;
      return `<button type="button" class="event-week-preset-button" data-event-week-preset="${week}">${week}주차<small>${nf.format(week * WEEKLY_COINS)} 코인</small></button>`;
    }).join('');
    card.innerHTML = `
      <div class="event-week-preset-head"><strong>주차 코인 프리셋</strong><span>1주 ${nf.format(WEEKLY_COINS)} · 총 ${nf.format(TOTAL_WEEKS * WEEKLY_COINS)}</span></div>
      <div class="event-week-preset-grid">${weekButtons}</div>
      <div class="event-week-preset-actions">
        <button type="button" class="button secondary small" id="eventCoinPresetCurrentWeek">현재 입력 주차 적용</button>
        <button type="button" class="button primary small" id="eventCoinPresetFullSeason">12주 전체 ${nf.format(TOTAL_WEEKS * WEEKLY_COINS)} 적용</button>
      </div>`;
    if (after) after.insertAdjacentElement('afterend', card);
    else panel.append(card);
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const weekButton = event.target.closest?.('[data-event-week-preset]');
      if (weekButton) {
        applyWeek(Number(weekButton.dataset.eventWeekPreset) || 1, 'current');
        return;
      }
      if (event.target.closest?.('#eventCoinPresetCurrentWeek')) {
        const week = Math.min(Math.max(Math.round(Number(document.querySelector('#eventCoinCurrentWeek')?.value) || 1), 1), TOTAL_WEEKS);
        applyWeek(week, 'current');
        return;
      }
      if (event.target.closest?.('#eventCoinPresetFullSeason')) {
        applyWeek(TOTAL_WEEKS, 'full');
      }
    }, true);
  }

  function boot() {
    installStyles();
    ensureCard();
    bindEvents();
    document.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-view-button="eventCoinshop"]')) setTimeout(ensureCard, 0);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();