(() => {
  const bossNameFilter = document.querySelector('#bossNameFilter');
  const bossNameOptions = document.querySelector('#bossNameOptions');
  const expandAllButton = document.querySelector('#expandAllBossesButton');
  const collapseAllButton = document.querySelector('#collapseAllBossesButton');
  const checkAllButton = document.querySelector('#checkAllBossesButton');
  const levelDecreaseButton = document.querySelector('#levelDecreaseButton');
  const levelIncreaseButton = document.querySelector('#levelIncreaseButton');

  const replaceModeWord = (value) => typeof value === 'string'
    ? value.replaceAll('관리자가 추가한', '키라키 모드에서 추가한').replaceAll('관리자', '키라키')
    : value;

  const originalToast = toast;
  toast = function patchedToast(message) {
    return originalToast(replaceModeWord(message));
  };

  const originalSave = save;
  save = function patchedSave(message = '자동 저장됨') {
    return originalSave(replaceModeWord(message));
  };

  const originalSetAdminUnlocked = setAdminUnlocked;
  setAdminUnlocked = function patchedSetAdminUnlocked(unlocked) {
    originalSetAdminUnlocked(unlocked);
    el.adminOpenButton.textContent = unlocked ? '키라키 모드 열림' : '키라키 모드';
  };

  function syncKirakiLabels() {
    document.querySelectorAll('.status-badge.custom').forEach((badge) => { badge.textContent = '키라키 추가'; });
    const targets = [el.adminPresetList, el.saveStatus].filter(Boolean);
    targets.forEach((target) => {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node) => {
        if (node.nodeValue?.includes('관리자')) node.nodeValue = replaceModeWord(node.nodeValue);
      });
    });
  }

  const labelObserver = new MutationObserver(syncKirakiLabels);
  if (el.presetGrid) labelObserver.observe(el.presetGrid, { childList: true, subtree: true });
  if (el.adminPresetList) labelObserver.observe(el.adminPresetList, { childList: true, subtree: true });

  function normalizeSearch(value) {
    return String(value || '').toLocaleLowerCase('ko-KR').replace(/\s+/g, '');
  }

  function matchesPointFilter(points, filter) {
    if (filter === 'low') return points <= 500;
    if (filter === 'mid') return points >= 1000 && points <= 3000;
    if (filter === 'high') return points >= 5000;
    return true;
  }

  applyBossFilter = function enhancedBossFilter(forceOpen = false) {
    const selected = new Set(activeProfile().clearedBossIds);
    const filter = el.bossRangeFilter.value;
    const query = normalizeSearch(bossNameFilter?.value);
    let visibleGroups = 0;

    document.querySelectorAll('[data-boss-group]').forEach((group) => {
      const points = Number(group.dataset.points);
      const pointMatch = matchesPointFilter(points, filter);
      let visibleCards = 0;

      group.querySelectorAll('[data-boss-card]').forEach((card) => {
        const boss = byId.get(card.dataset.bossCard);
        const searchable = normalizeSearch(`${boss?.boss || ''} ${boss?.shortBoss || ''} ${boss?.difficulty || ''}`);
        const nameMatch = !query || searchable.includes(query);
        const checkedMatch = filter !== 'checked' || selected.has(card.dataset.bossCard);
        const show = pointMatch && nameMatch && checkedMatch;
        card.hidden = !show;
        if (show) visibleCards += 1;
      });

      const showGroup = visibleCards > 0;
      group.hidden = !showGroup;
      if (showGroup) {
        visibleGroups += 1;
        if (query || forceOpen) group.open = true;
      }
    });

    el.bossEmptyState.hidden = visibleGroups > 0;
  };

  function setVisibleBossGroupsOpen(open) {
    document.querySelectorAll('[data-boss-group]').forEach((group) => {
      if (!group.hidden) group.open = open;
    });
  }

  function populateBossNames() {
    if (!bossNameOptions) return;
    const names = new Set();
    DATA.bossMissions.forEach((boss) => {
      names.add(boss.boss);
      if (boss.shortBoss) names.add(boss.shortBoss);
    });
    bossNameOptions.innerHTML = [...names]
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .map((name) => `<option value="${escapeHtml(name)}"></option>`)
      .join('');
  }

  function decorateBossGroupHeadings() {
    const grouped = new Map();
    DATA.bossMissions.forEach((boss) => {
      if (!grouped.has(boss.points)) grouped.set(boss.points, []);
      grouped.get(boss.points).push(boss);
    });

    document.querySelectorAll('[data-boss-group]').forEach((group) => {
      const points = Number(group.dataset.points);
      const bosses = grouped.get(points) || [];
      const names = [...new Set(bosses.map((boss) => boss.shortBoss || boss.boss))];
      const title = group.querySelector('.boss-group-title');
      const oldMeta = group.querySelector('[data-group-meta]')?.textContent || `0/${bosses.length} 완료`;
      if (!title) return;
      title.innerHTML = `
        <span class="boss-group-score">${number.format(points)}점</span>
        <span class="boss-group-names">${escapeHtml(names.join(' · '))}</span>
        <span class="boss-group-meta" data-group-meta="${points}">${escapeHtml(oldMeta)}</span>`;
    });
  }

  function buttonLevelTarget(current, direction) {
    if (direction > 0) {
      if (current < 280) return Math.min(280, current + 2);
      return Math.min(290, current + 1);
    }
    if (current > 280) return Math.max(280, current - 1);
    return Math.max(260, current - 2);
  }

  function changeLevel(direction) {
    const current = clamp(Math.round(Number(el.levelInput.value) || activeProfile().level || 260), 260, 290);
    const level = buttonLevelTarget(current, direction);
    if (level === activeProfile().level) {
      el.levelInput.value = level;
      return;
    }
    patchProfile({ level }, '레벨 저장됨');
    render();
  }

  bossNameFilter?.addEventListener('input', () => applyBossFilter(Boolean(bossNameFilter.value.trim())));
  bossNameFilter?.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    bossNameFilter.value = '';
    applyBossFilter(false);
  });
  expandAllButton?.addEventListener('click', () => setVisibleBossGroupsOpen(true));
  collapseAllButton?.addEventListener('click', () => setVisibleBossGroupsOpen(false));
  checkAllButton?.addEventListener('click', () => {
    patchProfile({ clearedBossIds: DATA.bossMissions.map((boss) => boss.id) }, '전체 보스 체크됨');
    render();
    toast('모든 보스 미션을 체크했습니다.');
  });
  levelDecreaseButton?.addEventListener('click', () => changeLevel(-1));
  levelIncreaseButton?.addEventListener('click', () => changeLevel(1));

  populateBossNames();
  decorateBossGroupHeadings();
  document.querySelectorAll('[data-boss-group]').forEach((group) => { group.open = true; });
  setAdminUnlocked(isAdminUnlocked());
  syncKirakiLabels();
  applyBossFilter(false);
})();
