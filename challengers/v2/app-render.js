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

function chooseSubset(candidates, needed) {
  const maxPoint = Math.max(0, ...candidates.map((boss) => boss.points));
  const cap = needed + maxPoint;
  const dp = new Map([[0, []]]);
  candidates.forEach((boss) => {
    [...dp.entries()].forEach(([sum, list]) => {
      const next = sum + boss.points;
      if (next > cap) return;
      const proposed = [...list, boss];
      if (!dp.has(next) || proposed.length < dp.get(next).length) dp.set(next, proposed);
    });
  });
  return [...dp.entries()].filter(([sum]) => sum >= needed).sort((a, b) => a[1].length - b[1].length || a[0] - b[0])[0]?.[1] || [];
}

function stableRecommendation(currentIds, needed) {
  const selected = new Set(currentIds);
  const candidates = DATA.bossMissions.filter((boss) => !selected.has(boss.id));
  const bands = [...new Set(candidates.map((boss) => boss.points))].sort((a, b) => a - b);
  for (const band of bands) {
    const allowed = candidates.filter((boss) => boss.points <= band);
    if (allowed.reduce((sum, boss) => sum + boss.points, 0) < needed) continue;
    const subset = chooseSubset(allowed, needed);
    if (!subset.length) continue;
    const normalized = normalizeBosses([...currentIds, ...subset.map((boss) => boss.id)]);
    const addedIds = normalized.filter((id) => !selected.has(id));
    const added = bossPoints(addedIds);
    if (added >= needed) return { ids: addedIds, points: added, band };
  }
  return { ids: [], points: 0, band: 0 };
}

function renderRecommendation() {
  const profile = activeProfile();
  const target = DATA.tiers.find((tier) => tier.id === profile.targetTierId) || DATA.tiers[1];
  const current = levelPoints(profile.level) + bossPoints(profile.clearedBossIds);
  const needed = Math.max(0, target.threshold - current);
  if (!needed) {
    recommendationIds = [];
    el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)} 포인트 기준 달성</h3><p>현재 총점이 목표 이상입니다. 더 높은 티어를 선택해 보세요.</p>`;
    el.applyRecommendationButton.disabled = true;
    return;
  }
  const result = stableRecommendation(profile.clearedBossIds, needed);
  recommendationIds = result.ids;
  if (!result.ids.length) {
    el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3><p>현재 입력된 보스 데이터만으로는 목표에 도달하지 못합니다. 레벨 또는 상위 미션 데이터가 더 필요합니다.</p>`;
    el.applyRecommendationButton.disabled = true;
    return;
  }
  const targets = collapseTargets(result.ids);
  const list = targets.map(({ target: boss, missionCount, points }) => `<li><span>${escapeHtml(boss.shortBoss || boss.boss)} ${escapeHtml(boss.difficulty)}${missionCount > 1 ? ` · 하위 ${missionCount - 1}개 포함` : ''}</span><strong>+${number.format(points)}</strong></li>`).join('');
  el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)} 안정형 추천</h3><p>최고 ${number.format(result.band)}점 난이도 안에서 실제 격파 ${targets.length}종을 추가합니다. 적용 예상 총점은 ${number.format(current + result.points)}점입니다.</p><ul class="recommendation-list">${list}</ul>`;
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
