(() => {
  'use strict';

  if (window.__kirakiPresetBuildViewLoaded) return;
  window.__kirakiPresetBuildViewLoaded = true;

  const equalDifficultyIds = ['dusk-chaos', 'lucid-hard', 'will-hard', 'guardian-angel-slime-chaos', 'gloom-hard'];
  const equalDifficultySet = new Set(equalDifficultyIds);
  const equalDifficultyPool = () => equalDifficultyIds.map((id) => byId.get(id)).filter(Boolean);
  const bossLabel = (boss) => `${boss.difficulty} ${boss.shortBoss || boss.boss}`;
  const bossIcon = (boss, size = 32) => (
    typeof window.kirakiBossIconHtml === 'function' ? window.kirakiBossIconHtml(boss, size) : ''
  );
  const copyOverrides = {
    'emerald-stable-v01': {
      summary: 'Lv.274 + 2,000~3,000점대 동난이도 보스 선택',
      note: '진 힐라를 제외하면 2,000~3,000점대는 동난이도 선택군으로 봅니다. 가장 편한 우선 후보는 카오스 더스크이며, 하드 루시드·하드 윌·카오스 가엔슬·하드 듄켈 중 가능한 보스로 조정하세요.'
    },
    'emerald-video-30k-v01': {
      note: '진 힐라를 제외하고 레벨을 더 올려 3만 점을 맞추는 구성입니다. 이 구간에서는 카오스 더스크를 가장 편한 우선 후보로 표시했습니다.'
    },
    'sapphire-video-40k-no-hilla-v01': {
      note: '진 힐라를 제외한 동난이도 선택군 기준입니다. 하드 윌 대신 카오스 더스크·카오스 가엔슬·하드 듄켈 체감도 함께 비교하세요.'
    }
  };

  function installStyles() {
    if (document.querySelector('#kirakiPresetBuildViewStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiPresetBuildViewStyles';
    style.textContent = `
.preset-card-readable{position:relative}.preset-card-readable .preset-actions{display:flex;flex-wrap:wrap;gap:8px}.preset-card-readable .preset-actions .button{min-width:126px}.preset-card-readable .status-badge:not(.reference):not(.custom){background:color-mix(in srgb,var(--accent2) 58%,var(--surface));color:var(--accent);border-color:color-mix(in srgb,var(--accent) 24%,var(--line))}.preset-card-readable .preset-status-helper{display:inline-flex;align-items:center;min-height:24px;padding:3px 8px;border-radius:999px;background:var(--soft);color:var(--muted);font-size:.67rem;font-weight:900;white-space:nowrap}.preset-flex-note{display:grid;gap:8px;margin-top:10px;padding:10px 11px;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:12px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent2) 46%,var(--surface)),var(--surface))}.preset-flex-note strong{color:var(--ink);font-size:.78rem}.preset-flex-note p{margin:0;color:var(--muted);font-size:.74rem;line-height:1.55}.preset-flex-list{display:flex;flex-wrap:wrap;gap:5px}.preset-flex-list>span{display:inline-flex;align-items:center;min-height:26px;padding:4px 8px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--ink);font-size:.68rem;font-weight:850}.preset-flex-list>span.preferred{border-color:color-mix(in srgb,var(--accent) 44%,var(--line));background:var(--accent);color:#fff}.preset-build-detail{display:grid;gap:12px;margin-top:12px;padding:13px;border:1px solid color-mix(in srgb,var(--accent) 26%,var(--line));border-radius:14px;background:color-mix(in srgb,var(--soft) 74%,var(--surface))}.preset-build-detail[hidden]{display:none!important}.preset-build-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.preset-build-detail-head strong{color:var(--ink);font-size:.9rem;font-weight:900}.preset-build-detail-head span{color:var(--muted);font-size:.72rem;font-weight:800;white-space:nowrap}.preset-build-groups{display:grid;gap:9px}.preset-build-group{display:grid;gap:6px}.preset-build-group-title{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted);font-size:.7rem;font-weight:900}.preset-build-boss-list{display:flex;flex-wrap:wrap;gap:6px}.preset-build-boss{display:inline-grid;gap:1px;min-height:42px;align-content:center;padding:7px 9px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-size:.75rem;font-weight:900}.preset-build-boss small{color:var(--muted);font-size:.64rem;font-weight:800}.preset-build-boss.preferred{border-color:color-mix(in srgb,var(--accent) 52%,var(--line));box-shadow:inset 3px 0 0 var(--accent)}.preset-build-boss.equal{background:linear-gradient(135deg,var(--surface),color-mix(in srgb,var(--accent2) 38%,var(--surface)))}.preset-build-boss.excluded{opacity:.68}.preset-build-auto{margin:0;color:var(--muted);font-size:.7rem;line-height:1.5}.preset-view-button[aria-expanded="true"]{border-color:var(--accent);color:var(--accent)}
@media(max-width:620px){.preset-card-readable .preset-actions .button{flex:1 1 100%}.preset-build-detail-head{display:grid}.preset-build-detail-head span{white-space:normal}.preset-build-boss{flex:1 1 calc(50% - 6px)}}
`;
    document.head.append(style);
  }

  function presetById(id) {
    return allPresets().find((preset) => preset.id === id) || null;
  }

  function targetBossesForPreset(preset) {
    return collapseTargets(presetBossIds(preset))
      .map((entry) => entry.target)
      .filter(Boolean)
      .sort((a, b) => b.points - a.points || bossLabel(a).localeCompare(bossLabel(b), 'ko'));
  }

  function bossByVisibleLabel(label) {
    for (const boss of byId.values()) {
      if (bossLabel(boss) === label) return boss;
    }
    return null;
  }

  function applyCopyOverrides(card, preset) {
    const override = copyOverrides[preset.id];
    if (!override) return;
    const summary = card.querySelector('.preset-summary');
    const note = card.querySelector('.preset-note');
    if (summary && override.summary) summary.textContent = override.summary;
    if (note && override.note) note.textContent = override.note;
  }

  function decorateKeyBossChips(card) {
    card.querySelectorAll('.preset-boss-chip:not(.more)').forEach((chip) => {
      if (chip.querySelector('.boss-photo-icon')) return;
      const label = chip.textContent.trim();
      const boss = bossByVisibleLabel(label);
      if (!boss) return;
      chip.classList.add('has-boss-icon');
      chip.innerHTML = `${bossIcon(boss, 28)}<span>${escapeHtml(label)}</span>`;
    });
  }

  function groupedBosses(targets) {
    const groups = new Map();
    targets.forEach((boss) => {
      const key = boss.points >= 2000 && boss.points <= 3000 && boss.series !== 'verus-hilla'
        ? '2000-3000'
        : String(boss.points);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(boss);
    });
    return [...groups.entries()].sort((a, b) => {
      const av = a[0] === '2000-3000' ? 2600 : Number(a[0]);
      const bv = b[0] === '2000-3000' ? 2600 : Number(b[0]);
      return bv - av;
    });
  }

  function hasEqualDifficultyContext(preset, targets) {
    if (['emerald', 'sapphire', 'diamond'].includes(preset.tierId)) return true;
    return targets.some((boss) => equalDifficultySet.has(boss.id));
  }

  function equalDifficultyNoticeHtml() {
    const bosses = equalDifficultyPool();
    return `
      <div class="preset-flex-note" data-preset-flex-note>
        <strong>2,000~3,000점대는 진 힐라를 제외하고 동난이도 선택군으로 봅니다.</strong>
        <p>체감은 사람마다 다르지만, 이 구간에서는 카오스 더스크를 가장 편한 우선 후보로 표시했습니다.</p>
        <div class="preset-flex-list">
          ${bosses.map((boss) => `<span class="has-boss-icon ${boss.id === 'dusk-chaos' ? 'preferred' : ''}">${bossIcon(boss, 24)}<span>${escapeHtml(bossLabel(boss))}</span></span>`).join('')}
        </div>
      </div>`;
  }

  function buildGroupTitle(key) {
    if (key === '2000-3000') return '동난이도 선택군 · 진 힐라 제외';
    return `${number.format(Number(key))}점 구간`;
  }

  function buildDetailHtml(preset) {
    const ids = presetBossIds(preset);
    const targets = targetBossesForPreset(preset);
    const autoIncluded = Math.max(0, ids.length - targets.length);
    const groups = groupedBosses(targets);
    return `
      <div class="preset-build-detail" data-preset-build-detail="${escapeHtml(preset.id)}" hidden>
        <div class="preset-build-detail-head">
          <strong>이 빌드에서 실제로 잡을 보스</strong>
          <span>격파 ${targets.length}종 · 자동 포함 미션 ${autoIncluded}개</span>
        </div>
        <div class="preset-build-groups">
          ${groups.map(([key, bosses]) => `
            <div class="preset-build-group">
              <div class="preset-build-group-title"><span>${escapeHtml(buildGroupTitle(key))}</span><span>${bosses.length}종</span></div>
              <div class="preset-build-boss-list">
                ${bosses.map((boss) => `
                  <span class="preset-build-boss${boss.id === 'dusk-chaos' ? ' preferred' : ''}${equalDifficultySet.has(boss.id) ? ' equal' : ''}${boss.series === 'verus-hilla' ? ' excluded' : ''}">
                    ${bossIcon(boss, 34)}
                    <span class="preset-build-boss-label">${escapeHtml(bossLabel(boss))}</span>
                    <small>${number.format(boss.points)}점${boss.id === 'dusk-chaos' ? ' · 우선 추천' : ''}${boss.series === 'verus-hilla' ? ' · 별도 취급' : ''}</small>
                  </span>`).join('')}
              </div>
            </div>`).join('')}
        </div>
        ${autoIncluded ? `<p class="preset-build-auto">상위 난이도를 잡으면 같은 보스의 하위 미션은 자동 완료로 반영됩니다.</p>` : ''}
      </div>`;
  }

  function decorateCard(card) {
    const applyButton = card.querySelector('[data-apply-preset]');
    if (!applyButton) return;
    const preset = presetById(applyButton.dataset.applyPreset);
    if (!preset) return;

    applyButton.textContent = '빌드 클리어';
    applyButton.setAttribute('aria-label', `${preset.name} 빌드 클리어 처리`);

    const statusBadge = card.querySelector('.status-badge:not(.reference):not(.custom)');
    if (statusBadge && ['검토중', '조정 초안'].includes(statusBadge.textContent.trim())) {
      statusBadge.textContent = '선택형';
    }

    const targets = targetBossesForPreset(preset);
    const equalContext = hasEqualDifficultyContext(preset, targets);
    applyCopyOverrides(card, preset);
    decorateKeyBossChips(card);

    if (equalContext) {
      const keyLabel = card.querySelector('.preset-key-bosses-label');
      if (keyLabel) keyLabel.textContent = '동난이도 선택 보스';
    }

    if (equalContext && !card.querySelector('[data-preset-flex-note]')) {
      const note = document.createElement('div');
      note.innerHTML = equalDifficultyNoticeHtml();
      const target = card.querySelector('.preset-key-bosses') || card.querySelector('.preset-summary');
      target?.insertAdjacentElement('afterend', note.firstElementChild);
    }

    if (!card.querySelector('[data-view-preset-build]')) {
      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.className = 'button ghost small preset-view-button';
      viewButton.dataset.viewPresetBuild = preset.id;
      viewButton.setAttribute('aria-expanded', 'false');
      viewButton.textContent = '빌드 보기';
      applyButton.insertAdjacentElement('beforebegin', viewButton);
    }

    if (!card.querySelector('[data-preset-build-detail]')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = buildDetailHtml(preset);
      card.querySelector('.preset-actions')?.insertAdjacentElement('beforebegin', wrapper.firstElementChild);
    }
  }

  function decoratePresetCards() {
    installStyles();
    document.querySelectorAll('.preset-card-readable').forEach(decorateCard);
  }

  function bindEvents() {
    if (window.__kirakiPresetBuildViewEventsBound) return;
    window.__kirakiPresetBuildViewEventsBound = true;
    el.presetGrid?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-view-preset-build]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const card = button.closest('.preset-card-readable');
      const detail = card?.querySelector(`[data-preset-build-detail="${CSS.escape(button.dataset.viewPresetBuild)}"]`);
      if (!detail) return;
      const open = detail.hidden;
      detail.hidden = !open;
      button.textContent = open ? '빌드 접기' : '빌드 보기';
      button.setAttribute('aria-expanded', String(open));
    });
  }

  function wrapRenderPresets() {
    if (window.__kirakiPresetBuildRenderWrapped || typeof renderPresets !== 'function') return;
    window.__kirakiPresetBuildRenderWrapped = true;
    const baseRenderPresets = renderPresets;
    renderPresets = function presetBuildAwareRender() {
      const result = baseRenderPresets();
      requestAnimationFrame(decoratePresetCards);
      return result;
    };
  }

  function wrapApplyPreset() {
    if (window.__kirakiPresetBuildApplyWrapped || typeof applyPreset !== 'function') return;
    window.__kirakiPresetBuildApplyWrapped = true;
    applyPreset = function clearPresetBuild(preset) {
      if (!preset) return;
      if (!window.confirm(`${preset.name} 빌드를 클리어 처리할까요? 현재 레벨과 보스 체크가 이 빌드 기준으로 교체됩니다.`)) return;
      patchProfile({ level: preset.level, clearedBossIds: presetBossIds(preset), targetTierId: preset.tierId }, '빌드 클리어됨');
      render();
      setView('dashboard', { scroll: true });
      toast(`${preset.name} 빌드를 클리어 처리했습니다.`);
    };
  }

  function boot() {
    installStyles();
    bindEvents();
    wrapApplyPreset();
    wrapRenderPresets();
    decoratePresetCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
