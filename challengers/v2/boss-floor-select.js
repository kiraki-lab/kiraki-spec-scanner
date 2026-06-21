(() => {
  'use strict';

  if (window.__kirakiBossFloorSelectLoaded) return;
  window.__kirakiBossFloorSelectLoaded = true;

  function installStyles() {
    if (document.querySelector('#kirakiBossFloorSelectStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiBossFloorSelectStyles';
    style.textContent = `
.boss-floor-toggle{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 10px;flex:0 0 auto;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:10px;background:color-mix(in srgb,var(--accent2) 52%,var(--surface));color:var(--accent);font-size:.74rem;font-weight:900;white-space:nowrap;cursor:pointer;user-select:none}.boss-floor-toggle:hover{border-color:var(--accent);background:var(--accent2)}.boss-floor-toggle.checked{border-color:var(--accent);background:var(--accent);color:#fff}.boss-floor-toggle.indeterminate{border-color:color-mix(in srgb,var(--accent) 58%,var(--line));background:color-mix(in srgb,var(--accent2) 75%,var(--surface));color:var(--accent)}.boss-floor-toggle small{color:inherit;font-size:.68rem;font-weight:900;opacity:.82}
@media(max-width:700px){.boss-floor-toggle{margin-left:auto}.boss-group-toggle + .boss-floor-toggle{margin-left:0}}
@media(max-width:430px){.boss-floor-toggle{width:100%;order:3}.boss-group-toggle{order:4}}
`;
    document.head.append(style);
  }

  function idsAtOrBelow(points) {
    return DATA.bossMissions.filter((boss) => boss.points <= points).map((boss) => boss.id);
  }

  function selectedSet() {
    return new Set(activeProfile().clearedBossIds || []);
  }

  function buttonState(points) {
    const ids = idsAtOrBelow(points);
    const selected = selectedSet();
    const completed = ids.filter((id) => selected.has(id)).length;
    return {
      ids,
      completed,
      all: ids.length > 0 && completed === ids.length,
      partial: completed > 0 && completed < ids.length
    };
  }

  function syncButton(button) {
    const points = Number(button.dataset.bossFloorToggle);
    const state = buttonState(points);
    const label = button.querySelector('[data-boss-floor-label]');
    button.classList.toggle('checked', state.all);
    button.classList.toggle('indeterminate', state.partial);
    button.setAttribute('aria-pressed', String(state.all));
    button.title = state.all
      ? `${number.format(points)}점 이하 보스 미션 전체 해제`
      : `${number.format(points)}점 이하 보스 미션 전체 선택`;
    if (label) label.textContent = state.all ? '이하 해제' : '이하 선택';
  }

  function syncButtons() {
    document.querySelectorAll('[data-boss-floor-toggle]').forEach(syncButton);
  }

  function installButtons() {
    document.querySelectorAll('[data-boss-group]').forEach((group) => {
      const points = Number(group.dataset.points);
      const summary = group.querySelector('summary');
      if (!summary || summary.querySelector('[data-boss-floor-toggle]')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'boss-floor-toggle';
      button.dataset.bossFloorToggle = String(points);
      button.innerHTML = `<span data-boss-floor-label>이하 선택</span><small>${number.format(points)}점</small>`;

      const groupToggle = summary.querySelector('[data-boss-group-toggle-control]');
      if (groupToggle) summary.insertBefore(button, groupToggle);
      else summary.append(button);
    });
    syncButtons();
  }

  function applyFloor(points) {
    const state = buttonState(points);
    let nextIds = [...activeProfile().clearedBossIds];

    if (state.all) {
      state.ids.forEach((id) => {
        nextIds = removeBossAndHigher(nextIds, id);
      });
    } else {
      nextIds = normalizeBosses([...nextIds, ...state.ids]);
    }

    patchProfile(
      { clearedBossIds: nextIds },
      state.all ? `${number.format(points)}점 이하 전체 해제됨` : `${number.format(points)}점 이하 전체 체크됨`
    );
    render();
  }

  function bindEvents() {
    el.bossGroups?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-boss-floor-toggle]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      applyFloor(Number(button.dataset.bossFloorToggle));
    });
  }

  function boot() {
    installStyles();
    installButtons();
    bindEvents();

    if (typeof renderBosses === 'function' && !window.__kirakiBossFloorRenderWrapped) {
      window.__kirakiBossFloorRenderWrapped = true;
      const baseRenderBosses = renderBosses;
      renderBosses = function floorAwareRenderBosses(forceOpen = false) {
        const result = baseRenderBosses(forceOpen);
        installButtons();
        syncButtons();
        return result;
      };
    }

    syncButtons();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
