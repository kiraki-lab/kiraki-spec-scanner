(() => {
  'use strict';

  if (window.__kirakiPresetRouteCorrectionsLoaded) return;
  window.__kirakiPresetRouteCorrectionsLoaded = true;

  const routeFixes = {
    'sapphire-video-40k-normal-will-no-hilla-v01': {
      name: '4만점 Lv.282 노멀 윌형 (하드 윌 제외)',
      summary: 'Lv.282 + 포함: 노멀 윌 (제외: 하드 윌·진 힐라)',
      note: '노멀 윌을 포함하고 하드 윌은 제외하는 루트입니다. 진 힐라는 노멀·하드 모두 제외하고, 3,000점 이하 나머지 보스는 완료 기준입니다. 총 40,500점.',
      noticeTitle: '이 빌드는 노멀 윌 포함, 하드 윌 제외 루트입니다.',
      noticeBody: 'Lv.282에서 노멀 윌을 잡고 하드 윌은 제외합니다. 진 힐라도 노멀·하드 모두 제외 기준입니다.',
      groupTitle: '동난이도 선택군 · 하드 윌/진 힐라 제외',
      includedIds: ['will-normal'],
      excludedIds: ['will-hard', 'verus-hilla-normal', 'verus-hilla-hard']
    }
  };

  function escape(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function bossById(id) {
    return window.CHALLENGERS_DATA?.bossMissions?.find((boss) => boss.id === id) || null;
  }

  function bossLabel(boss) {
    return `${boss.difficulty} ${boss.shortBoss || boss.boss}`;
  }

  function bossIcon(boss, size = 24) {
    return typeof window.kirakiBossIconHtml === 'function' ? window.kirakiBossIconHtml(boss, size) : '';
  }

  function badge(label, className) {
    return `<em class="${className}">${escape(label)}</em>`;
  }

  function statusChip(id, className, label) {
    const boss = bossById(id);
    if (!boss) return '';
    const badgeClass = className === 'included' ? 'preset-inclusion-badge' : 'preset-exclusion-badge';
    return `<span class="has-boss-icon ${className}">${bossIcon(boss, 24)}<span>${escape(bossLabel(boss))}</span>${badge(label, badgeClass)}</span>`;
  }

  function applyDataFixes() {
    const presets = window.CHALLENGERS_DATA?.presets;
    if (!Array.isArray(presets)) return;
    presets.forEach((preset) => {
      const fix = routeFixes[preset.id];
      if (!fix) return;
      preset.name = fix.name;
      preset.summary = fix.summary;
      preset.note = fix.note;
    });
  }

  function routeNoticeHtml(fix) {
    return `
      <strong>${escape(fix.noticeTitle)}</strong>
      <p>${escape(fix.noticeBody)}</p>
      <div class="preset-flex-list">
        ${fix.includedIds.map((id) => statusChip(id, 'included', '포함')).join('')}
        ${fix.excludedIds.map((id) => statusChip(id, 'excluded', '제외')).join('')}
      </div>`;
  }

  function applyCardFixes() {
    Object.entries(routeFixes).forEach(([presetId, fix]) => {
      const escapedId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(presetId) : presetId.replace(/"/g, '\\"');
      const applyButton = document.querySelector(`[data-apply-preset="${escapedId}"]`);
      const card = applyButton?.closest('.preset-card, .preset-card-readable');
      if (!card) return;

      const title = card.querySelector('h3');
      const summary = card.querySelector('.preset-summary');
      const note = card.querySelector('.preset-note');
      if (title) title.textContent = fix.name;
      if (summary) summary.textContent = fix.summary;
      if (note) note.textContent = fix.note;

      const flexNote = card.querySelector('[data-preset-flex-note]');
      if (flexNote) flexNote.innerHTML = routeNoticeHtml(fix);

      card.querySelectorAll('.preset-build-group-title span:first-child').forEach((label) => {
        if (label.textContent.includes('진 힐라 제외') || label.textContent.includes('하드 윌')) label.textContent = fix.groupTitle;
      });
    });
  }

  function rerenderPresetsOnce() {
    if (typeof renderPresets !== 'function') return;
    renderPresets();
  }

  function boot() {
    applyDataFixes();

    if (typeof renderPresets === 'function' && !window.__kirakiPresetRouteRenderWrapped) {
      window.__kirakiPresetRouteRenderWrapped = true;
      const baseRenderPresets = renderPresets;
      renderPresets = function routeAwareRenderPresets() {
        const result = baseRenderPresets();
        requestAnimationFrame(applyCardFixes);
        return result;
      };
    }

    if (typeof el !== 'undefined' && el?.presetGrid) {
      const observer = new MutationObserver(() => requestAnimationFrame(applyCardFixes));
      observer.observe(el.presetGrid, { childList: true, subtree: true });
    }

    rerenderPresetsOnce();
    requestAnimationFrame(applyCardFixes);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();