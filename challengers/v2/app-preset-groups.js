(() => {
  const checklist = document.querySelector('#presetTierChecklist');
  const selectAllButton = document.querySelector('#selectAllPresetTiersButton');
  const clearButton = document.querySelector('#clearPresetTiersButton');
  const selectedTierIds = new Set();

  function typeFilteredPresets() {
    const typeFilter = el.presetTypeFilter.value || 'all';
    return allPresets().filter((preset) => typeFilter === 'all' || preset.type === typeFilter);
  }

  function bossLabel(boss) {
    return `${boss.difficulty} ${boss.shortBoss || boss.boss}`;
  }

  function uniqueHighestBosses(bosses) {
    const bySeriesMap = new Map();
    bosses.filter(Boolean).forEach((boss) => {
      const current = bySeriesMap.get(boss.series);
      if (!current || boss.rank > current.rank) bySeriesMap.set(boss.series, boss);
    });
    return [...bySeriesMap.values()].sort((a, b) => b.points - a.points || bossLabel(a).localeCompare(bossLabel(b), 'ko'));
  }

  function keyBossInfo(preset, targets) {
    let bosses = [];
    let label = '핵심 보스';

    if (Array.isArray(preset.highlightBossIds) && preset.highlightBossIds.length) {
      bosses = uniqueHighestBosses(preset.highlightBossIds.map((id) => byId.get(id)));
    } else if (Array.isArray(preset.extraBossIds) && preset.extraBossIds.length) {
      bosses = uniqueHighestBosses(preset.extraBossIds.map((id) => byId.get(id)));
      const pointValues = [...new Set(bosses.map((boss) => boss.points))];
      label = pointValues.length === 1
        ? `${number.format(pointValues[0])}점 선택 보스`
        : '추가 선택 보스';
    } else {
      const sortedTargets = [...targets].sort((a, b) => b.target.points - a.target.points || bossLabel(a.target).localeCompare(bossLabel(b.target), 'ko'));
      const highestPoints = sortedTargets[0]?.target.points;
      if (highestPoints !== undefined) {
        bosses = uniqueHighestBosses(
          sortedTargets
            .filter(({ target }) => target.points === highestPoints)
            .map(({ target }) => target)
        );
        label = `${number.format(highestPoints)}점 핵심 보스`;
      }
    }

    if (!bosses.length) return null;

    const visible = bosses.slice(0, 5);
    return {
      label,
      bosses: visible,
      remaining: Math.max(0, bosses.length - visible.length)
    };
  }

  function buildCard(preset) {
    const ids = presetBossIds(preset);
    const targets = collapseTargets(ids);
    const levelScore = levelPoints(preset.level);
    const bossScore = bossPoints(ids);
    const total = levelScore + bossScore;
    const tier = DATA.tiers.find((item) => item.id === preset.tierId);
    const type = typeById.get(preset.type) || typeById.get('custom');
    const reference = preset.status === 'reference';
    const custom = preset.status === 'custom';
    const statusText = reference ? '기준 확정' : custom ? '키라키 추가' : '검토중';
    const autoSummary = `Lv.${preset.level} + 보스 ${targets.length}종`;
    const thresholdGap = tier ? total - tier.threshold : 0;
    const gapText = thresholdGap > 0
      ? `목표보다 ${number.format(thresholdGap)}점 여유`
      : thresholdGap < 0
        ? `목표까지 ${number.format(Math.abs(thresholdGap))}점 부족`
        : '목표 점수 일치';
    const keyBosses = keyBossInfo(preset, targets);
    const keyBossHtml = keyBosses
      ? `
        <div class="preset-key-bosses">
          <span class="preset-key-bosses-label">${escapeHtml(keyBosses.label)}</span>
          <div class="preset-key-bosses-list">
            ${keyBosses.bosses.map((boss) => `<span class="preset-boss-chip">${escapeHtml(bossLabel(boss))}</span>`).join('')}
            ${keyBosses.remaining ? `<span class="preset-boss-chip more">외 ${keyBosses.remaining}종</span>` : ''}
          </div>
        </div>`
      : '';

    return `
      <article class="preset-card preset-card-readable${reference ? ' reference' : ''}${custom ? ' admin-added' : ''}">
        <div class="preset-topline">
          <span class="type-badge ${escapeHtml(preset.type || 'custom')}">${escapeHtml(type?.name || '직접 설계')}</span>
          <span class="status-badge${reference ? ' reference' : ''}${custom ? ' custom' : ''}">${statusText}</span>
        </div>

        <div class="preset-title-row">
          <h3>${escapeHtml(preset.name)}</h3>
          <strong class="preset-total-score">${number.format(total)}점</strong>
        </div>

        <p class="preset-summary">${escapeHtml(preset.summary || autoSummary)}</p>
        ${keyBossHtml}

        <div class="preset-metric-grid" aria-label="빌드 포인트 구성">
          <div class="preset-metric">
            <span>권장 레벨</span>
            <strong>Lv.${preset.level}</strong>
          </div>
          <div class="preset-metric">
            <span>레벨 포인트</span>
            <strong>${number.format(levelScore)}</strong>
          </div>
          <div class="preset-metric">
            <span>보스 포인트</span>
            <strong>${number.format(bossScore)}</strong>
          </div>
        </div>

        <div class="preset-detail-row">
          <span>${escapeHtml(tier?.name || '')} 목표</span>
          <span>실제 격파 ${targets.length}종</span>
          <span>완료 미션 ${ids.length}개</span>
          <span>${escapeHtml(gapText)}</span>
        </div>

        <p class="preset-note">${escapeHtml(preset.note || type?.description || '')}</p>

        <div class="preset-actions">
          <button type="button" class="button ${reference ? 'primary' : 'secondary'} small" data-apply-preset="${escapeHtml(preset.id)}">이 빌드 적용</button>
          ${custom && isAdminUnlocked() ? `<button type="button" class="button ghost small" data-edit-custom-preset="${escapeHtml(preset.id)}">편집</button>` : ''}
        </div>
      </article>`;
  }

  function renderChecklist(filteredPresets) {
    const counts = new Map(DATA.tiers.map((tier) => [tier.id, 0]));
    filteredPresets.forEach((preset) => counts.set(preset.tierId, (counts.get(preset.tierId) || 0) + 1));

    checklist.innerHTML = DATA.tiers.map((tier) => {
      const count = counts.get(tier.id) || 0;
      const checked = selectedTierIds.has(tier.id);
      return `
        <label class="preset-tier-choice${checked ? ' selected' : ''}${count === 0 ? ' disabled' : ''}">
          <input type="checkbox" value="${tier.id}" data-preset-tier-checkbox ${checked ? 'checked' : ''} ${count === 0 ? 'disabled' : ''} />
          <span><strong>${escapeHtml(tier.name)}</strong><small>${number.format(tier.threshold)}점 · 빌드 ${count}개</small></span>
        </label>`;
    }).join('');
  }

  renderPresets = function groupedPresetRender() {
    const filteredPresets = typeFilteredPresets();
    const availableTierIds = new Set(filteredPresets.map((preset) => preset.tierId));
    [...selectedTierIds].forEach((tierId) => {
      if (!availableTierIds.has(tierId)) selectedTierIds.delete(tierId);
    });
    renderChecklist(filteredPresets);

    if (!selectedTierIds.size) {
      el.presetGrid.innerHTML = '';
      el.presetEmptyState.hidden = false;
      el.presetEmptyState.textContent = '확인할 티어를 체크해 주세요.';
      return;
    }

    const groups = DATA.tiers.map((tier) => {
      if (!selectedTierIds.has(tier.id)) return null;
      const presets = filteredPresets.filter((preset) => preset.tierId === tier.id);
      if (!presets.length) return null;
      const gridClass = presets.length === 1 ? ' single-card' : presets.length === 2 ? ' two-cards' : '';

      return `
        <details class="preset-tier-group" open data-preset-tier-group="${tier.id}">
          <summary>
            <span class="preset-tier-group-title">
              <strong>${escapeHtml(tier.name)}</strong>
              <small>${number.format(tier.threshold)}점</small>
            </span>
            <span class="preset-tier-group-count">빌드 ${presets.length}개</span>
          </summary>
          <div class="preset-tier-card-grid${gridClass}">${presets.map(buildCard).join('')}</div>
        </details>`;
    }).filter(Boolean);

    el.presetGrid.innerHTML = groups.join('');
    el.presetEmptyState.hidden = groups.length > 0;
    if (!groups.length) el.presetEmptyState.textContent = '선택한 티어와 유형에 맞는 빌드가 없습니다.';
  };

  checklist?.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-preset-tier-checkbox]');
    if (!checkbox) return;
    if (checkbox.checked) selectedTierIds.add(checkbox.value);
    else selectedTierIds.delete(checkbox.value);
    renderPresets();
  });

  selectAllButton?.addEventListener('click', () => {
    const availableTierIds = new Set(typeFilteredPresets().map((preset) => preset.tierId));
    availableTierIds.forEach((tierId) => selectedTierIds.add(tierId));
    renderPresets();
  });

  clearButton?.addEventListener('click', () => {
    selectedTierIds.clear();
    renderPresets();
  });

  el.presetTypeFilter.addEventListener('change', renderPresets);
  renderPresets();
})();
