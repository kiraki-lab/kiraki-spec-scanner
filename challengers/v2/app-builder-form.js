function updateAdminDraftUi() {
  adminDraftBossIds = normalizeBosses(adminDraftBossIds);
  const selected = new Set(adminDraftBossIds);
  document.querySelectorAll('[data-admin-boss-checkbox]').forEach((checkbox) => {
    checkbox.checked = selected.has(checkbox.value);
    checkbox.closest('.admin-boss-check')?.classList.toggle('checked', checkbox.checked);
  });
  const targets = collapseTargets(adminDraftBossIds);
  const bossScore = bossPoints(adminDraftBossIds);
  const level = clamp(Math.round(Number(el.adminPresetLevel.value) || 260), 260, 290);
  const total = levelPoints(level) + bossScore;
  const target = DATA.tiers.find((tier) => tier.id === el.adminPresetTier.value);
  const gap = target ? total - target.threshold : 0;
  el.adminBossSummary.textContent = `실제 격파 ${targets.length}종 · 완료 미션 ${adminDraftBossIds.length}개 · ${number.format(bossScore)}점`;
  el.adminPresetTotal.textContent = `예상 총점 ${number.format(total)}점${target ? ` · ${target.name} ${gap >= 0 ? `+${number.format(gap)}` : number.format(gap)}` : ''}`;
}

function renderAdminPresetList() {
  if (!store.customPresets.length) {
    el.adminPresetList.innerHTML = '<div class="empty-state">관리자가 추가한 빌드가 아직 없습니다.</div>';
    return;
  }
  el.adminPresetList.innerHTML = store.customPresets.map((preset) => {
    const type = typeById.get(preset.type);
    const tier = DATA.tiers.find((item) => item.id === preset.tierId);
    const total = levelPoints(preset.level) + bossPoints(preset.bossIds);
    return `
      <article class="admin-preset-row">
        <div><strong>${escapeHtml(preset.name)}</strong><span>${escapeHtml(type?.name || '직접 설계')} · ${escapeHtml(tier?.name || '')} · Lv.${preset.level} · ${number.format(total)}점</span></div>
        <div class="admin-row-actions"><button type="button" class="button ghost small" data-admin-edit="${escapeHtml(preset.id)}">편집</button><button type="button" class="button ghost small danger-text" data-admin-delete="${escapeHtml(preset.id)}">삭제</button></div>
      </article>`;
  }).join('');
}

function saveAdminPreset(event) {
  event.preventDefault();
  const name = el.adminPresetName.value.trim();
  if (!name) return;
  const editingId = el.adminPresetId.value;
  const existing = editingId ? adminPresetById(editingId) : null;
  const level = clamp(Math.round(Number(el.adminPresetLevel.value) || 260), 260, 290);
  const type = typeById.has(el.adminPresetType.value) ? el.adminPresetType.value : 'custom';
  const tierId = DATA.tiers.some((tier) => tier.id === el.adminPresetTier.value) ? el.adminPresetTier.value : 'bronze';
  const targets = collapseTargets(adminDraftBossIds);
  const preset = sanitizeCustomPreset({
    id: existing?.id || makeId('build'),
    name,
    type,
    tierId,
    level,
    bossIds: adminDraftBossIds,
    summary: el.adminPresetSummary.value.trim() || `Lv.${level} + 보스 ${targets.length}종`,
    note: el.adminPresetNote.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  if (!preset) return;
  if (existing) store.customPresets = store.customPresets.map((item) => item.id === existing.id ? preset : item);
  else store.customPresets.push(preset);
  save(existing ? '관리자 빌드 수정됨' : '관리자 빌드 추가됨');
  renderPresets();
  renderAdminPresetList();
  const total = levelPoints(preset.level) + bossPoints(preset.bossIds);
  const target = DATA.tiers.find((tier) => tier.id === preset.tierId);
  toast(`${preset.name} 저장 완료${target && total < target.threshold ? ' · 목표 점수보다 낮습니다.' : ''}`);
  resetAdminForm(false);
}

function exportAdminBuilds() {
  exportJson({ app: 'kiraki-challengers-custom-builds', exportedAt: new Date().toISOString(), dataVersion: DATA.version, customPresets: store.customPresets }, `challengers-custom-builds-${new Date().toISOString().slice(0, 10)}.json`);
  toast('관리자 빌드 JSON을 저장했습니다.');
}
