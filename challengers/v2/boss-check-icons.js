(() => {
  'use strict';

  if (window.__kirakiBossCheckIconsLoaded) return;
  window.__kirakiBossCheckIconsLoaded = true;

  function bossMap() {
    const data = window.CHALLENGERS_DATA;
    if (!Array.isArray(data?.bossMissions)) return new Map();
    return new Map(data.bossMissions.map((boss) => [boss.id, boss]));
  }

  function installStyles() {
    if (document.querySelector('#kirakiBossCheckIconStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiBossCheckIconStyles';
    style.textContent = `
.boss-check.has-boss-icon{align-items:center;gap:8px;min-height:76px}.boss-check.has-boss-icon input{align-self:center;width:20px;height:20px;margin:0;position:relative;z-index:2;pointer-events:auto;cursor:pointer}.boss-check.has-boss-icon .boss-photo-icon{margin-right:1px;border-radius:9px;pointer-events:none}.boss-check.has-boss-icon .boss-copy{align-self:center}.boss-check.has-boss-icon.checked .boss-photo-icon{border-color:color-mix(in srgb,var(--accent) 48%,var(--line));box-shadow:0 4px 10px rgba(91,85,232,.18)}@media(max-width:620px){.boss-check.has-boss-icon{min-height:70px;padding:10px}.boss-check.has-boss-icon .boss-photo-icon{--boss-icon-size:30px}}`;
    document.head.append(style);
  }

  function decorateBossChecks() {
    if (typeof window.kirakiBossIconHtml !== 'function') return;
    const bosses = bossMap();
    if (!bosses.size) return;

    document.querySelectorAll('[data-boss-card]').forEach((card) => {
      if (card.querySelector('.boss-photo-icon')) return;
      const boss = bosses.get(card.dataset.bossCard);
      const input = card.querySelector('[data-boss-checkbox]');
      if (!boss || !input) return;
      input.insertAdjacentHTML('afterend', window.kirakiBossIconHtml(boss, 34));
      card.classList.add('has-boss-icon');
    });
  }

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

  function bindDirectCheckboxClicks() {
    if (typeof el === 'undefined' || !el.bossGroups || window.__kirakiBossDirectCheckboxEventsBound) return;
    window.__kirakiBossDirectCheckboxEventsBound = true;

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

  function boot() {
    installStyles();
    decorateBossChecks();
    bindDirectCheckboxClicks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
