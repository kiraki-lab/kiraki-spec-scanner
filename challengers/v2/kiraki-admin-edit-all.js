(() => {
  'use strict';

  if (window.__kirakiAdminEditAllLoaded) return;
  window.__kirakiAdminEditAllLoaded = true;

  const basePresetIds = new Set(DATA.presets.map((preset) => preset.id));
  const basePresetById = new Map(DATA.presets.map((preset) => [preset.id, preset]));

  function storedPresetById(id) {
    return store.customPresets.find((preset) => preset.id === id) || null;
  }

  function mergedBasePreset(basePreset) {
    const override = storedPresetById(basePreset.id);
    if (!override) return basePreset;
    return {
      ...basePreset,
      ...override,
      bossIds: Array.isArray(override.bossIds) ? override.bossIds : presetBossIds(basePreset),
      status: 'custom',
      sourcePresetId: basePreset.id,
      sourceStatus: basePreset.status
    };
  }

  allPresets = function allEditablePresets() {
    const basePresets = DATA.presets.map(mergedBasePreset);
    const customOnly = store.customPresets.filter((preset) => !basePresetIds.has(preset.id));
    return [...basePresets, ...customOnly];
  };

  adminPresetById = function editableAdminPresetById(id) {
    return allPresets().find((preset) => preset.id === id) || null;
  };

  loadAdminPreset = function loadEditablePreset(preset) {
    if (!preset) return;
    el.adminPresetId.value = preset.id;
    el.adminPresetName.value = preset.name || '';
    el.adminPresetType.value = preset.type === 'hunting' ? 'hunting' : 'boss';
    el.adminPresetTier.value = preset.tierId || 'bronze';
    el.adminPresetLevel.value = preset.level || activeProfile().level || 260;
    el.adminPresetSummary.value = preset.summary || '';
    el.adminPresetNote.value = preset.note || '';
    adminDraftBossIds = presetBossIds(preset);
    el.adminSavePresetButton.textContent = basePresetIds.has(preset.id) ? '기본 빌드 수정 저장' : '빌드 수정 저장';
    updateAdminDraftUi();
    el.adminPresetName.focus();
  };

  function upsertStoredPreset(preset) {
    const index = store.customPresets.findIndex((item) => item.id === preset.id);
    if (index >= 0) store.customPresets[index] = preset;
    else store.customPresets.push(preset);
  }

  saveAdminPreset = function saveEditablePreset(event) {
    event.preventDefault();
    const name = el.adminPresetName.value.trim();
    if (!name) return;

    const editingId = el.adminPresetId.value;
    const existingStored = editingId ? storedPresetById(editingId) : null;
    const basePreset = editingId ? basePresetById.get(editingId) : null;
    const level = clamp(Math.round(Number(el.adminPresetLevel.value) || 260), 260, 290);
    const type = el.adminPresetType.value === 'hunting' ? 'hunting' : 'boss';
    const tierId = DATA.tiers.some((tier) => tier.id === el.adminPresetTier.value) ? el.adminPresetTier.value : 'bronze';
    const targets = collapseTargets(adminDraftBossIds);
    const now = new Date().toISOString();

    const preset = sanitizeCustomPreset({
      id: editingId || makeId('build'),
      name,
      type,
      tierId,
      level,
      bossIds: adminDraftBossIds,
      summary: el.adminPresetSummary.value.trim() || `Lv.${level} + 보스 ${targets.length}종`,
      note: el.adminPresetNote.value.trim(),
      createdAt: existingStored?.createdAt || now,
      updatedAt: now
    });
    if (!preset) return;

    upsertStoredPreset(preset);
    save(basePreset ? '기본 빌드 수정됨' : existingStored ? '키라키 빌드 수정됨' : '키라키 빌드 추가됨');
    renderPresets();
    renderAdminPresetList();
    const total = levelPoints(preset.level) + bossPoints(preset.bossIds);
    const target = DATA.tiers.find((tier) => tier.id === preset.tierId);
    toast(`${preset.name} 저장 완료${target && total < target.threshold ? ' · 목표 점수보다 낮습니다.' : ''}`);
    resetAdminForm(false);
  };

  renderAdminPresetList = function renderEditablePresetList() {
    if (!store.customPresets.length) {
      el.adminPresetList.innerHTML = '<div class="empty-state">수정하거나 추가한 키라키 빌드가 아직 없습니다.</div>';
      return;
    }

    el.adminPresetList.innerHTML = store.customPresets.map((preset) => {
      const type = typeById.get(preset.type) || typeById.get('boss');
      const tier = DATA.tiers.find((item) => item.id === preset.tierId);
      const total = levelPoints(preset.level) + bossPoints(preset.bossIds);
      const isBaseOverride = basePresetIds.has(preset.id);
      const badge = isBaseOverride ? '기본 수정본' : '키라키 추가';
      const deleteText = isBaseOverride ? '수정본 삭제' : '삭제';
      return `
        <article class="admin-preset-row">
          <div><strong>${escapeHtml(preset.name)}</strong><span>${badge} · ${escapeHtml(type?.name || '보스 빌드')} · ${escapeHtml(tier?.name || '')} · Lv.${preset.level} · ${number.format(total)}점</span></div>
          <div class="admin-row-actions"><button type="button" class="button ghost small" data-admin-edit="${escapeHtml(preset.id)}">편집</button><button type="button" class="button ghost small danger-text" data-admin-delete="${escapeHtml(preset.id)}">${deleteText}</button></div>
        </article>`;
    }).join('');
  };

  function installPresetEditButtons() {
    if (!isAdminUnlocked()) return;
    document.querySelectorAll('.preset-card').forEach((card) => {
      const applyButton = card.querySelector('[data-apply-preset]');
      if (!applyButton) return;
      const presetId = applyButton.dataset.applyPreset;
      const actions = card.querySelector('.preset-actions');
      if (!presetId || !actions) return;
      if (!actions.querySelector('[data-edit-custom-preset], [data-edit-any-preset]')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'button ghost small';
        button.dataset.editAnyPreset = presetId;
        button.textContent = '편집';
        actions.append(button);
      }
      const statusBadge = card.querySelector('.status-badge.custom');
      if (statusBadge && basePresetIds.has(presetId) && storedPresetById(presetId)) statusBadge.textContent = '키라키 수정';
    });
  }

  const baseRenderPresets = renderPresets;
  renderPresets = function editableRenderPresets() {
    const result = baseRenderPresets();
    requestAnimationFrame(installPresetEditButtons);
    return result;
  };

  el.presetGrid?.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-edit-any-preset]');
    if (!editButton || !isAdminUnlocked()) return;
    event.preventDefault();
    event.stopPropagation();
    const preset = adminPresetById(editButton.dataset.editAnyPreset);
    if (!preset) return;
    openAdminDialog();
    loadAdminPreset(preset);
  }, true);
})();
