(() => {
  'use strict';

  const DATASET = window.MYSTERY_BARRIER_DATA;
  if (!DATASET) return;

  const { rarities: RARITIES, stages: STAGES } = DATASET;
  let selectedStageId = null;
  let followCurrentStage = true;
  let renderQueued = false;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './mystery-barrier.css?v=1.2.0';
  document.head.append(css);

  const formatProbability = (value) => `${Number(value).toFixed(3)}%`;
  const rarityIndex = (rarityId) => RARITIES.findIndex((rarity) => rarity.id === rarityId);
  const rarityById = (rarityId) => RARITIES.find((rarity) => rarity.id === rarityId) || RARITIES[0];

  function scoreFromMainCalculator() {
    const scoreNode = document.querySelector('#totalPoints');
    const displayed = Number(String(scoreNode?.textContent || '').replace(/[^0-9-]/g, ''));
    if (Number.isFinite(displayed)) return displayed;
    return levelPoints(activeProfile().level) + bossPoints(activeProfile().clearedBossIds);
  }

  const stageForPoints = (points) => [...STAGES].reverse().find((stage) => points >= stage.minPoints) || STAGES[0];
  const nextStage = (stage) => STAGES.find((candidate) => candidate.id === stage.id + 1) || null;
  const statusForStage = (stage, currentStage) => stage.id === currentStage.id ? '현재 적용' : stage.id < currentStage.id ? '달성' : '미도달';

  function cumulativeChance(stage, rarityId) {
    const start = rarityIndex(rarityId);
    if (start < 0) return 0;
    return RARITIES.slice(start).reduce((sum, rarity) => sum + stage.probabilities[rarity.id], 0);
  }

  function recommendationFor(stage) {
    const recommendation = stage.recommendation || { gradeId: 'epic', stretchGradeId: 'unique', note: '' };
    const grade = rarityById(recommendation.gradeId);
    const stretchGrade = rarityById(recommendation.stretchGradeId);
    return {
      grade,
      gradeLabel: `${grade.name} 이상`,
      gradeChance: cumulativeChance(stage, grade.id),
      stretchGrade,
      stretchLabel: `${stretchGrade.name} 이상`,
      stretchChance: cumulativeChance(stage, stretchGrade.id),
      note: recommendation.note || ''
    };
  }

  function queueRenderBarrier() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderBarrier();
    });
  }

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
          <div>
            <p class="section-kicker">포인트 계산 연동</p>
            <h2 id="barrierTitle">의문의 결계</h2>
            <p>위에서 입력한 레벨과 보스 점수를 그대로 불러와 현재 결계를 자동으로 표시합니다. 다른 단계를 눌러 확률도 비교할 수 있습니다.</p>
          </div>
          <span class="barrier-sync-badge"><i aria-hidden="true"></i><span id="barrierSyncText">실시간 연동 중</span></span>
        </div>

        <div class="barrier-overview-grid">
          <section class="barrier-current" aria-label="현재 적용 결계">
            <div class="barrier-current-main">
              <div class="barrier-current-emblem"><span id="barrierCurrentNumber">1</span><small>STAGE</small></div>
              <div class="barrier-current-copy">
                <span id="barrierCurrentProfile">현재 캐릭터</span>
                <h3 id="barrierCurrentName">1단계 · 초소형 결계</h3>
                <p id="barrierCurrentNext"></p>
              </div>
            </div>
            <div class="barrier-current-stats">
              <div class="barrier-current-stat"><span>연동 총점</span><strong id="barrierCurrentPoints">0점</strong></div>
              <div class="barrier-current-stat"><span>현재 티어</span><strong id="barrierCurrentTier">미달성</strong></div>
              <div class="barrier-current-stat"><span>적용 구간</span><strong id="barrierCurrentAppliesTo">브론즈·실버</strong></div>
              <div class="barrier-current-stat"><span>해제 조건</span><strong id="barrierCurrentCondition">골드 미만</strong></div>
            </div>
            <div class="barrier-stage-progress">
              <div class="barrier-stage-progress-copy"><span id="barrierProgressStart">현재 단계</span><strong id="barrierProgressEnd">다음 단계</strong></div>
              <div class="barrier-stage-progress-track" aria-hidden="true"><i id="barrierStageProgressFill"></i></div>
            </div>
          </section>

          <aside class="barrier-recommendation" aria-labelledby="barrierRecommendationTitle">
            <div class="barrier-recommendation-label">뉴비 추천 기준</div>
            <div class="barrier-recommendation-head">
              <div><span>현재 티어 추천 핵 등급</span><h3 id="barrierRecommendationTitle">레어 이상</h3></div>
              <strong id="barrierRecommendationChance">32.510%</strong>
            </div>
            <p id="barrierRecommendationNote"></p>
            <div class="barrier-stretch-goal"><span>상향 목표</span><strong id="barrierStretchGoal">에픽 이상 · 2.060%</strong></div>
            <small>확률표를 읽기 쉽게 만든 입문용 기준이며, 특정 등급의 등장을 보장하는 뜻은 아닙니다.</small>
          </aside>
        </div>

        <section class="barrier-stage-section">
          <div class="barrier-section-title">
            <div><strong>다른 티어·단계 비교</strong><span>카드를 누르면 현재 적용 단계와 관계없이 해당 확률을 볼 수 있습니다.</span></div>
            <button type="button" class="barrier-current-button" id="barrierFollowCurrent" hidden>내 단계로 돌아가기</button>
          </div>
          <div class="barrier-comparison-notice" id="barrierComparisonNotice" hidden></div>
          <div class="barrier-stage-grid" id="barrierStageGrid"></div>
        </section>

        <section class="barrier-detail">
          <article class="barrier-probability-card">
            <div class="barrier-detail-head">
              <div><strong id="barrierSelectedTitle"></strong><span id="barrierSelectedCondition"></span></div>
              <span class="barrier-detail-total">합계 100.000%</span>
            </div>
            <div class="barrier-stack" id="barrierProbabilityStack" aria-label="등급별 확률 누적 막대"></div>
            <div class="barrier-rarity-list" id="barrierRarityList"></div>
          </article>
          <aside class="barrier-guide-card"><h3>선택 단계 추천</h3><ul class="barrier-guide-list" id="barrierGuideList"></ul></aside>
        </section>

        <section class="barrier-table-card">
          <div class="barrier-table-head"><div><strong>전체 단계 비교</strong><span>현재 적용 단계는 강조되고, 추천 기준도 함께 표시됩니다.</span></div></div>
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
        return;
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
      const recommendation = recommendationFor(stage);
      const classes = [
        'barrier-stage-card',
        stage.id === selectedStage.id ? 'selected' : '',
        stage.id === currentStage.id ? 'current' : '',
        stage.id > currentStage.id ? 'locked' : ''
      ].filter(Boolean).join(' ');

      return `
        <button type="button" class="${classes}" data-barrier-stage="${stage.id}" aria-pressed="${stage.id === selectedStage.id}">
          <span class="barrier-stage-top"><span class="barrier-stage-number">${stage.id}</span><span class="barrier-stage-status">${statusForStage(stage, currentStage)}</span></span>
          <span class="barrier-stage-tier">${escapeHtml(stage.appliesTo)}</span>
          <h3>${escapeHtml(stage.name)}</h3>
          <span class="barrier-stage-condition">${escapeHtml(stage.condition)}</span>
          <span class="barrier-stage-recommend"><span>추천</span><strong style="color:${recommendation.grade.color}">${escapeHtml(recommendation.gradeLabel)}</strong></span>
          <span class="barrier-stage-legendary"><span>레전드리</span><strong>${formatProbability(stage.probabilities.legendary)}</strong></span>
        </button>`;
    }).join('');
  }

  function renderProbabilities(stage) {
    const stack = document.querySelector('#barrierProbabilityStack');
    const list = document.querySelector('#barrierRarityList');
    if (!stack || !list) return;

    stack.innerHTML = RARITIES.filter((rarity) => stage.probabilities[rarity.id] > 0).map((rarity) => {
      const probability = stage.probabilities[rarity.id];
      return `<span class="barrier-stack-segment" style="width:${probability}%;background:${rarity.color}" title="${rarity.name} ${formatProbability(probability)}"></span>`;
    }).join('');

    list.innerHTML = RARITIES.map((rarity) => {
      const probability = stage.probabilities[rarity.id];
      return `
        <div class="barrier-rarity-row">
          <span class="barrier-rarity-name"><i class="barrier-rarity-dot" style="background:${rarity.color}"></i>${rarity.name}</span>
          <span class="barrier-rarity-track"><i class="barrier-rarity-fill${probability === 0 ? ' zero' : ''}" style="--probability:${probability}%;background:${rarity.color}"></i></span>
          <strong class="barrier-rarity-value">${formatProbability(probability)}</strong>
        </div>`;
    }).join('');
  }

  function renderGuide(stage) {
    const guide = document.querySelector('#barrierGuideList');
    if (!guide) return;

    const recommendation = recommendationFor(stage);
    guide.innerHTML = `
      <li><b>추천</b><span><strong style="color:${recommendation.grade.color}">${escapeHtml(recommendation.gradeLabel)}</strong>을 입문 기준으로 볼 수 있습니다. 등장 확률은 ${formatProbability(recommendation.gradeChance)}입니다.</span></li>
      <li><b>상향</b><span><strong style="color:${recommendation.stretchGrade.color}">${escapeHtml(recommendation.stretchLabel)}</strong> 확률은 ${formatProbability(recommendation.stretchChance)}입니다.</span></li>
      <li><b>해석</b><span>${escapeHtml(recommendation.note)}</span></li>`;
  }

  function renderTable(currentStage, selectedStage) {
    const table = document.querySelector('#barrierTable');
    if (!table) return;

    table.innerHTML = `
      <thead><tr><th>결계 단계</th><th>적용 티어</th><th>추천 기준</th>${RARITIES.map((rarity) => `<th><span class="barrier-table-rarity"><i style="background:${rarity.color}"></i>${rarity.name}</span></th>`).join('')}</tr></thead>
      <tbody>${STAGES.map((stage) => {
        const recommendation = recommendationFor(stage);
        return `
          <tr class="${stage.id === currentStage.id ? 'current' : ''} ${stage.id === selectedStage.id ? 'selected' : ''}">
            <td>${stage.id}단계 · ${escapeHtml(stage.name)}</td>
            <td>${escapeHtml(stage.appliesTo)}</td>
            <td><strong style="color:${recommendation.grade.color}">${escapeHtml(recommendation.gradeLabel)}</strong><small>${formatProbability(recommendation.gradeChance)}</small></td>
            ${RARITIES.map((rarity) => `<td>${formatProbability(stage.probabilities[rarity.id])}</td>`).join('')}
          </tr>`;
      }).join('')}</tbody>`;
  }

  function renderBarrier() {
    if (!document.querySelector('[data-view-panel="barrier"]')) return;

    const total = scoreFromMainCalculator();
    const tier = tierState(total).current;
    const currentStage = stageForPoints(total);
    const currentRecommendation = recommendationFor(currentStage);

    if (followCurrentStage || !selectedStageId || !STAGES.some((stage) => stage.id === selectedStageId)) {
      selectedStageId = currentStage.id;
    }

    const selectedStage = STAGES.find((stage) => stage.id === selectedStageId) || currentStage;
    const followingStage = nextStage(currentStage);
    const stageStart = currentStage.minPoints;
    const stageEnd = followingStage?.minPoints || currentStage.minPoints;
    const stageProgress = followingStage
      ? clamp(((total - stageStart) / (stageEnd - stageStart)) * 100, 0, 100)
      : 100;
    const nextCopy = followingStage
      ? `${followingStage.id}단계 ${followingStage.name}까지 ${number.format(Math.max(0, followingStage.minPoints - total))}점 남았습니다.`
      : '현재 최고 단계인 초대형 결계가 적용됩니다.';

    const values = {
      barrierSyncText: `${activeProfile().name} · 포인트 계산 연동`,
      barrierCurrentNumber: currentStage.id,
      barrierCurrentProfile: `현재 캐릭터 · ${activeProfile().name}`,
      barrierCurrentName: `${currentStage.id}단계 · ${currentStage.name}`,
      barrierCurrentNext: nextCopy,
      barrierCurrentPoints: `${number.format(total)}점`,
      barrierCurrentTier: tier?.name || '미달성',
      barrierCurrentAppliesTo: currentStage.appliesTo,
      barrierCurrentCondition: currentStage.condition,
      barrierProgressStart: `${number.format(currentStage.minPoints)}점부터`,
      barrierProgressEnd: followingStage ? `${number.format(followingStage.minPoints)}점` : '최고 단계',
      barrierRecommendationTitle: currentRecommendation.gradeLabel,
      barrierRecommendationChance: formatProbability(currentRecommendation.gradeChance),
      barrierRecommendationNote: currentRecommendation.note,
      barrierStretchGoal: `${currentRecommendation.stretchLabel} · ${formatProbability(currentRecommendation.stretchChance)}`,
      barrierSelectedTitle: `${selectedStage.id}단계 · ${selectedStage.name}`,
      barrierSelectedCondition: `${selectedStage.appliesTo} · 해제 조건: ${selectedStage.condition}`
    };

    Object.entries(values).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = value;
    });

    const recommendationTitle = document.querySelector('#barrierRecommendationTitle');
    const recommendationChance = document.querySelector('#barrierRecommendationChance');
    if (recommendationTitle) recommendationTitle.style.color = currentRecommendation.grade.color;
    if (recommendationChance) recommendationChance.style.color = currentRecommendation.grade.color;

    const progressFill = document.querySelector('#barrierStageProgressFill');
    if (progressFill) progressFill.style.width = `${stageProgress}%`;

    const followButton = document.querySelector('#barrierFollowCurrent');
    const comparisonNotice = document.querySelector('#barrierComparisonNotice');
    const isComparing = selectedStage.id !== currentStage.id;
    if (followButton) followButton.hidden = !isComparing;
    if (comparisonNotice) {
      comparisonNotice.hidden = !isComparing;
      comparisonNotice.innerHTML = isComparing
        ? `<strong>비교 중:</strong> ${selectedStage.id}단계 ${escapeHtml(selectedStage.name)} 확률을 보고 있습니다. 실제 적용은 <strong>${currentStage.id}단계 ${escapeHtml(currentStage.name)}</strong>입니다.`
        : '';
    }

    renderStageCards(currentStage, selectedStage);
    renderProbabilities(selectedStage);
    renderGuide(selectedStage);
    renderTable(currentStage, selectedStage);
  }

  insertUi();

  const baseSetView = setView;
  setView = function barrierAwareSetView(view, options = {}) {
    if (view !== 'barrier') return baseSetView(view, options);

    document.querySelectorAll('[data-view-button]').forEach((button) => {
      const active = button.dataset.viewButton === 'barrier';
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-view-panel]').forEach((panel) => {
      const active = panel.dataset.viewPanel === 'barrier';
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });
    try { sessionStorage.setItem(VIEW_SESSION_KEY, 'barrier'); } catch {}
    renderBarrier();
    if (options.scroll) document.querySelector('.view-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const baseRenderSummary = renderSummary;
  renderSummary = function barrierAwareRenderSummary() {
    const result = baseRenderSummary();
    queueRenderBarrier();
    return result;
  };

  const scoreNode = document.querySelector('#totalPoints');
  if (scoreNode) {
    new MutationObserver(queueRenderBarrier).observe(scoreNode, { childList: true, characterData: true, subtree: true });
  }

  document.addEventListener('change', (event) => {
    if (event.target.closest('#profileSelect, #levelInput, [data-boss-checkbox], [data-boss-quick-checkbox], [data-boss-group-toggle]')) {
      queueRenderBarrier();
    }
  });

  const versionBadge = document.querySelector('.version-badge');
  if (versionBadge) versionBadge.textContent = 'UI v1.2';

  renderBarrier();
  try {
    if (sessionStorage.getItem(VIEW_SESSION_KEY) === 'barrier') setView('barrier');
  } catch {}
})();
