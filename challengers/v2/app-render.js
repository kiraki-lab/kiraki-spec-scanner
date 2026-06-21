function renderProfiles() {
  const active = activeProfile();
  el.profileSelect.innerHTML = store.profiles.map((profile) =>
    `<option value="${escapeHtml(profile.id)}"${profile.id === active.id ? ' selected' : ''}>${escapeHtml(profile.name)}</option>`
  ).join('');
}

function renderSummary() {
  const profile = activeProfile();
  const levelScore = levelPoints(profile.level);
  const bossScore = bossPoints(profile.clearedBossIds);
  const total = levelScore + bossScore;
  const { current, next } = tierState(total);
  el.levelMissionSummary.textContent = `Lv.${profile.level}까지 완료`;
  el.levelPoints.textContent = number.format(levelScore);
  el.bossPoints.textContent = number.format(bossScore);
  el.totalPoints.textContent = number.format(total);
  el.toolbarTotalPoints.textContent = number.format(total);
  el.currentTierName.textContent = current?.name || '미달성';
  el.toolbarTierName.textContent = current?.name || '미달성';
  if (next) {
    el.nextTierCopy.textContent = `${next.name}까지 ${number.format(next.threshold - total)}점`;
    const previous = current?.threshold || 0;
    const progress = ((total - previous) / (next.threshold - previous)) * 100;
    el.tierProgressFill.style.width = `${clamp(progress, 0, 100)}%`;
  } else {
    el.nextTierCopy.textContent = '최고 포인트 티어 도달';
    el.tierProgressFill.style.width = '100%';
  }
}

function renderBosses(forceOpen = false) {
  const selected = new Set(activeProfile().clearedBossIds);
  document.querySelectorAll('[data-boss-checkbox]').forEach((checkbox) => {
    checkbox.checked = selected.has(checkbox.value);
    checkbox.closest('.boss-check')?.classList.toggle('checked', checkbox.checked);
  });
  document.querySelectorAll('[data-boss-group]').forEach((group) => {
    const points = Number(group.dataset.points);
    const bosses = DATA.bossMissions.filter((boss) => boss.points === points);
    const completed = bosses.filter((boss) => selected.has(boss.id)).length;
    const meta = group.querySelector('[data-group-meta]');
    if (meta) meta.textContent = `${completed}/${bosses.length} 완료`;
  });
  applyBossFilter(forceOpen);
}

function groupMatchesFilter(group, selected, filter) {
  const points = Number(group.dataset.points);
  if (filter === 'low') return points <= 500;
  if (filter === 'mid') return points >= 1000 && points <= 3000;
  if (filter === 'high') return points >= 5000;
  if (filter === 'checked') return [...group.querySelectorAll('[data-boss-checkbox]')].some((checkbox) => selected.has(checkbox.value));
  return true;
}

function applyBossFilter(forceOpen = false) {
  const selected = new Set(activeProfile().clearedBossIds);
  const filter = el.bossRangeFilter.value;
  const visible = [];
  document.querySelectorAll('[data-boss-group]').forEach((group) => {
    const show = groupMatchesFilter(group, selected, filter);
    group.hidden = !show;
    if (show) visible.push(group);
    else group.open = false;
  });
  el.bossEmptyState.hidden = visible.length > 0;
  if (forceOpen && visible.length) visible.forEach((group, index) => { group.open = index === 0; });
}

function renderPresets() {
  const typeFilter = el.presetTypeFilter.value || 'all';
  const tierFilter = el.presetTierFilter.value || 'all';
  const presets = allPresets().filter((preset) =>
    (typeFilter === 'all' || preset.type === typeFilter) && (tierFilter === 'all' || preset.tierId === tierFilter)
  );
  el.presetEmptyState.hidden = presets.length > 0;
  el.presetGrid.innerHTML = presets.map((preset) => {
    const ids = presetBossIds(preset);
    const targets = collapseTargets(ids);
    const levelScore = levelPoints(preset.level);
    const bossScore = bossPoints(ids);
    const total = levelScore + bossScore;
    const tier = DATA.tiers.find((item) => item.id === preset.tierId);
    const type = typeById.get(preset.type) || typeById.get('custom');
    const reference = preset.status === 'reference';
    const custom = preset.status === 'custom';
    const statusText = reference ? '기준 확정' : custom ? '관리자 추가' : '조정 초안';
    const autoSummary = `Lv.${preset.level} + 보스 ${targets.length}종`;
    return `
      <article class="preset-card${reference ? ' reference' : ''}${custom ? ' admin-added' : ''}">
        <div class="preset-topline"><span class="type-badge ${escapeHtml(preset.type || 'custom')}">${escapeHtml(type?.name || '직접 설계')}</span><span class="status-badge${reference ? ' reference' : ''}${custom ? ' custom' : ''}">${statusText}</span></div>
        <h3>${escapeHtml(preset.name)}</h3>
        <p class="preset-summary">${escapeHtml(preset.summary || autoSummary)}</p>
        <p class="preset-target-count">${escapeHtml(tier?.name || '')} 목표 · 실제 격파 ${targets.length}종 · 완료 미션 ${ids.length}개</p>
        <div class="preset-score-row"><span>레벨 ${number.format(levelScore)} + 보스 ${number.format(bossScore)}</span><strong>${number.format(total)}점</strong></div>
        <p class="preset-note">${escapeHtml(preset.note || type?.description || '')}</p>
        <div class="preset-actions"><button type="button" class="button ${reference ? 'primary' : 'secondary'} small" data-apply-preset="${escapeHtml(preset.id)}">이 빌드 적용</button>${custom && isAdminUnlocked() ? `<button type="button" class="button ghost small" data-edit-custom-preset="${escapeHtml(preset.id)}">편집</button>` : ''}</div>
      </article>`;
  }).join('');
}

function bossMissionName(boss) {
  return `${boss.difficulty} ${boss.shortBoss || boss.boss}`;
}

function recommendationActionGroups(currentIds) {
  const selected = new Set(currentIds);

  return [...bySeries.values()].map((bosses) => {
    const currentRank = Math.max(0, ...bosses.filter((boss) => selected.has(boss.id)).map((boss) => boss.rank));

    return bosses
      .filter((target) => target.rank > currentRank)
      .map((target) => {
        const ids = bosses
          .filter((boss) => boss.rank <= target.rank && !selected.has(boss.id))
          .map((boss) => boss.id);

        return {
          series: target.series,
          target,
          ids,
          points: bossPoints(ids),
          missionCount: ids.length
        };
      })
      .filter((action) => action.points > 0);
  }).filter((options) => options.length);
}

function recommendationPlanSignature(actions) {
  return actions.map((action) => action.target.id).sort().join('|');
}

function compareRecommendationPlans(a, b, needed = 0) {
  return a.maxBand - b.maxBand
    || a.actions.length - b.actions.length
    || (a.points - needed) - (b.points - needed)
    || a.missionCount - b.missionCount
    || a.signature.localeCompare(b.signature);
}

function addRecommendationState(states, sum, plan, maxPlansPerSum = 6) {
  const plans = states.get(sum) || [];
  if (plans.some((item) => item.signature === plan.signature)) return;
  plans.push(plan);
  plans.sort((a, b) => compareRecommendationPlans(a, b));
  if (plans.length > maxPlansPerSum) plans.length = maxPlansPerSum;
  states.set(sum, plans);
}

function buildRecommendationPlans(currentIds, needed, limit = 4) {
  const groups = recommendationActionGroups(currentIds);
  const actions = groups.flat();
  if (!actions.length) return [];

  const maxActionPoints = Math.max(...actions.map((action) => action.points));
  const cap = needed + maxActionPoints;
  let states = new Map([[0, [{
    actions: [],
    ids: [],
    points: 0,
    maxBand: 0,
    missionCount: 0,
    signature: ''
  }]]]);

  groups.forEach((options) => {
    const nextStates = new Map();

    states.forEach((plans, sum) => {
      plans.forEach((plan) => {
        addRecommendationState(nextStates, sum, plan);

        options.forEach((action) => {
          const nextSum = sum + action.points;
          if (nextSum > cap) return;

          const nextActions = [...plan.actions, action];
          const nextPlan = {
            actions: nextActions,
            ids: [...plan.ids, ...action.ids],
            points: nextSum,
            maxBand: Math.max(plan.maxBand, action.target.points),
            missionCount: plan.missionCount + action.missionCount,
            signature: recommendationPlanSignature(nextActions)
          };
          addRecommendationState(nextStates, nextSum, nextPlan);
        });
      });
    });

    states = nextStates;
  });

  const candidates = [];
  states.forEach((plans, sum) => {
    if (sum < needed) return;
    plans.forEach((plan) => candidates.push(plan));
  });

  candidates.sort((a, b) => compareRecommendationPlans(a, b, needed));

  const selectedPlans = [];
  const signatures = new Set();
  candidates.forEach((plan) => {
    if (selectedPlans.length >= limit || signatures.has(plan.signature)) return;
    signatures.add(plan.signature);
    selectedPlans.push(plan);
  });
  return selectedPlans;
}

function recommendationActionHtml(action) {
  const addedBosses = action.ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank);
  const lowerBosses = addedBosses.filter((boss) => boss.id !== action.target.id);
  const lowerText = lowerBosses.length
    ? `<small>자동 포함: ${lowerBosses.map((boss) => escapeHtml(bossMissionName(boss))).join(' · ')}</small>`
    : '';

  return `
    <li class="recommendation-action-item">
      <span class="recommendation-action-copy">
        <strong>${escapeHtml(bossMissionName(action.target))}</strong>
        ${lowerText}
      </span>
      <strong class="recommendation-action-points">+${number.format(action.points)}</strong>
    </li>`;
}

function recommendationPlanHtml(plan, index, current) {
  const selected = index === selectedRecommendationIndex;
  const title = index === 0 ? '추천안 1' : `대체안 ${index + 1}`;
  const expected = current + plan.points;

  return `
    <article class="recommendation-plan${selected ? ' selected' : ''}" data-recommendation-plan="${index}">
      <div class="recommendation-plan-header">
        <div>
          <strong>${title}</strong>
          <small>최고 ${number.format(plan.maxBand)}점 난이도 · 실제 격파 ${plan.actions.length}종 · 완료 미션 ${plan.missionCount}개</small>
        </div>
        <span>예상 ${number.format(expected)}점</span>
      </div>
      <ul class="recommendation-list">${plan.actions.map(recommendationActionHtml).join('')}</ul>
      <button type="button" class="recommendation-plan-select" data-select-recommendation-plan="${index}" aria-pressed="${selected}">${selected ? '선택됨' : '이 안 선택'}</button>
    </article>`;
}

function compactRecommendationGroup(plans) {
  if (plans.length < 2) return null;
  const commonKeys = new Set(
    plans[0].actions
      .map((action) => action.target.id)
      .filter((key) => plans.every((plan) => plan.actions.some((action) => action.target.id === key)))
  );
  const commonActions = plans[0].actions.filter((action) => commonKeys.has(action.target.id));
  if (!commonActions.length) return null;

  const choices = plans.map((plan, index) => ({
    index,
    plan,
    actions: plan.actions.filter((action) => !commonKeys.has(action.target.id))
  }));
  if (!choices.every((choice) => choice.actions.length === 1)) return null;

  return {
    commonActions,
    choices,
    commonPoints: commonActions.reduce((sum, action) => sum + action.points, 0),
    commonMissionCount: commonActions.reduce((sum, action) => sum + action.missionCount, 0)
  };
}

function compactRecommendationChoiceHtml(choice, current) {
  const selected = choice.index === selectedRecommendationIndex;
  const action = choice.actions[0];
  const expected = current + choice.plan.points;

  return `
    <article class="recommendation-plan${selected ? ' selected' : ''}" data-recommendation-plan="${choice.index}">
      <div class="recommendation-plan-header">
        <div>
          <strong>${escapeHtml(bossMissionName(action.target))}</strong>
          <small>선택 보스 · 이 보스만 고르면 됩니다.</small>
        </div>
        <span>예상 ${number.format(expected)}점</span>
      </div>
      <ul class="recommendation-list">${recommendationActionHtml(action)}</ul>
      <button type="button" class="recommendation-plan-select" data-select-recommendation-plan="${choice.index}" aria-pressed="${selected}">${selected ? '선택됨' : '이 안 선택'}</button>
    </article>`;
}

function renderCompactRecommendation(target, needed, compact, current) {
  const selectedPlan = compact.choices.find((choice) => choice.index === selectedRecommendationIndex)?.plan || compact.choices[0].plan;
  const expected = current + selectedPlan.points;

  el.recommendationResult.classList.add('recommendation-merged');
  el.recommendationResult.innerHTML = `
    <h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3>
    <p>겹치는 보스는 한 번만 표시했습니다. 공통 미션을 잡고, 아래 선택 보스 중 하나만 고르면 됩니다.</p>
    <div class="recommendation-plan-list">
      <article class="recommendation-plan recommendation-common-plan">
        <div class="recommendation-plan-header">
          <div>
            <strong>공통 미션</strong>
            <small>모든 선택안 공통 · 완료 미션 ${compact.commonMissionCount}개</small>
          </div>
          <span>+${number.format(compact.commonPoints)}</span>
        </div>
        <ul class="recommendation-list">${compact.commonActions.map(recommendationActionHtml).join('')}</ul>
      </article>
      <div class="recommendation-plan-list">${compact.choices.map((choice) => compactRecommendationChoiceHtml(choice, current)).join('')}</div>
    </div>`;
  el.applyRecommendationButton.textContent = `선택안 적용 · 예상 ${number.format(expected)}점`;
  el.applyRecommendationButton.disabled = false;
}

function renderRecommendation() {
  const profile = activeProfile();
  const target = DATA.tiers.find((tier) => tier.id === profile.targetTierId) || DATA.tiers[1];
  const current = levelPoints(profile.level) + bossPoints(profile.clearedBossIds);
  const needed = Math.max(0, target.threshold - current);

  if (!needed) {
    recommendationIds = [];
    recommendationOptions = [];
    selectedRecommendationIndex = 0;
    el.recommendationResult.classList.remove('recommendation-merged');
    el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)} 포인트 기준 달성</h3><p>현재 총점이 목표 이상입니다. 더 높은 티어를 선택해 보세요.</p>`;
    el.applyRecommendationButton.textContent = '추천 적용';
    el.applyRecommendationButton.disabled = true;
    return;
  }

  const plans = buildRecommendationPlans(profile.clearedBossIds, needed);
  recommendationOptions = plans;
  selectedRecommendationIndex = 0;
  recommendationIds = plans[0]?.ids || [];

  if (!plans.length) {
    el.recommendationResult.classList.remove('recommendation-merged');
    el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3><p>현재 입력된 보스 데이터만으로는 목표에 도달하지 못합니다. 레벨 또는 상위 미션 데이터가 더 필요합니다.</p>`;
    el.applyRecommendationButton.textContent = '추천 적용';
    el.applyRecommendationButton.disabled = true;
    return;
  }

  const compact = compactRecommendationGroup(plans);
  if (compact) {
    renderCompactRecommendation(target, needed, compact, current);
    return;
  }

  el.recommendationResult.classList.remove('recommendation-merged');
  const choiceCopy = plans.length > 1
    ? `아래 ${plans.length}가지 중 편한 조합을 선택할 수 있습니다.`
    : '필요한 미션을 정확한 이름으로 표시했습니다.';

  el.recommendationResult.innerHTML = `
    <h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3>
    <p>${choiceCopy} 상위 난이도 선택 시 자동 완료되는 하위 미션도 함께 적었습니다.</p>
    <div class="recommendation-plan-list">${plans.map((plan, index) => recommendationPlanHtml(plan, index, current)).join('')}</div>`;
  el.applyRecommendationButton.textContent = '추천안 1 적용';
  el.applyRecommendationButton.disabled = false;
}

function render() {
  const profile = activeProfile();
  profile.clearedBossIds = normalizeBosses(profile.clearedBossIds);
  renderProfiles();
  el.levelInput.value = profile.level;
  el.targetTierSelect.value = profile.targetTierId;
  renderSummary();
  renderBosses();
  renderRecommendation();
  renderPresets();
  if (isAdminUnlocked()) { renderAdminPresetList(); updateAdminDraftUi(); }
}

function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('visible'), 2200);
}

function exportJson(payload, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function exportBackup() {
  exportJson({ app: 'kiraki-challengers-calculator', exportedAt: new Date().toISOString(), dataVersion: DATA.version, store }, `challengers-progress-${new Date().toISOString().slice(0, 10)}.json`);
  toast('진행도와 관리자 빌드를 백업했습니다.');
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed?.app !== 'kiraki-challengers-calculator' || !Array.isArray(parsed.store?.profiles)) throw new Error('지원하지 않는 백업 형식입니다.');
    const profiles = parsed.store.profiles.map(sanitizeProfile).filter(Boolean);
    const customPresets = Array.isArray(parsed.store.customPresets) ? parsed.store.customPresets.map(sanitizeCustomPreset).filter(Boolean) : [];
    if (!profiles.length) throw new Error('불러올 캐릭터가 없습니다.');
    if (!window.confirm(`백업의 캐릭터 ${profiles.length}개와 관리자 빌드 ${customPresets.length}개로 현재 저장 내용을 교체할까요?`)) return;
    store = { version: STORE_VERSION, profiles, customPresets, activeProfileId: profiles.some((profile) => profile.id === parsed.store.activeProfileId) ? parsed.store.activeProfileId : profiles[0].id };
    save('백업 불러옴');
    resetAdminForm(false);
    render();
    toast('백업을 불러왔습니다.');
  } catch (error) { toast(error instanceof Error ? error.message : '백업을 불러오지 못했습니다.'); }
}
