(() => {
  'use strict';

  if (window.__kirakiPresetBuildViewVersion === '0.1.10') return;
  window.__kirakiPresetBuildViewVersion = '0.1.10';
  window.__kirakiPresetBuildViewLoaded = true;

  const equalDifficultyIds = ['dusk-chaos', 'lucid-hard', 'will-hard', 'guardian-angel-slime-chaos', 'gloom-hard'];
  const equalDifficultySet = new Set(equalDifficultyIds);
  const equalDifficultyRank = new Map(equalDifficultyIds.map((id, index) => [id, equalDifficultyIds.length - index]));
  const bossDifficultyRank = new Map(Object.entries({
    'kaling-easy': 9900,
    'mayrin-hard': 9600,
    'kalos-normal': 9450,
    'adversary-normal': 9400,
    'seren-hard': 7600,
    'adversary-easy': 7500,
    'kalos-easy': 7400,
    'seren-normal': 6500,
    'black-mage-hard': 6400,
    'mayrin-normal': 5000
  }));
  const titleOverrides = {
    'bronze-stable-v01': '브론즈 Lv.260 노멀 스우·데미안형',
    'silver-stable-v01': '실버 Lv.264 노멀 루시드·윌형',
    'gold-stable-v01': '골드 Lv.266 하드 스우형',
    'platinum-stable-v01': '플래티넘 Lv.270 하드 루시드형',
    'emerald-stable-v01': '에메랄드 Lv.274 하드 윌·카오스 가엔슬형',
    'emerald-video-30k-v01': '3만점 Lv.280 카오스 더스크형',
    'sapphire-reference-v01': '사파이어 Lv.276 하드 진 힐라 포함형',
    'sapphire-video-40k-no-hilla-v01': '4만점 Lv.280 하드 윌형 (진 힐라 제외)',
    'sapphire-video-40k-normal-will-hilla-v01': '4만점 Lv.281 노멀 윌·진 힐라형 (하드 윌 제외)',
    'sapphire-video-40k-normal-will-no-hilla-v01': '4만점 Lv.282 노멀 윌O · 하드 윌X · 진 힐라X',
    'diamond-video-50k-mayrin-v01': '다이아몬드 Lv.280 노멀 메이린형',
    'diamond-video-50k-black-mage-v01': '다이아몬드 Lv.280 하드 검은 마법사형',
    'diamond-video-50k-seren-v01': '다이아몬드 Lv.280 노멀 세렌형',
    'master-video-adversary-v01': '마스터 Lv.280 이지 대적자형',
    'master-video-kalos-v01': '마스터 Lv.281 이지 칼로스형',
    'challenger-video-hard-mayrin-v01': '챌린저 Lv.284 하드 메이린형'
  };

  const bossLabel = (boss) => `${boss.difficulty} ${boss.shortBoss || boss.boss}`;
  const bossIcon = (boss, size = 32) => (
    typeof window.kirakiBossIconHtml === 'function' ? window.kirakiBossIconHtml(boss, size) : ''
  );

  function installStyles() {
    if (document.querySelector('#kirakiPresetBuildViewStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiPresetBuildViewStyles';
    style.textContent = `
.preset-card-readable{position:relative}.preset-card-readable .preset-actions{display:flex;flex-wrap:wrap;gap:8px}.preset-card-readable .preset-actions .button{min-width:126px}.preset-card-readable .status-badge:not(.reference):not(.custom){background:color-mix(in srgb,var(--accent2) 58%,var(--surface));color:var(--accent);border-color:color-mix(in srgb,var(--accent) 24%,var(--line))}.preset-card-readable .preset-summary,.preset-card-readable .preset-key-bosses,.preset-card-readable .preset-detail-row,.preset-card-readable .preset-note,.preset-card-readable [data-preset-flex-note],.preset-card-readable [data-view-preset-build]{display:none!important}.preset-build-detail{display:grid;gap:10px;margin:12px 0;padding:12px;border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--soft) 70%,var(--surface))}.preset-build-detail[hidden]{display:grid!important}.preset-build-detail-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.preset-build-detail-head strong{color:var(--ink);font-size:.85rem;font-weight:900}.preset-build-detail-head span{color:var(--muted);font-size:.68rem;font-weight:850;white-space:nowrap}.preset-build-groups{display:grid;gap:8px}.preset-build-group{display:grid;gap:6px}.preset-build-group-title{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted);font-size:.68rem;font-weight:900}.preset-build-boss-list{display:flex;flex-wrap:wrap;gap:6px}.preset-build-boss{display:inline-grid;grid-template-columns:auto 1fr;grid-template-areas:'icon label' 'icon meta';column-gap:7px;align-items:center;min-height:42px;padding:6px 8px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-size:.73rem;font-weight:900}.preset-build-boss .boss-photo-icon{grid-area:icon}.preset-build-boss-label{grid-area:label;line-height:1.2}.preset-build-boss small{grid-area:meta;color:var(--muted);font-size:.62rem;font-weight:800;line-height:1.2}.preset-build-boss.preferred{border-color:color-mix(in srgb,var(--accent) 52%,var(--line));box-shadow:inset 3px 0 0 var(--accent)}.preset-build-boss.equal{background:linear-gradient(135deg,var(--surface),color-mix(in srgb,var(--accent2) 34%,var(--surface)))}
@media(max-width:620px){.preset-card-readable .preset-actions .button{flex:1 1 100%}.preset-build-detail-head{display:grid}.preset-build-detail-head span{white-space:normal}.preset-build-boss{flex:1 1 calc(50% - 6px)}}
`;
    document.head.append(style);
  }

  function presetById(id) {
    return allPresets().find((preset) => preset.id === id) || null;
  }

  function isEqualDifficultyBoss(boss) {
    return boss.points >= 2000 && boss.points <= 3000 && boss.series !== 'verus-hilla';
  }

  function groupSortValue(boss) {
    return isEqualDifficultyBoss(boss) ? 2600 : boss.points;
  }

  function displayRank(boss) {
    if (isEqualDifficultyBoss(boss)) return equalDifficultyRank.get(boss.id) || 0;
    return bossDifficultyRank.get(boss.id) || (boss.points * 10 + (boss.rank || 0));
  }

  function compareBossDisplay(a, b) {
    return groupSortValue(b) - groupSortValue(a)
      || displayRank(b) - displayRank(a)
      || bossLabel(a).localeCompare(bossLabel(b), 'ko');
  }

  function targetBossesForPreset(preset) {
    return collapseTargets(presetBossIds(preset))
      .map((entry) => entry.target)
      .filter(Boolean)
      .sort(compareBossDisplay);
  }

  function groupedBosses(targets) {
    const groups = new Map();
    targets.forEach((boss) => {
      const key = isEqualDifficultyBoss(boss) ? '2000-3000' : String(boss.points);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(boss);
    });
    return [...groups.entries()].sort((a, b) => {
      const av = a[0] === '2000-3000' ? 2600 : Number(a[0]);
      const bv = b[0] === '2000-3000' ? 2600 : Number(b[0]);
      return bv - av;
    });
  }

  function buildGroupTitle(key) {
    if (key === '2000-3000') return '2,000~3,000점 선택군';
    return `${number.format(Number(key))}점 구간`;
  }

  function buildDetailHtml(preset) {
    const targets = targetBossesForPreset(preset);
    const groups = groupedBosses(targets);
    return `
      <div class="preset-build-detail" data-preset-build-detail="${escapeHtml(preset.id)}">
        <div class="preset-build-detail-head">
          <strong>잡을 보스</strong>
          <span>실제 격파 ${targets.length}종</span>
        </div>
        <div class="preset-build-groups">
          ${groups.map(([key, bosses]) => `
            <div class="preset-build-group">
              <div class="preset-build-group-title"><span>${escapeHtml(buildGroupTitle(key))}</span><span>${bosses.length}종</span></div>
              <div class="preset-build-boss-list">
                ${bosses.map((boss) => `
                  <span class="preset-build-boss${boss.id === 'dusk-chaos' ? ' preferred' : ''}${equalDifficultySet.has(boss.id) ? ' equal' : ''}">
                    ${bossIcon(boss, 34)}
                    <span class="preset-build-boss-label">${escapeHtml(bossLabel(boss))}</span>
                    <small>${number.format(boss.points)}점${boss.id === 'dusk-chaos' ? ' · 우선' : ''}</small>
                  </span>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function removeExtraCopy(card) {
    card.querySelectorAll('.preset-summary, .preset-key-bosses, .preset-detail-row, .preset-note, [data-preset-flex-note], [data-view-preset-build]').forEach((node) => node.remove());
  }

  function applyTitle(card, preset) {
    const title = card.querySelector('h3');
    if (title && titleOverrides[preset.id]) title.textContent = titleOverrides[preset.id];
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

    applyTitle(card, preset);
    removeExtraCopy(card);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildDetailHtml(preset);
    const nextDetail = wrapper.firstElementChild;
    const currentDetail = card.querySelector('[data-preset-build-detail]');
    if (currentDetail) {
      currentDetail.replaceWith(nextDetail);
    } else {
      const metricGrid = card.querySelector('.preset-metric-grid');
      if (metricGrid) metricGrid.insertAdjacentElement('beforebegin', nextDetail);
      else card.querySelector('.preset-actions')?.insertAdjacentElement('beforebegin', nextDetail);
    }
  }

  function decoratePresetCards() {
    installStyles();
    document.querySelectorAll('.preset-card-readable').forEach(decorateCard);
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
    wrapApplyPreset();
    wrapRenderPresets();
    decoratePresetCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();