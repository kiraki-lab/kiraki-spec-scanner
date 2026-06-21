(() => {
  'use strict';

  if (window.__kirakiBossCheckboxClickFixLoaded) return;
  window.__kirakiBossCheckboxClickFixLoaded = true;

  function sameIds(a, b) {
    const left = [...new Set(a || [])].sort();
    const right = [...new Set(b || [])].sort();
    return left.length === right.length && left.every((id, index) => id === right[index]);
  }

  function commitBossIds(nextIds, checked, checkedMessage, uncheckedMessage) {
    const normalized = normalizeBosses(nextIds);
    if (sameIds(activeProfile().clearedBossIds, normalized)) {
      renderBosses();
      return;
    }
    patchProfile({ clearedBossIds: normalized }, checked ? checkedMessage : uncheckedMessage);
    render();
  }

  function setSingleBoss(id, checked) {
    if (!id || !byId.has(id)) return;
    const currentIds = activeProfile().clearedBossIds || [];
    const nextIds = checked
      ? normalizeBosses([...currentIds, id])
      : removeBossAndHigher(currentIds, id);
    commitBossIds(nextIds, checked, '보스 미션 체크됨', '보스 미션 해제됨');
  }

  function idsAtPoints(points) {
    return DATA.bossMissions.filter((boss) => boss.points === points).map((boss) => boss.id);
  }

  function setPointGroup(points, checked) {
    const groupIds = idsAtPoints(points);
    if (!groupIds.length) return;
    let nextIds = [...(activeProfile().clearedBossIds || [])];

    if (checked) {
      nextIds = normalizeBosses([...nextIds, ...groupIds]);
    } else {
      groupIds.forEach((id) => {
        nextIds = removeBossAndHigher(nextIds, id);
      });
    }

    commitBossIds(
      nextIds,
      checked,
      `${number.format(points)}점 구간 전체 체크됨`,
      `${number.format(points)}점 구간 전체 해제됨`
    );
  }

  function checkboxTarget(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return null;
    return target.closest('[data-boss-checkbox], [data-boss-quick-checkbox], [data-boss-group-toggle]');
  }

  function desiredChecked(checkbox) {
    return checkbox.dataset.kirakiDesiredChecked === 'true';
  }

  function applyDesiredState(checkbox) {
    const checked = desiredChecked(checkbox);

    if (checkbox.matches('[data-boss-checkbox]')) {
      setSingleBoss(checkbox.value, checked);
      return;
    }

    if (checkbox.matches('[data-boss-quick-checkbox]')) {
      setSingleBoss(checkbox.dataset.bossQuickCheckbox, checked);
      return;
    }

    if (checkbox.matches('[data-boss-group-toggle]')) {
      setPointGroup(Number(checkbox.dataset.bossGroupToggle), checked);
    }
  }

  function bindEvents() {
    if (!el.bossGroups) return;

    el.bossGroups.addEventListener('pointerdown', (event) => {
      const checkbox = checkboxTarget(event);
      if (!checkbox) return;
      checkbox.dataset.kirakiDesiredChecked = String(!checkbox.checked);
    }, true);

    el.bossGroups.addEventListener('click', (event) => {
      const checkbox = checkboxTarget(event);
      if (!checkbox) return;
      const hasDesiredState = checkbox.dataset.kirakiDesiredChecked === 'true' || checkbox.dataset.kirakiDesiredChecked === 'false';
      if (!hasDesiredState) checkbox.dataset.kirakiDesiredChecked = String(checkbox.checked);
      setTimeout(() => applyDesiredState(checkbox), 0);
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindEvents, { once: true });
  else bindEvents();
})();
