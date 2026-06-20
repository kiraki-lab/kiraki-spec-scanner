(() => {
  const bossNameFilter = document.querySelector('#bossNameFilter');
  const bossNameOptions = document.querySelector('#bossNameOptions');
  const expandAllButton = document.querySelector('#expandAllBossesButton');
  const collapseAllButton = document.querySelector('#collapseAllBossesButton');
  const levelDecreaseButton = document.querySelector('#levelDecreaseButton');
  const levelIncreaseButton = document.querySelector('#levelIncreaseButton');

  const replaceModeWord = (value) => typeof value === 'string' ? value.replaceAll('관리자', '키라키') : value;

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
        if (node.nodeValue?.includes('관리자')) node.nodeValue = node.nodeValue.replaceAll('관리자', '키라키');
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

  function changeLevel(delta) {
    const current = Number(el.levelInput.value) || activeProfile().level || 260;
    const level = clamp(Math.round(current + delta), 260, 290);
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
  levelDecreaseButton?.addEventListener('click', () => changeLevel(-1));
  levelIncreaseButton?.addEventListener('click', () => changeLevel(1));

  populateBossNames();
  document.querySelectorAll('[data-boss-group]').forEach((group) => { group.open = true; });
  setAdminUnlocked(isAdminUnlocked());
  syncKirakiLabels();
  applyBossFilter(false);
})();
