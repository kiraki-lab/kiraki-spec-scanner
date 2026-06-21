function isAdminUnlocked() {
  try { return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'; } catch { return false; }
}

function setAdminUnlocked(unlocked) {
  try {
    if (unlocked) sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    else sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
  const gate = document.querySelector('#adminGate');
  const editor = document.querySelector('#adminEditor');
  if (gate) gate.hidden = unlocked;
  if (editor) editor.hidden = !unlocked;
  if (el.adminOpenButton) el.adminOpenButton.textContent = unlocked ? '관리자 열림' : '관리자 모드';
  if (typeof renderPresets === 'function') renderPresets();
}

async function digestText(value) {
  if (!window.crypto?.subtle) return '';
  const bytes = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyAdminAccess(event) {
  event.preventDefault();
  const input = document.querySelector('#adminGateInput');
  const error = document.querySelector('#adminGateError');
  const value = input?.value.trim() || '';
  const matched = await digestText(value) === ADMIN_KEY_HASH;
  if (!matched) {
    if (error) error.textContent = '비밀번호가 맞지 않습니다.';
    if (input) { input.select(); input.focus(); }
    return;
  }
  if (error) error.textContent = '';
  if (input) input.value = '';
  setAdminUnlocked(true);
  resetAdminForm(false);
  renderAdminPresetList();
  toast('관리자 모드를 열었습니다.');
}

function openAdminDialog() {
  setAdminUnlocked(isAdminUnlocked());
  if (typeof el.adminDialog.showModal === 'function') el.adminDialog.showModal();
  else el.adminDialog.setAttribute('open', '');
  if (isAdminUnlocked()) {
    resetAdminForm(false);
    renderAdminPresetList();
  } else {
    setTimeout(() => document.querySelector('#adminGateInput')?.focus(), 30);
  }
}

function closeAdminDialog() {
  if (typeof el.adminDialog.close === 'function') el.adminDialog.close();
  else el.adminDialog.removeAttribute('open');
}

function adminPresetById(id) {
  return store.customPresets.find((preset) => preset.id === id) || null;
}

function resetAdminForm(useCurrent = false) {
  el.adminPresetId.value = '';
  el.adminPresetName.value = '';
  el.adminPresetType.value = 'boss';
  el.adminPresetTier.value = activeProfile().targetTierId || 'silver';
  el.adminPresetLevel.value = activeProfile().level;
  el.adminPresetSummary.value = '';
  el.adminPresetNote.value = '';
  adminDraftBossIds = useCurrent ? [...activeProfile().clearedBossIds] : [];
  el.adminSavePresetButton.textContent = '새 빌드 저장';
  updateAdminDraftUi();
}

function loadAdminPreset(preset) {
  el.adminPresetId.value = preset.id;
  el.adminPresetName.value = preset.name;
  el.adminPresetType.value = preset.type === 'hunting' ? 'hunting' : 'boss';
  el.adminPresetTier.value = preset.tierId;
  el.adminPresetLevel.value = preset.level;
  el.adminPresetSummary.value = preset.summary || '';
  el.adminPresetNote.value = preset.note || '';
  adminDraftBossIds = [...preset.bossIds];
  el.adminSavePresetButton.textContent = '빌드 수정 저장';
  updateAdminDraftUi();
  el.adminPresetName.focus();
}

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
    const type = typeById.get(preset.type) || typeById.get('boss');
    const tier = DATA.tiers.find((item) => item.id === preset.tierId);
    const total = levelPoints(preset.level) + bossPoints(preset.bossIds);
    return `
      <article class="admin-preset-row">
        <div><strong>${escapeHtml(preset.name)}</strong><span>${escapeHtml(type?.name || '보스 빌드')} · ${escapeHtml(tier?.name || '')} · Lv.${preset.level} · ${number.format(total)}점</span></div>
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
  const type = el.adminPresetType.value === 'hunting' ? 'hunting' : 'boss';
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
