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
  const type = typeById.has(el.adminPresetType.value) ? el.adminPresetType.value : 'boss';
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

(function streamlineCalculator() {
  const legacyProfile = activeProfile() || defaultProfile();
  legacyProfile.name = '이 계정';
  store.profiles = [legacyProfile];
  store.activeProfileId = legacyProfile.id;
  store.customPresets = store.customPresets.map((preset) => ({
    ...preset,
    type: preset.type === 'hunting' ? 'hunting' : 'boss'
  }));

  defaultProfile = function singleDefaultProfile() {
    return { id: makeId('profile'), name: '이 계정', level: 260, clearedBossIds: [], targetTierId: 'silver', updatedAt: new Date().toISOString() };
  };

  const baseSanitizeProfile = sanitizeProfile;
  sanitizeProfile = function singleSanitizeProfile(raw) {
    const profile = baseSanitizeProfile(raw);
    if (profile) profile.name = '이 계정';
    return profile;
  };

  const baseSanitizeCustomPreset = sanitizeCustomPreset;
  sanitizeCustomPreset = function twoTypeSanitizeCustomPreset(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return baseSanitizeCustomPreset({
      ...raw,
      type: raw.type === 'hunting' ? 'hunting' : 'boss'
    });
  };

  renderProfiles = function singleProgressRenderProfiles() {
    if (!el.profileSelect) return;
    const profile = activeProfile();
    el.profileSelect.innerHTML = `<option value="${escapeHtml(profile.id)}">현재 진행도</option>`;
  };

  const baseResetAdminForm = resetAdminForm;
  resetAdminForm = function twoTypeResetAdminForm(useCurrent = false) {
    baseResetAdminForm(useCurrent);
    if (el.adminPresetType) el.adminPresetType.value = 'boss';
  };

  const grid = document.querySelector('.input-hub-grid');
  const cards = [...document.querySelectorAll('.input-hub-grid > .input-card')];
  if (grid) grid.classList.add('single-progress-grid');
  if (cards[0]) {
    cards[0].hidden = true;
    cards[0].setAttribute('aria-hidden', 'true');
  }
  const remainingCards = cards.slice(1);
  remainingCards.forEach((card, index) => {
    card.querySelector('.step-number')?.replaceChildren(String(index + 1));
  });
  const inputTitle = document.querySelector('#inputHubTitle');
  const inputDescription = document.querySelector('.input-hub-heading > div > p:last-child');
  if (inputTitle) inputTitle.textContent = '레벨과 진행도 설정';
  if (inputDescription) inputDescription.textContent = '입력 내용은 이 브라우저에 하나의 진행도로 자동 저장됩니다.';

  function actionKey(action) {
    return action.target.id;
  }

  function compactRecommendationData(plans) {
    if (plans.length < 2) return null;
    const commonKeys = new Set(
      plans[0].actions
        .map(actionKey)
        .filter((key) => plans.every((plan) => plan.actions.some((action) => actionKey(action) === key)))
    );
    const commonActions = plans[0].actions.filter((action) => commonKeys.has(actionKey(action)));
    const choices = plans.map((plan, index) => ({
      index,
      plan,
      actions: plan.actions.filter((action) => !commonKeys.has(actionKey(action)))
    }));
    if (!choices.every((choice) => choice.actions.length === 1)) return null;
    return { commonActions, choices };
  }

  function compactChoiceHtml(choice, current) {
    const action = choice.actions[0];
    const selected = choice.index === selectedRecommendationIndex;
    const addedBosses = action.ids.map((id) => byId.get(id)).filter(Boolean).sort((a, b) => a.rank - b.rank);
    const lowerBosses = addedBosses.filter((boss) => boss.id !== action.target.id);
    const autoText = lowerBosses.length
      ? `<small>자동 포함: ${lowerBosses.map((boss) => escapeHtml(bossMissionName(boss))).join(' · ')}</small>`
      : '<small>추가 하위 미션 없음</small>';
    return `
      <article class="recommendation-plan recommendation-choice-card${selected ? ' selected' : ''}" data-recommendation-plan="${choice.index}">
        <div class="recommendation-choice-main">
          <span class="recommendation-choice-number">선택 ${choice.index + 1}</span>
          <strong>${escapeHtml(bossMissionName(action.target))}</strong>
          ${autoText}
        </div>
        <div class="recommendation-choice-score"><strong>+${number.format(action.points)}</strong><small>예상 ${number.format(current + choice.plan.points)}점</small></div>
        <button type="button" class="recommendation-plan-select" data-select-recommendation-plan="${choice.index}" aria-pressed="${selected}">${selected ? '선택됨' : '이 안 선택'}</button>
      </article>`;
  }

  renderRecommendation = function compactRecommendationRender() {
    const profile = activeProfile();
    const target = DATA.tiers.find((tier) => tier.id === profile.targetTierId) || DATA.tiers[1];
    const current = levelPoints(profile.level) + bossPoints(profile.clearedBossIds);
    const needed = Math.max(0, target.threshold - current);

    if (!needed) {
      recommendationIds = [];
      recommendationOptions = [];
      selectedRecommendationIndex = 0;
      el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)} 포인트 기준 달성</h3><p>현재 총점이 목표 이상입니다. 더 높은 티어를 선택해 보세요.</p>`;
      el.applyRecommendationButton.textContent = '추천 적용';
      el.applyRecommendationButton.disabled = true;
      return;
    }

    const plans = buildRecommendationPlans(profile.clearedBossIds, needed, 3);
    recommendationOptions = plans;
    selectedRecommendationIndex = 0;
    recommendationIds = plans[0]?.ids || [];

    if (!plans.length) {
      el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3><p>현재 입력된 보스 데이터만으로는 목표에 도달하지 못합니다. 레벨 또는 상위 미션 데이터가 더 필요합니다.</p>`;
      el.applyRecommendationButton.textContent = '추천 적용';
      el.applyRecommendationButton.disabled = true;
      return;
    }

    const compact = compactRecommendationData(plans);
    if (compact) {
      const commonHtml = compact.commonActions.length
        ? `<section class="recommendation-common"><div class="recommendation-subheading"><strong>공통으로 필요한 미션</strong><span>모든 선택안에 동일하게 들어갑니다.</span></div><ul class="recommendation-list">${compact.commonActions.map(recommendationActionHtml).join('')}</ul></section>`
        : '';
      el.recommendationResult.innerHTML = `
        <h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3>
        <p>겹치는 내용은 한 번만 표시했습니다. 아래 ${compact.choices.length}개 중 편한 보스 하나를 고르세요.</p>
        ${commonHtml}
        <section class="recommendation-choice-section">
          <div class="recommendation-subheading"><strong>마지막 1종 선택</strong><span>선택한 안만 진행도에 적용됩니다.</span></div>
          <div class="recommendation-choice-grid">${compact.choices.map((choice) => compactChoiceHtml(choice, current)).join('')}</div>
        </section>`;
      el.applyRecommendationButton.textContent = '선택안 적용';
      el.applyRecommendationButton.disabled = false;
      return;
    }

    const choiceCopy = plans.length > 1
      ? `아래 ${plans.length}가지 중 편한 조합을 선택할 수 있습니다.`
      : '필요한 미션을 정확한 이름으로 표시했습니다.';
    el.recommendationResult.innerHTML = `
      <h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3>
      <p>${choiceCopy} 상위 난이도 선택 시 자동 완료되는 하위 미션도 함께 적었습니다.</p>
      <div class="recommendation-plan-list">${plans.map((plan, index) => recommendationPlanHtml(plan, index, current)).join('')}</div>`;
    el.applyRecommendationButton.textContent = '추천안 1 적용';
    el.applyRecommendationButton.disabled = false;
  };

  importBackup = async function singleProgressImportBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.app !== 'kiraki-challengers-calculator' || !Array.isArray(parsed.store?.profiles)) throw new Error('지원하지 않는 백업 형식입니다.');
      const profiles = parsed.store.profiles.map(sanitizeProfile).filter(Boolean);
      const profile = profiles.find((item) => item.id === parsed.store.activeProfileId) || profiles[0];
      const customPresets = Array.isArray(parsed.store.customPresets) ? parsed.store.customPresets.map(sanitizeCustomPreset).filter(Boolean) : [];
      if (!profile) throw new Error('불러올 진행도가 없습니다.');
      if (!window.confirm(`백업의 진행도와 키라키 빌드 ${customPresets.length}개로 현재 저장 내용을 교체할까요?`)) return;
      store = { version: STORE_VERSION, profiles: [profile], customPresets, activeProfileId: profile.id };
      save('백업 불러옴');
      resetAdminForm(false);
      render();
      toast('백업을 불러왔습니다.');
    } catch (error) {
      toast(error instanceof Error ? error.message : '백업을 불러오지 못했습니다.');
    }
  };

  let barrierPatchQueued = false;
  function cumulativeBarrierChance(stage, rarityId) {
    const dataset = window.MYSTERY_BARRIER_DATA;
    if (!dataset) return 0;
    const start = dataset.rarities.findIndex((rarity) => rarity.id === rarityId);
    return dataset.rarities.slice(start).reduce((sum, rarity) => sum + stage.probabilities[rarity.id], 0);
  }

  function patchBarrierLabels() {
    barrierPatchQueued = false;
    const dataset = window.MYSTERY_BARRIER_DATA;
    const panel = document.querySelector('[data-view-panel="barrier"]');
    if (!dataset || !panel) return;

    const total = Number(String(document.querySelector('#totalPoints')?.textContent || '0').replace(/[^0-9-]/g, '')) || 0;
    const currentStage = [...dataset.stages].reverse().find((stage) => total >= stage.minPoints) || dataset.stages[0];
    const selectedButton = panel.querySelector('[data-barrier-stage].selected');
    const selectedStage = dataset.stages.find((stage) => stage.id === Number(selectedButton?.dataset.barrierStage)) || currentStage;

    const labelFor = (stage) => stage.recommendation?.label || `${dataset.rarities.find((rarity) => rarity.id === stage.recommendation?.gradeId)?.name || '에픽'} 이상`;
    const stretchLabelFor = (stage) => stage.recommendation?.stretchLabel || `${dataset.rarities.find((rarity) => rarity.id === stage.recommendation?.stretchGradeId)?.name || '유니크'} 이상`;

    const replacements = {
      barrierSyncText: '현재 진행도 · 포인트 계산 연동',
      barrierCurrentProfile: '현재 진행도',
      barrierRecommendationTitle: labelFor(currentStage),
      barrierStretchGoal: `${stretchLabelFor(currentStage)} · ${cumulativeBarrierChance(currentStage, currentStage.recommendation.stretchGradeId).toFixed(3)}%`
    };
    Object.entries(replacements).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node && node.textContent !== value) node.textContent = value;
    });

    panel.querySelectorAll('[data-barrier-stage]').forEach((button) => {
      const stage = dataset.stages.find((item) => item.id === Number(button.dataset.barrierStage));
      const label = button.querySelector('.barrier-stage-recommend strong');
      if (stage && label && label.textContent !== labelFor(stage)) label.textContent = labelFor(stage);
    });

    panel.querySelectorAll('.barrier-table tbody tr').forEach((row, index) => {
      const stage = dataset.stages[index];
      const label = row.querySelector('td:nth-child(3) strong');
      if (stage && label && label.textContent !== labelFor(stage)) label.textContent = labelFor(stage);
    });

    const guideLabels = panel.querySelectorAll('.barrier-guide-list strong');
    if (guideLabels[0] && guideLabels[0].textContent !== labelFor(selectedStage)) guideLabels[0].textContent = labelFor(selectedStage);
    if (guideLabels[1] && guideLabels[1].textContent !== stretchLabelFor(selectedStage)) guideLabels[1].textContent = stretchLabelFor(selectedStage);
  }

  function queueBarrierPatch() {
    if (barrierPatchQueued) return;
    barrierPatchQueued = true;
    requestAnimationFrame(patchBarrierLabels);
  }

  new MutationObserver(queueBarrierPatch).observe(document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener('load', queueBarrierPatch, { once: true });

  save('단일 진행도 적용됨');
})();
