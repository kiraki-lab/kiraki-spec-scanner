(() => {
  'use strict';

  if (window.__kirakiAdminEditAllVersion === '0.1.1') return;
  window.__kirakiAdminEditAllVersion = '0.1.1';
  window.__kirakiAdminEditAllLoaded = true;

  const basePresetIds = new Set(DATA.presets.map((preset) => preset.id));
  const basePresetById = new Map(DATA.presets.map((preset) => [preset.id, preset]));

  function storedPresetById(id) {
    return store.customPresets.find((preset) => preset.id === id) || null;
  }

  function isBaseOverride(id) {
    return basePresetIds.has(id) && Boolean(storedPresetById(id));
  }

  function mergedBasePreset(basePreset) {
    const override = storedPresetById(basePreset.id);
    if (!override) return basePreset;
    return {
      ...basePreset,
      ...override,
      bossIds: Array.isArray(override.bossIds) ? override.bossIds : presetBossIds(basePreset),
      status: basePreset.status,
      kirakiOverride: true,
      sourcePresetId: basePreset.id,
      sourceStatus: basePreset.status
    };
  }

  function editablePresetRows() {
    const basePresets = DATA.presets.map(mergedBasePreset);
    const customOnly = store.customPresets.filter((preset) => !basePresetIds.has(preset.id));
    return [...basePresets, ...customOnly];
  }

  allPresets = function allEditablePresets() {
    return editablePresetRows();
  };

  adminPresetById = function editableAdminPresetById(id) {
    return editablePresetRows().find((preset) => preset.id === id) || null;
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
    el.adminSavePresetButton.textContent = basePresetIds.has(preset.id) ? '기본 빌드 수정본 저장' : '빌드 수정 저장';
    updateAdminDraftUi();
    el.adminPresetName.focus();
  };

  function upsertStoredPreset(preset) {
    const index = store.customPresets.findIndex((item) => item.id === preset.id);
    if (index >= 0) store.customPresets[index] = preset;
    else store.customPresets.push(preset);
  }

  saveAdminPreset = function saveEditablePreset(event) {
    if (event) event.preventDefault();
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
    save(basePreset ? '기본 빌드 수정본 저장됨' : existingStored ? '키라키 빌드 수정됨' : '키라키 빌드 추가됨');
    renderPresets();
    renderAdminPresetList();
    const total = levelPoints(preset.level) + bossPoints(preset.bossIds);
    const target = DATA.tiers.find((tier) => tier.id === preset.tierId);
    toast(`${preset.name} 저장 완료${target && total < target.threshold ? ' · 목표 점수보다 낮습니다.' : ''}`);
    resetAdminForm(false);
  };

  function renderRowActions(preset) {
    const editButton = `<button type="button" class="button ghost small" data-admin-edit="${escapeHtml(preset.id)}">편집</button>`;
    if (!basePresetIds.has(preset.id)) {
      return `${editButton}<button type="button" class="button ghost small danger-text" data-admin-delete="${escapeHtml(preset.id)}">삭제</button>`;
    }
    if (isBaseOverride(preset.id)) {
      return `${editButton}<button type="button" class="button ghost small danger-text" data-admin-delete="${escapeHtml(preset.id)}">수정본 삭제</button>`;
    }
    return editButton;
  }

  renderAdminPresetList = function renderEditablePresetList() {
    const rows = editablePresetRows();
    if (!rows.length) {
      el.adminPresetList.innerHTML = '<div class="empty-state">편집할 권장 빌드가 없습니다.</div>';
      return;
    }

    el.adminPresetList.innerHTML = rows.map((preset) => {
      const type = typeById.get(preset.type) || typeById.get('boss');
      const tier = DATA.tiers.find((item) => item.id === preset.tierId);
      const ids = presetBossIds(preset);
      const total = levelPoints(preset.level) + bossPoints(ids);
      const base = basePresetIds.has(preset.id);
      const override = isBaseOverride(preset.id);
      const badge = override ? '기본 수정본' : base ? '기본 빌드' : '키라키 추가';
      return `
        <article class="admin-preset-row${override ? ' is-base-override' : base ? ' is-base-preset' : ' is-custom-preset'}">
          <div><strong>${escapeHtml(preset.name)}</strong><span>${badge} · ${escapeHtml(type?.name || '보스 빌드')} · ${escapeHtml(tier?.name || '')} · Lv.${preset.level} · ${number.format(total)}점</span></div>
          <div class="admin-row-actions">${renderRowActions(preset)}</div>
        </article>`;
    }).join('');
  };

  function syncAdminCopy() {
    const heading = document.querySelector('.admin-list-heading div');
    const headingTitle = heading?.querySelector('strong');
    const headingCopy = heading?.querySelector('span');
    if (headingTitle) headingTitle.textContent = '전체 권장 빌드';
    if (headingCopy) headingCopy.textContent = '기본 빌드도 게시글처럼 수정본으로 저장할 수 있습니다.';

    const notice = document.querySelector('#adminEditor .admin-notice');
    if (notice) notice.textContent = '기본 빌드와 키라키 추가 빌드를 모두 수정할 수 있습니다. 기본 빌드는 수정본으로 저장되며, 수정본 삭제 시 원본으로 돌아갑니다.';
  }

  function installStyles() {
    if (document.querySelector('#kirakiAdminEditAllStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiAdminEditAllStyles';
    style.textContent = `
.status-badge.custom-override{background:color-mix(in srgb,#16a34a 15%,var(--surface));border-color:color-mix(in srgb,#16a34a 42%,var(--line));color:color-mix(in srgb,#166534 82%,var(--ink))}.admin-preset-row.is-base-override{border-color:color-mix(in srgb,#16a34a 28%,var(--line));background:color-mix(in srgb,#16a34a 5%,var(--surface))}.admin-preset-row.is-base-preset .danger-text{visibility:hidden}
`;
    document.head.append(style);
  }

  function syncOverrideBadge(card, presetId) {
    const badge = card.querySelector('.status-badge');
    if (!badge) return;
    if (isBaseOverride(presetId)) {
      badge.textContent = '키라키 수정';
      badge.classList.remove('reference', 'custom');
      badge.classList.add('custom-override');
    } else if (basePresetIds.has(presetId)) {
      badge.classList.remove('custom-override');
    }
  }

  function installPresetEditButtons() {
    syncAdminCopy();
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

      syncOverrideBadge(card, presetId);
    });
  }

  let installQueued = false;
  function queuePresetEditInstall() {
    if (installQueued) return;
    installQueued = true;
    requestAnimationFrame(() => {
      installQueued = false;
      installPresetEditButtons();
      window.setTimeout(installPresetEditButtons, 80);
    });
  }

  function bindPresetGridEditButtons() {
    if (!el.presetGrid || window.__kirakiAdminEditAllPresetClickBound) return;
    window.__kirakiAdminEditAllPresetClickBound = true;
    el.presetGrid.addEventListener('click', (event) => {
      const editButton = event.target.closest('[data-edit-any-preset], [data-edit-custom-preset]');
      if (!editButton || !isAdminUnlocked()) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const presetId = editButton.dataset.editAnyPreset || editButton.dataset.editCustomPreset;
      const preset = adminPresetById(presetId);
      if (!preset) return;
      openAdminDialog();
      loadAdminPreset(preset);
    }, true);
  }

  function bindAdminSubmitOverride() {
    if (!el.adminPresetForm || window.__kirakiAdminEditAllSubmitBound) return;
    window.__kirakiAdminEditAllSubmitBound = true;
    el.adminPresetForm.addEventListener('submit', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      saveAdminPreset(event);
    }, true);
  }

  function wrapRenderPresets() {
    if (window.__kirakiAdminEditAllRenderWrapped || typeof renderPresets !== 'function') return;
    window.__kirakiAdminEditAllRenderWrapped = true;
    const baseRenderPresets = renderPresets;
    renderPresets = function editableRenderPresets() {
      const result = baseRenderPresets();
      queuePresetEditInstall();
      return result;
    };
  }

  function wrapSetAdminUnlocked() {
    if (window.__kirakiAdminEditAllUnlockWrapped || typeof setAdminUnlocked !== 'function') return;
    window.__kirakiAdminEditAllUnlockWrapped = true;
    const baseSetAdminUnlocked = setAdminUnlocked;
    setAdminUnlocked = function editableSetAdminUnlocked(unlocked) {
      const result = baseSetAdminUnlocked(unlocked);
      syncAdminCopy();
      if (unlocked) {
        renderAdminPresetList();
        queuePresetEditInstall();
      }
      return result;
    };
  }

  function observePresetGrid() {
    if (!el.presetGrid || window.__kirakiAdminEditAllPresetObserverBound) return;
    window.__kirakiAdminEditAllPresetObserverBound = true;
    const observer = new MutationObserver(queuePresetEditInstall);
    observer.observe(el.presetGrid, { childList: true, subtree: true });
  }

  function boot() {
    installStyles();
    syncAdminCopy();
    bindPresetGridEditButtons();
    bindAdminSubmitOverride();
    wrapRenderPresets();
    wrapSetAdminUnlocked();
    observePresetGrid();
    renderPresets();
    if (isAdminUnlocked()) renderAdminPresetList();
    queuePresetEditInstall();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();