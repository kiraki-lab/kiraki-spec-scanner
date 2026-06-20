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
  el.adminOpenButton.textContent = unlocked ? '관리자 열림' : '관리자 모드';
  renderPresets();
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
  el.adminPresetType.value = 'balanced';
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
  el.adminPresetType.value = preset.type;
  el.adminPresetTier.value = preset.tierId;
  el.adminPresetLevel.value = preset.level;
  el.adminPresetSummary.value = preset.summary || '';
  el.adminPresetNote.value = preset.note || '';
  adminDraftBossIds = [...preset.bossIds];
  el.adminSavePresetButton.textContent = '빌드 수정 저장';
  updateAdminDraftUi();
  el.adminPresetName.focus();
}
