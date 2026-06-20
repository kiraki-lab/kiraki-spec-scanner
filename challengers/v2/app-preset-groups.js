(() => {
  const checklist = document.querySelector('#presetTierChecklist');
  const selectAllButton = document.querySelector('#selectAllPresetTiersButton');
  const clearButton = document.querySelector('#clearPresetTiersButton');
  const selectedTierIds = new Set();

  function typeFilteredPresets() {
    const typeFilter = el.presetTypeFilter.value || 'all';
    return allPresets().filter((preset) => typeFilter === 'all' || preset.type === typeFilter);
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

    return `
      <article class="preset-card${reference ? ' reference' : ''}${custom ? ' admin-added' : ''}">
        <div class="preset-topline">
          <span class="type-badge ${escapeHtml(preset.type || 'custom')}">${escapeHtml(type?.name || '직접 설계')}</span>
          <span class="status-badge${reference ? ' reference' : ''}${custom ? ' custom' : ''}">${statusText}</span>
        </div>
        <h3>${escapeHtml(preset.name)}</h3>
        <p class="preset-summary">${escapeHtml(preset.summary || autoSummary)}</p>
        <p class="preset-target-count">${escapeHtml(tier?.name || '')} 목표 · 실제 격파 ${targets.length}종 · 완료 미션 ${ids.length}개</p>
        <div class="preset-score-row"><span>레벨 ${number.format(levelScore)} + 보스 ${number.format(bossScore)}</span><strong>${number.format(total)}점</strong></div>
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
      return `
        <details class="preset-tier-group" open data-preset-tier-group="${tier.id}">
          <summary>
            <span class="preset-tier-group-title"><strong>${escapeHtml(tier.name)}</strong><small>${number.format(tier.threshold)}점</small></span>
            <span class="preset-tier-group-count">빌드 ${presets.length}개</span>
          </summary>
          <div class="preset-tier-card-grid">${presets.map(buildCard).join('')}</div>
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
