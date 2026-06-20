function applyPreset(preset) {
  if (!preset) return;
  if (!window.confirm(`${preset.name}을 적용할까요? 기존 레벨과 보스 체크가 교체됩니다.`)) return;
  patchProfile({ level: preset.level, clearedBossIds: presetBossIds(preset), targetTierId: preset.tierId }, '프리셋 적용됨');
  render();
  setView('dashboard', { scroll: true });
  toast(`${preset.name}을 적용했습니다.`);
}

function bindEvents() {
  document.querySelectorAll('[data-view-button]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.viewButton)));
  document.querySelectorAll('[data-go-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.goView, { scroll: true })));

  el.profileSelect.addEventListener('change', () => {
    store.activeProfileId = el.profileSelect.value;
    save('캐릭터 전환됨');
    render();
  });

  el.addProfileButton.addEventListener('click', () => {
    const name = window.prompt('새 캐릭터 이름을 입력하세요.', `캐릭터 ${store.profiles.length + 1}`)?.trim();
    if (!name) return;
    const profile = defaultProfile(name.slice(0, 30));
    store.profiles.push(profile);
    store.activeProfileId = profile.id;
    save('새 캐릭터 생성됨');
    render();
  });

  el.renameProfileButton.addEventListener('click', () => {
    const name = window.prompt('캐릭터 이름을 변경하세요.', activeProfile().name)?.trim();
    if (!name) return;
    patchProfile({ name: name.slice(0, 30) }, '이름 변경됨');
    renderProfiles();
  });

  el.deleteProfileButton.addEventListener('click', () => {
    if (store.profiles.length === 1) return toast('캐릭터는 최소 1개가 필요합니다.');
    const profile = activeProfile();
    if (!window.confirm(`${profile.name} 진행도를 삭제할까요?`)) return;
    store.profiles = store.profiles.filter((item) => item.id !== profile.id);
    store.activeProfileId = store.profiles[0].id;
    save('캐릭터 삭제됨');
    render();
  });

  el.levelInput.addEventListener('input', () => {
    const value = Number(el.levelInput.value);
    if (!Number.isFinite(value)) return;
    activeProfile().level = clamp(Math.round(value), 260, 290);
    renderSummary();
    renderRecommendation();
    clearTimeout(levelTimer);
    levelTimer = setTimeout(() => save('레벨 자동 저장됨'), 450);
  });

  el.levelInput.addEventListener('change', () => {
    clearTimeout(levelTimer);
    const level = clamp(Math.round(Number(el.levelInput.value) || 260), 260, 290);
    patchProfile({ level }, '레벨 저장됨');
    render();
  });

  el.bossGroups.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-boss-checkbox]');
    if (!checkbox) return;
    const profile = activeProfile();
    const ids = checkbox.checked ? normalizeBosses([...profile.clearedBossIds, checkbox.value]) : removeBossAndHigher(profile.clearedBossIds, checkbox.value);
    patchProfile({ clearedBossIds: ids }, checkbox.checked ? '미션 저장됨' : '미션 해제됨');
    renderSummary();
    renderBosses();
    renderRecommendation();
  });

  el.bossRangeFilter.addEventListener('change', () => applyBossFilter(true));
  el.clearBossesButton.addEventListener('click', () => {
    if (!window.confirm('현재 캐릭터의 보스 체크를 모두 해제할까요?')) return;
    patchProfile({ clearedBossIds: [] }, '보스 체크 해제됨');
    render();
  });

  el.targetTierSelect.addEventListener('change', () => {
    patchProfile({ targetTierId: el.targetTierSelect.value }, '목표 저장됨');
    renderRecommendation();
  });

  el.applyRecommendationButton.addEventListener('click', () => {
    if (!recommendationIds.length) return;
    patchProfile({ clearedBossIds: normalizeBosses([...activeProfile().clearedBossIds, ...recommendationIds]) }, '추천 미션 적용됨');
    render();
    toast('추천 미션을 진행도에 적용했습니다.');
  });

  el.presetTypeFilter.addEventListener('change', renderPresets);
  el.presetTierFilter.addEventListener('change', renderPresets);
  el.presetGrid.addEventListener('click', (event) => {
    const applyButton = event.target.closest('[data-apply-preset]');
    if (applyButton) return applyPreset(allPresets().find((preset) => preset.id === applyButton.dataset.applyPreset));
    const editButton = event.target.closest('[data-edit-custom-preset]');
    if (!editButton || !isAdminUnlocked()) return;
    const preset = adminPresetById(editButton.dataset.editCustomPreset);
    if (!preset) return;
    openAdminDialog();
    loadAdminPreset(preset);
  });

  el.resetProgressButton.addEventListener('click', () => {
    if (!window.confirm(`${activeProfile().name}의 진행도를 초기화할까요?`)) return;
    patchProfile({ level: 260, clearedBossIds: [], targetTierId: 'silver' }, '진행도 초기화됨');
    render();
  });
  el.exportButton.addEventListener('click', exportBackup);
  el.importInput.addEventListener('change', importBackup);

  el.adminOpenButton.addEventListener('click', openAdminDialog);
  el.adminCloseButton.addEventListener('click', closeAdminDialog);
  el.adminDialog.addEventListener('click', (event) => { if (event.target === el.adminDialog) closeAdminDialog(); });
  document.querySelector('#adminGateForm')?.addEventListener('submit', verifyAdminAccess);
  el.adminLockButton.addEventListener('click', () => {
    setAdminUnlocked(false);
    document.querySelector('#adminGateError').textContent = '';
    document.querySelector('#adminGateInput').value = '';
    document.querySelector('#adminGateInput').focus();
    toast('관리자 모드를 잠갔습니다.');
  });

  el.adminPresetForm.addEventListener('submit', saveAdminPreset);
  el.adminBossPicker.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-admin-boss-checkbox]');
    if (!checkbox) return;
    adminDraftBossIds = checkbox.checked ? normalizeBosses([...adminDraftBossIds, checkbox.value]) : removeBossAndHigher(adminDraftBossIds, checkbox.value);
    updateAdminDraftUi();
  });
  el.adminPresetLevel.addEventListener('input', updateAdminDraftUi);
  el.adminPresetTier.addEventListener('change', updateAdminDraftUi);
  el.adminLoadCurrentButton.addEventListener('click', () => { adminDraftBossIds = [...activeProfile().clearedBossIds]; el.adminPresetLevel.value = activeProfile().level; updateAdminDraftUi(); });
  el.adminClearBossButton.addEventListener('click', () => { adminDraftBossIds = []; updateAdminDraftUi(); });
  el.adminResetFormButton.addEventListener('click', () => resetAdminForm(false));
  el.adminExportBuildsButton.addEventListener('click', exportAdminBuilds);
  el.adminPresetList.addEventListener('click', (event) => {
    const editButton = event.target.closest('[data-admin-edit]');
    if (editButton) {
      const preset = adminPresetById(editButton.dataset.adminEdit);
      if (preset) loadAdminPreset(preset);
      return;
    }
    const deleteButton = event.target.closest('[data-admin-delete]');
    if (!deleteButton) return;
    const preset = adminPresetById(deleteButton.dataset.adminDelete);
    if (!preset || !window.confirm(`${preset.name} 빌드를 삭제할까요?`)) return;
    store.customPresets = store.customPresets.filter((item) => item.id !== preset.id);
    save('관리자 빌드 삭제됨');
    renderPresets();
    renderAdminPresetList();
    if (el.adminPresetId.value === preset.id) resetAdminForm(false);
    toast('빌드를 삭제했습니다.');
  });
}

buildStaticUi();
bindEvents();
setAdminUnlocked(isAdminUnlocked());
render();
save('자동 저장 켜짐');
