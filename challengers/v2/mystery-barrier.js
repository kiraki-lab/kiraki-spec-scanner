(() => {
  'use strict';

  const DATASET = window.MYSTERY_BARRIER_DATA;
  if (!DATASET) return;
  const { rarities: RARITIES, stages: STAGES } = DATASET;
  let selectedStageId = null;
  let followCurrentStage = true;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './mystery-barrier.css?v=1.1.0';
  document.head.append(css);

  const formatProbability = (value) => `${Number(value).toFixed(3)}%`;
  const currentTotal = () => levelPoints(activeProfile().level) + bossPoints(activeProfile().clearedBossIds);
  const stageForPoints = (points) => [...STAGES].reverse().find((stage) => points >= stage.minPoints) || STAGES[0];
  const nextStage = (stage) => STAGES.find((candidate) => candidate.id === stage.id + 1) || null;
  const statusForStage = (stage, currentStage) => stage.id === currentStage.id ? '현재 적용' : stage.id < currentStage.id ? '이전 단계' : '미도달';

  function insertUi() {
    const nav = document.querySelector('.view-tabs');
    const footer = document.querySelector('.page-note');
    if (!nav || !footer || document.querySelector('[data-view-button="barrier"]')) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'view-tab barrier-tab';
    tab.dataset.viewButton = 'barrier';
    tab.setAttribute('aria-selected', 'false');
    tab.innerHTML = '<span class="barrier-tab-icon" aria-hidden="true">◇</span><span>의문의 결계</span>';
    nav.append(tab);

    const panel = document.createElement('section');
    panel.className = 'view-panel';
    panel.dataset.viewPanel = 'barrier';
    panel.hidden = true;
    panel.innerHTML = `
      <section class="panel barrier-panel" aria-labelledby="barrierTitle">
        <div class="barrier-heading">
          <div><p class="section-kicker">티어별 결계 정보</p><h2 id="barrierTitle">의문의 결계</h2><p>현재 포인트 티어에 적용되는 결계 단계와 결계의 핵 등급별 등장 확률을 비교할 수 있습니다.</p></div>
          <span class="barrier-data-badge">확률 합계 100%</span>
        </div>
        <section class="barrier-current" aria-label="현재 적용 결계">
          <div class="barrier-current-emblem"><span id="barrierCurrentNumber">1</span><small>STAGE</small></div>
          <div class="barrier-current-copy"><span>현재 적용 단계</span><h3 id="barrierCurrentName">1단계 · 초소형 결계</h3><p id="barrierCurrentNext"></p></div>
          <div class="barrier-current-stats">
            <div class="barrier-current-stat"><span>현재 총점</span><strong id="barrierCurrentPoints">0점</strong></div>
            <div class="barrier-current-stat"><span>현재 티어</span><strong id="barrierCurrentTier">미달성</strong></div>
            <div class="barrier-current-stat"><span>해제 조건</span><strong id="barrierCurrentCondition">골드 미만</strong></div>
            <div class="barrier-current-stat legendary"><span>레전드리</span><strong id="barrierCurrentLegendary">0.007%</strong></div>
          </div>
        </section>
        <section class="barrier-stage-section">
          <div class="barrier-section-title"><div><strong>단계 선택</strong><span>다른 단계를 눌러 확률을 비교할 수 있습니다.</span></div><button type="button" class="barrier-current-button" id="barrierFollowCurrent" hidden>현재 적용 단계 보기</button></div>
          <div class="barrier-stage-grid" id="barrierStageGrid"></div>
        </section>
        <section class="barrier-detail">
          <article class="barrier-probability-card">
            <div class="barrier-detail-head"><div><strong id="barrierSelectedTitle"></strong><span id="barrierSelectedCondition"></span></div><span class="barrier-detail-total">합계 100.000%</span></div>
            <div class="barrier-stack" id="barrierProbabilityStack" aria-label="등급별 확률 누적 막대"></div>
            <div class="barrier-rarity-list" id="barrierRarityList"></div>
          </article>
          <aside class="barrier-guide-card"><h3>선택 단계 요약</h3><ul class="barrier-guide-list" id="barrierGuideList"></ul></aside>
        </section>
        <section class="barrier-table-card">
          <div class="barrier-table-head"><div><strong>전체 단계 비교</strong><span>현재 적용 단계는 배경으로 표시됩니다.</span></div></div>
          <div class="barrier-table-wrap"><table class="barrier-table" id="barrierTable"></table></div>
        </section>
        <p class="barrier-note">결계 단계와 등장 확률은 제공된 표를 기준으로 반영했습니다. 0.000%로 표시된 등급은 해당 단계에서 등장하지 않습니다.</p>
      </section>`;
    footer.parentNode.insertBefore(panel, footer);

    tab.addEventListener('click', () => setView('barrier', { scroll: true }));
    panel.addEventListener('click', (event) => {
      const stageButton = event.target.closest('[data-barrier-stage]');
      if (stageButton) {
        selectedStageId = Number(stageButton.dataset.barrierStage);
        followCurrentStage = false;
        renderBarrier();
      }
      if (event.target.closest('#barrierFollowCurrent')) {
        selectedStageId = null;
        followCurrentStage = true;
        renderBarrier();
      }
    });
  }

  function renderStageCards(currentStage, selectedStage) {
    const grid = document.querySelector('#barrierStageGrid');
    if (!grid) return;
    grid.innerHTML = STAGES.map((stage) => {
      const classes = ['barrier-stage-card', stage.id === selectedStage.id ? 'selected' : '', stage.id === currentStage.id ? 'current' : '', stage.id > currentStage.id ? 'locked' : ''].filter(Boolean).join(' ');
      return `<button type="button" class="${classes}" data-barrier-stage="${stage.id}" aria-pressed="${stage.id === selectedStage.id}"><span class="barrier-stage-top"><span class="barrier-stage-number">${stage.id}</span><span class="barrier-stage-status">${statusForStage(stage, currentStage)}</span></span><h3>${stage.name}</h3><span class="barrier-stage-condition">${stage.condition}</span><span class="barrier-stage-legendary"><span>레전드리</span><strong>${formatProbability(stage.probabilities.legendary)}</strong></span></button>`;
    }).join('');
  }

  function renderProbabilities(stage) {
    const stack = document.querySelector('#barrierProbabilityStack');
    const list = document.querySelector('#barrierRarityList');
    if (!stack || !list) return;
    stack.innerHTML = RARITIES.filter((rarity) => stage.probabilities[rarity.id] > 0).map((rarity) => `<span class="barrier-stack-segment" style="width:${stage.probabilities[rarity.id]}%;background:${rarity.color}" title="${rarity.name} ${formatProbability(stage.probabilities[rarity.id])}"></span>`).join('');
    list.innerHTML = RARITIES.map((rarity) => {
      const probability = stage.probabilities[rarity.id];
      return `<div class="barrier-rarity-row"><span class="barrier-rarity-name"><i class="barrier-rarity-dot" style="background:${rarity.color}"></i>${rarity.name}</span><span class="barrier-rarity-track"><i class="barrier-rarity-fill${probability === 0 ? ' zero' : ''}" style="--probability:${probability}%;background:${rarity.color}"></i></span><strong class="barrier-rarity-value">${formatProbability(probability)}</strong></div>`;
    }).join('');
  }

  function renderGuide(stage) {
    const guide = document.querySelector('#barrierGuideList');
    if (!guide) return;
    const legendary = stage.probabilities.legendary;
    const uniqueOrHigher = stage.probabilities.unique + legendary;
    const epicOrHigher = stage.probabilities.epic + uniqueOrHigher;
    guide.innerHTML = `<li><b>1</b><span><strong>에픽 이상</strong> ${formatProbability(epicOrHigher)}</span></li><li><b>2</b><span><strong>유니크 이상</strong> ${formatProbability(uniqueOrHigher)}</span></li><li><b>3</b><span><strong>레전드리</strong> ${formatProbability(legendary)}</span></li>`;
  }

  function renderTable(currentStage, selectedStage) {
    const table = document.querySelector('#barrierTable');
    if (!table) return;
    table.innerHTML = `<thead><tr><th>결계 단계</th><th>해제 조건</th>${RARITIES.map((rarity) => `<th><span class="barrier-table-rarity"><i style="background:${rarity.color}"></i>${rarity.name}</span></th>`).join('')}</tr></thead><tbody>${STAGES.map((stage) => `<tr class="${stage.id === currentStage.id ? 'current' : ''} ${stage.id === selectedStage.id ? 'selected' : ''}"><td>${stage.id}단계 · ${stage.name}</td><td>${stage.condition}</td>${RARITIES.map((rarity) => `<td>${formatProbability(stage.probabilities[rarity.id])}</td>`).join('')}</tr>`).join('')}</tbody>`;
  }

  function renderBarrier() {
    const total = currentTotal();
    const tier = tierState(total).current;
    const currentStage = stageForPoints(total);
    if (followCurrentStage || !selectedStageId || !STAGES.some((stage) => stage.id === selectedStageId)) selectedStageId = currentStage.id;
    const selectedStage = STAGES.find((stage) => stage.id === selectedStageId) || currentStage;
    const followingStage = nextStage(currentStage);
    const nextCopy = followingStage ? `${followingStage.id}단계 ${followingStage.name}까지 ${number.format(Math.max(0, followingStage.minPoints - total))}점 남았습니다.` : '현재 최고 단계인 초대형 결계가 적용됩니다.';

    const values = {
      barrierCurrentNumber: currentStage.id,
      barrierCurrentName: `${currentStage.id}단계 · ${currentStage.name}`,
      barrierCurrentNext: nextCopy,
      barrierCurrentPoints: `${number.format(total)}점`,
      barrierCurrentTier: tier?.name || '미달성',
      barrierCurrentCondition: currentStage.condition,
      barrierCurrentLegendary: formatProbability(currentStage.probabilities.legendary),
      barrierSelectedTitle: `${selectedStage.id}단계 · ${selectedStage.name}`,
      barrierSelectedCondition: `해제 조건: ${selectedStage.condition}`
    };
    Object.entries(values).forEach(([id, value]) => { const node = document.getElementById(id); if (node) node.textContent = value; });
    const followButton = document.querySelector('#barrierFollowCurrent');
    if (followButton) followButton.hidden = selectedStage.id === currentStage.id;

    renderStageCards(currentStage, selectedStage);
    renderProbabilities(selectedStage);
    renderGuide(selectedStage);
    renderTable(currentStage, selectedStage);
  }

  insertUi();

  const baseSetView = setView;
  setView = function barrierAwareSetView(view, options = {}) {
    if (view !== 'barrier') return baseSetView(view, options);
    document.querySelectorAll('[data-view-button]').forEach((button) => { const active = button.dataset.viewButton === 'barrier'; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
    document.querySelectorAll('[data-view-panel]').forEach((panel) => { const active = panel.dataset.viewPanel === 'barrier'; panel.classList.toggle('active', active); panel.hidden = !active; });
    try { sessionStorage.setItem(VIEW_SESSION_KEY, 'barrier'); } catch {}
    renderBarrier();
    if (options.scroll) document.querySelector('.view-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const baseRenderSummary = renderSummary;
  renderSummary = function barrierAwareRenderSummary() { const result = baseRenderSummary(); renderBarrier(); return result; };

  const versionBadge = document.querySelector('.version-badge');
  if (versionBadge) versionBadge.textContent = 'UI v1.1';
  renderBarrier();
  try { if (sessionStorage.getItem(VIEW_SESSION_KEY) === 'barrier') setView('barrier'); } catch {}
})();
