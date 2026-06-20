(function () {
  'use strict';

  const DATA = window.CHALLENGERS_DATA;
  if (!DATA) throw new Error('챌린저스 데이터를 불러오지 못했습니다.');

  const STORAGE_KEY = 'kiraki-challengers-calculator:v1';
  const VERSION = 1;
  const number = new Intl.NumberFormat('ko-KR');
  const byId = new Map(DATA.bossMissions.map((boss) => [boss.id, boss]));
  const bySeries = new Map();
  let recommendationIds = [];
  let saveTimer = null;
  let levelTimer = null;
  let toastTimer = null;

  DATA.bossMissions.forEach((boss) => {
    if (!bySeries.has(boss.series)) bySeries.set(boss.series, []);
    bySeries.get(boss.series).push(boss);
  });
  bySeries.forEach((bosses) => bosses.sort((a, b) => a.rank - b.rank));

  const el = {
    profileSelect: document.querySelector('#profileSelect'),
    addProfileButton: document.querySelector('#addProfileButton'),
    renameProfileButton: document.querySelector('#renameProfileButton'),
    deleteProfileButton: document.querySelector('#deleteProfileButton'),
    exportButton: document.querySelector('#exportButton'),
    importInput: document.querySelector('#importInput'),
    saveStatus: document.querySelector('#saveStatus'),
    resetProgressButton: document.querySelector('#resetProgressButton'),
    levelInput: document.querySelector('#levelInput'),
    levelMissionSummary: document.querySelector('#levelMissionSummary'),
    levelPoints: document.querySelector('#levelPoints'),
    bossPoints: document.querySelector('#bossPoints'),
    totalPoints: document.querySelector('#totalPoints'),
    currentTierName: document.querySelector('#currentTierName'),
    nextTierCopy: document.querySelector('#nextTierCopy'),
    tierProgressFill: document.querySelector('#tierProgressFill'),
    tierScale: document.querySelector('#tierScale'),
    targetTierSelect: document.querySelector('#targetTierSelect'),
    recommendationResult: document.querySelector('#recommendationResult'),
    applyRecommendationButton: document.querySelector('#applyRecommendationButton'),
    presetGrid: document.querySelector('#presetGrid'),
    bossGroups: document.querySelector('#bossGroups'),
    clearBossesButton: document.querySelector('#clearBossesButton'),
    toast: document.querySelector('#toast')
  };

  const canStore = (() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}:test`, '1');
      localStorage.removeItem(`${STORAGE_KEY}:test`);
      return true;
    } catch {
      return false;
    }
  })();

  const makeId = () => window.crypto?.randomUUID?.() || `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const escapeHtml = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function defaultProfile(name = '첫 캐릭터') {
    return { id: makeId(), name, level: 260, clearedBossIds: [], targetTierId: 'silver', updatedAt: new Date().toISOString() };
  }

  function normalizeBosses(ids) {
    const selected = new Set(ids.filter((id) => byId.has(id)));
    [...selected].forEach((id) => {
      const boss = byId.get(id);
      (bySeries.get(boss.series) || []).forEach((candidate) => {
        if (candidate.rank < boss.rank) selected.add(candidate.id);
      });
    });
    return [...selected];
  }

  function sanitizeProfile(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const validIds = Array.isArray(raw.clearedBossIds) ? raw.clearedBossIds.filter((id) => byId.has(id)) : [];
    return {
      id: typeof raw.id === 'string' && raw.id ? raw.id : makeId(),
      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 30) : '캐릭터',
      level: clamp(Math.round(Number(raw.level) || 260), 260, 290),
      clearedBossIds: normalizeBosses([...new Set(validIds)]),
      targetTierId: DATA.tiers.some((tier) => tier.id === raw.targetTierId) ? raw.targetTierId : 'silver',
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString()
    };
  }

  function loadStore() {
    try {
      if (!canStore) throw new Error('storage disabled');
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || parsed.version !== VERSION || !Array.isArray(parsed.profiles)) throw new Error('invalid');
      const profiles = parsed.profiles.map(sanitizeProfile).filter(Boolean);
      if (!profiles.length) throw new Error('empty');
      return {
        version: VERSION,
        profiles,
        activeProfileId: profiles.some((profile) => profile.id === parsed.activeProfileId)
          ? parsed.activeProfileId
          : profiles[0].id
      };
    } catch {
      const profile = defaultProfile();
      return { version: VERSION, profiles: [profile], activeProfileId: profile.id };
    }
  }

  let store = loadStore();

  function activeProfile() {
    return store.profiles.find((profile) => profile.id === store.activeProfileId) || store.profiles[0];
  }

  function save(message = '자동 저장됨') {
    if (!canStore) {
      el.saveStatus.textContent = '브라우저 저장 제한';
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      el.saveStatus.textContent = message;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { el.saveStatus.textContent = '자동 저장 켜짐'; }, 1400);
    } catch {
      el.saveStatus.textContent = '저장 실패 · 백업 권장';
    }
  }

  function patchProfile(patch, message) {
    Object.assign(activeProfile(), patch, { updatedAt: new Date().toISOString() });
    save(message);
  }

  function levelPoints(level) {
    return DATA.levelMissions
      .filter((mission) => mission.level <= level)
      .reduce((sum, mission) => sum + mission.points, 0);
  }

  function bossPoints(ids) {
    return [...new Set(ids)].reduce((sum, id) => sum + (byId.get(id)?.points || 0), 0);
  }

  function tierState(total) {
    const current = DATA.tiers.filter((tier) => total >= tier.threshold).at(-1) || null;
    const next = DATA.tiers.find((tier) => total < tier.threshold) || null;
    return { current, next };
  }

  function removeBossAndHigher(ids, removedId) {
    const removed = byId.get(removedId);
    if (!removed) return ids.filter((id) => id !== removedId);
    return ids.filter((id) => {
      const boss = byId.get(id);
      return boss && (boss.series !== removed.series || boss.rank < removed.rank);
    });
  }

  function collapseTargets(ids) {
    const grouped = new Map();
    [...new Set(ids)].forEach((id) => {
      const boss = byId.get(id);
      if (!boss) return;
      if (!grouped.has(boss.series)) grouped.set(boss.series, []);
      grouped.get(boss.series).push(boss);
    });
    return [...grouped.values()].map((bosses) => {
      bosses.sort((a, b) => a.rank - b.rank);
      return {
        target: bosses.at(-1),
        missionCount: bosses.length,
        points: bosses.reduce((sum, boss) => sum + boss.points, 0)
      };
    }).sort((a, b) => a.target.points - b.target.points || a.target.boss.localeCompare(b.target.boss, 'ko'));
  }

  function presetBossIds(preset) {
    return normalizeBosses([
      ...DATA.bossMissions.filter((boss) => boss.points <= preset.includeAtOrBelow).map((boss) => boss.id),
      ...preset.extraBossIds
    ]);
  }

  function buildStaticUi() {
    el.tierScale.innerHTML = DATA.tiers
      .map((tier) => `<span title="${number.format(tier.threshold)}점">${escapeHtml(tier.name)}</span>`)
      .join('');

    el.targetTierSelect.innerHTML = DATA.tiers
      .map((tier) => `<option value="${tier.id}">${escapeHtml(tier.name)} · ${number.format(tier.threshold)}</option>`)
      .join('');

    const groups = new Map();
    DATA.bossMissions.forEach((boss) => {
      if (!groups.has(boss.points)) groups.set(boss.points, []);
      groups.get(boss.points).push(boss);
    });
    el.bossGroups.innerHTML = [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([points, bosses]) => `
      <section class="boss-group">
        <div class="boss-group-header">
          <h3>${number.format(points)}점 난이도</h3>
          <span>${bosses.length}개 미션 · 동 난이도 취급</span>
        </div>
        <div class="boss-card-grid">
          ${bosses.map((boss) => `
            <label class="boss-check" data-boss-card="${boss.id}">
              <input type="checkbox" value="${boss.id}" data-boss-checkbox />
              <span class="boss-copy">
                <strong>${escapeHtml(boss.shortBoss || boss.boss)}</strong>
                <span>${escapeHtml(boss.difficulty)} · ${number.format(boss.points)}점</span>
              </span>
            </label>`).join('')}
        </div>
      </section>`).join('');

    el.presetGrid.innerHTML = DATA.presets.map((preset) => {
      const ids = presetBossIds(preset);
      const targets = collapseTargets(ids);
      const total = levelPoints(preset.level) + bossPoints(ids);
      const tier = DATA.tiers.find((item) => item.id === preset.tierId);
      const reference = preset.status === 'reference';
      return `
        <article class="preset-card${reference ? ' reference' : ''}">
          <div class="preset-topline">
            <span class="preset-tier">${escapeHtml(tier?.name || '')}</span>
            <span class="preset-status${reference ? ' reference' : ''}">${reference ? '기준 확정' : '조정 초안'}</span>
          </div>
          <h3>${escapeHtml(preset.name)}</h3>
          <p class="preset-summary">${escapeHtml(preset.summary)}</p>
          <p class="preset-target-count">실제 격파 ${targets.length}종 · 완료 미션 ${ids.length}개</p>
          <div class="preset-score-row">
            <span>Lv.${preset.level} · 보스 ${number.format(bossPoints(ids))}</span>
            <strong>${number.format(total)}점</strong>
          </div>
          <p class="preset-note">${escapeHtml(preset.note)}</p>
          <button type="button" class="button ${reference ? 'primary' : 'secondary'}" data-apply-preset="${preset.id}">이 빌드 적용</button>
        </article>`;
    }).join('');
  }

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
    el.currentTierName.textContent = current?.name || '미달성';

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
    return [...dp.entries()]
      .filter(([sum]) => sum >= needed)
      .sort((a, b) => a[1].length - b[1].length || a[0] - b[0])[0]?.[1] || [];
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
    const list = targets.map(({ target: boss, missionCount, points }) => `
      <li>
        <span>${escapeHtml(boss.shortBoss || boss.boss)} ${escapeHtml(boss.difficulty)}${missionCount > 1 ? ` · 하위 ${missionCount - 1}개 포함` : ''}</span>
        <strong>+${number.format(points)}</strong>
      </li>`).join('');

    el.recommendationResult.innerHTML = `
      <h3>${escapeHtml(target.name)} 안정형 추천</h3>
      <p>최고 ${number.format(result.band)}점 난이도 안에서 실제 격파 ${targets.length}종, 완료 미션 ${result.ids.length}개를 추가합니다. 적용 예상 총점은 ${number.format(current + result.points)}점입니다.</p>
      <ul class="recommendation-list">${list}</ul>`;
    el.applyRecommendationButton.disabled = false;
  }

  function render() {
    const profile = activeProfile();
    profile.clearedBossIds = normalizeBosses(profile.clearedBossIds);
    renderProfiles();
    el.levelInput.value = profile.level;
    el.targetTierSelect.value = profile.targetTierId;
    const selected = new Set(profile.clearedBossIds);
    document.querySelectorAll('[data-boss-checkbox]').forEach((checkbox) => {
      checkbox.checked = selected.has(checkbox.value);
      checkbox.closest('.boss-check')?.classList.toggle('checked', checkbox.checked);
    });
    renderSummary();
    renderRecommendation();
  }

  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('visible'), 2200);
  }

  function exportBackup() {
    const payload = { app: 'kiraki-challengers-calculator', exportedAt: new Date().toISOString(), dataVersion: DATA.version, store };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `challengers-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast('진행도 백업 파일을 저장했습니다.');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.app !== 'kiraki-challengers-calculator' || !Array.isArray(parsed.store?.profiles)) throw new Error('지원하지 않는 백업 형식입니다.');
      const profiles = parsed.store.profiles.map(sanitizeProfile).filter(Boolean);
      if (!profiles.length) throw new Error('불러올 캐릭터가 없습니다.');
      if (!window.confirm(`백업의 캐릭터 ${profiles.length}개로 현재 저장 내용을 교체할까요?`)) return;
      store = {
        version: VERSION,
        profiles,
        activeProfileId: profiles.some((profile) => profile.id === parsed.store.activeProfileId) ? parsed.store.activeProfileId : profiles[0].id
      };
      save('백업 불러옴');
      render();
      toast('진행도 백업을 불러왔습니다.');
    } catch (error) {
      toast(error instanceof Error ? error.message : '백업을 불러오지 못했습니다.');
    }
  }

  function bindEvents() {
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
      const ids = checkbox.checked
        ? normalizeBosses([...profile.clearedBossIds, checkbox.value])
        : removeBossAndHigher(profile.clearedBossIds, checkbox.value);
      patchProfile({ clearedBossIds: ids }, checkbox.checked ? '미션 저장됨' : '미션 해제됨');
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

    el.presetGrid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-apply-preset]');
      if (!button) return;
      const preset = DATA.presets.find((item) => item.id === button.dataset.applyPreset);
      if (!preset || !window.confirm(`${preset.name}을 적용할까요? 기존 레벨과 보스 체크가 교체됩니다.`)) return;
      patchProfile({ level: preset.level, clearedBossIds: presetBossIds(preset), targetTierId: preset.tierId }, '프리셋 적용됨');
      render();
      toast(`${preset.name}을 적용했습니다.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    el.clearBossesButton.addEventListener('click', () => {
      if (!window.confirm('현재 캐릭터의 보스 체크를 모두 해제할까요?')) return;
      patchProfile({ clearedBossIds: [] }, '보스 체크 해제됨');
      render();
    });

    el.resetProgressButton.addEventListener('click', () => {
      if (!window.confirm(`${activeProfile().name}의 진행도를 초기화할까요?`)) return;
      patchProfile({ level: 260, clearedBossIds: [], targetTierId: 'silver' }, '진행도 초기화됨');
      render();
    });

    el.exportButton.addEventListener('click', exportBackup);
    el.importInput.addEventListener('change', importBackup);
  }

  buildStaticUi();
  bindEvents();
  render();
  save('자동 저장 켜짐');
})();
