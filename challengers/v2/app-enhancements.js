(() => {
  const bossNameFilter = document.querySelector('#bossNameFilter');
  const bossNameOptions = document.querySelector('#bossNameOptions');
  const expandAllButton = document.querySelector('#expandAllBossesButton');
  const collapseAllButton = document.querySelector('#collapseAllBossesButton');
  const checkAllButton = document.querySelector('#checkAllBossesButton');
  const levelDecreaseButton = document.querySelector('#levelDecreaseButton');
  const levelIncreaseButton = document.querySelector('#levelIncreaseButton');
  const bossIdsByPoints = new Map();

  DATA.bossMissions.forEach((boss) => {
    if (!bossIdsByPoints.has(boss.points)) bossIdsByPoints.set(boss.points, []);
    bossIdsByPoints.get(boss.points).push(boss.id);
  });

  const enhancementStyle = document.createElement('style');
  enhancementStyle.textContent = `
.channel-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;white-space:nowrap}
.boss-group>summary{gap:10px}
.boss-group-title{flex:1 1 auto}
.boss-group-toggle{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:0 10px;flex:0 0 auto;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-size:.74rem;font-weight:900;white-space:nowrap;cursor:pointer;user-select:none}
.boss-group-toggle:hover{border-color:var(--accent)}
.boss-group-toggle input{width:18px;height:18px;margin:0;accent-color:var(--accent);cursor:pointer}
.boss-group-toggle.checked{border-color:var(--accent);background:var(--accent2);color:var(--accent)}
.boss-group-toggle.indeterminate{border-color:color-mix(in srgb,var(--accent) 55%,var(--line));background:color-mix(in srgb,var(--accent2) 60%,var(--surface))}
@media(max-width:700px){.channel-button{flex:1}.boss-group>summary{align-items:flex-start;flex-wrap:wrap}.boss-group-toggle{margin-left:auto}.boss-group>summary:after{margin-left:0}}
@media(max-width:430px){.boss-group-toggle{width:100%;justify-content:center;order:3}.boss-group>summary:after{order:4}}
`;
  document.head.append(enhancementStyle);

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

  function installChannelButton() {
    const actions = document.querySelector('.header-actions');
    if (!actions || document.querySelector('#kirakiChannelButton')) return;

    const channelButton = document.createElement('a');
    channelButton.id = 'kirakiChannelButton';
    channelButton.className = 'header-button channel-button';
    channelButton.href = 'https://www.youtube.com/channel/UCTa93vcBRawFA1YLyDOAkdw';
    channelButton.target = '_blank';
    channelButton.rel = 'noopener noreferrer';
    channelButton.setAttribute('aria-label', '새 창에서 키라키 유튜브 채널 열기');
    channelButton.innerHTML = '<span aria-hidden="true">▶</span><span>키라키 채널</span>';
    actions.insertBefore(channelButton, el.adminOpenButton);

    const versionBadge = actions.querySelector('.version-badge');
    if (versionBadge) versionBadge.textContent = 'UI v0.6';
  }

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
        <span class="boss-group-score">${number.format(points)}점 난이도</span>
        <span class="boss-group-names">${escapeHtml(names.join(' · '))}</span>
        <span class="boss-group-meta" data-group-meta="${points}">${escapeHtml(oldMeta)}</span>`;
    });
  }

  function installGroupToggles() {
    document.querySelectorAll('[data-boss-group]').forEach((group) => {
      const points = Number(group.dataset.points);
      const summary = group.querySelector('summary');
      if (!summary || summary.querySelector('[data-boss-group-toggle]')) return;

      const label = document.createElement('label');
      label.className = 'boss-group-toggle';
      label.setAttribute('data-boss-group-toggle-control', '');
      label.title = `${number.format(points)}점 난이도 구간 전체 체크 또는 해제`;
      label.innerHTML = `
        <input type="checkbox" data-boss-group-toggle="${points}" aria-label="${number.format(points)}점 난이도 구간 전체 체크" />
        <span data-boss-group-toggle-label>전체 체크</span>`;

      label.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const checkbox = label.querySelector('[data-boss-group-toggle]');
        const nextChecked = checkbox.indeterminate ? true : !checkbox.checked;
        checkbox.indeterminate = false;
        checkbox.checked = nextChecked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      });

      summary.append(label);
    });
  }

  function syncGroupToggles() {
    const selected = new Set(activeProfile().clearedBossIds);
    document.querySelectorAll('[data-boss-group]').forEach((group) => {
      const points = Number(group.dataset.points);
      const ids = bossIdsByPoints.get(points) || [];
      const completed = ids.filter((id) => selected.has(id)).length;
      const checkbox = group.querySelector('[data-boss-group-toggle]');
      const label = group.querySelector('[data-boss-group-toggle-control]');
      const labelText = group.querySelector('[data-boss-group-toggle-label]');
      if (!checkbox || !label) return;

      const allChecked = ids.length > 0 && completed === ids.length;
      const partiallyChecked = completed > 0 && completed < ids.length;
      checkbox.checked = allChecked;
      checkbox.indeterminate = partiallyChecked;
      checkbox.setAttribute('aria-checked', partiallyChecked ? 'mixed' : String(allChecked));
      checkbox.setAttribute('aria-label', `${number.format(points)}점 난이도 구간 ${allChecked ? '전체 해제' : '전체 체크'}`);
      label.classList.toggle('checked', allChecked);
      label.classList.toggle('indeterminate', partiallyChecked);
      if (labelText) labelText.textContent = allChecked ? '전체 해제' : '전체 체크';
    });
  }

  const originalRenderBosses = renderBosses;
  renderBosses = function enhancedRenderBosses(forceOpen = false) {
    const result = originalRenderBosses(forceOpen);
    syncGroupToggles();
    return result;
  };

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

  el.bossGroups?.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-boss-group-toggle]');
    if (!checkbox) return;

    const points = Number(checkbox.dataset.bossGroupToggle);
    const groupIds = bossIdsByPoints.get(points) || [];
    let nextIds = [...activeProfile().clearedBossIds];

    if (checkbox.checked) {
      nextIds = normalizeBosses([...nextIds, ...groupIds]);
    } else {
      groupIds.forEach((id) => {
        nextIds = removeBossAndHigher(nextIds, id);
      });
    }

    patchProfile(
      { clearedBossIds: nextIds },
      checkbox.checked ? `${number.format(points)}점 구간 전체 체크됨` : `${number.format(points)}점 구간 전체 해제됨`
    );
    render();
  });

  installChannelButton();
  populateBossNames();
  decorateBossGroupHeadings();
  installGroupToggles();
  document.querySelectorAll('[data-boss-group]').forEach((group) => { group.open = true; });
  setAdminUnlocked(isAdminUnlocked());
  syncKirakiLabels();
  renderBosses(false);
})();
