(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
.input-hub.progress-polished{gap:13px;padding:18px}
.input-hub.progress-polished .input-hub-heading{align-items:center}
.input-hub.progress-polished .input-hub-heading h2{font-size:1.2rem}
.input-hub.progress-polished .input-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
.input-hub.progress-polished .input-card{min-height:138px;padding:15px 16px;background:linear-gradient(135deg,var(--soft),color-mix(in srgb,var(--surface) 78%,var(--soft)));box-shadow:0 8px 22px rgba(31,41,55,.04)}
.progress-level-card{display:grid!important;grid-template-columns:minmax(150px,.72fr) minmax(220px,1.28fr);grid-template-rows:auto auto;align-items:center;gap:9px 15px!important}
.progress-level-card .input-card-title{grid-column:1;grid-row:1}
.progress-level-card .level-stepper{grid-column:2;grid-row:1/3}
.progress-level-card .input-help{grid-column:1;grid-row:2}
.progress-summary-card{display:grid!important;grid-template-columns:minmax(170px,.72fr) minmax(230px,1.28fr);grid-template-rows:auto auto;align-items:center;gap:9px 15px!important}
.progress-summary-card .input-card-title{grid-column:1;grid-row:1}
.progress-summary-card .live-result-row{grid-column:2;grid-row:1/3}
.progress-summary-card .full-input-button{grid-column:1;grid-row:2}
.progress-summary-card .mini-score{display:grid;align-content:center;min-height:76px!important}
.recommendation-result.compact-grouped{max-height:560px}
.recommendation-group-summary{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}
.recommendation-group-summary span{color:var(--muted);font-size:.7rem;font-weight:750}.recommendation-group-summary strong{color:var(--accent);font-size:.8rem;font-weight:900;white-space:nowrap}
.recommendation-common-bosses,.recommendation-variant-bosses{display:flex;flex-wrap:wrap;gap:6px}
.recommendation-common-bosses{margin-top:8px}
.recommendation-boss-pill{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 8px;align-items:center;min-width:0;padding:7px 9px;border:1px solid var(--line);border-radius:9px;background:var(--surface)}
.recommendation-boss-pill b{min-width:0;font-size:.75rem;font-weight:900;line-height:1.35}.recommendation-boss-pill em{color:var(--accent);font-size:.7rem;font-style:normal;font-weight:900;white-space:nowrap}.recommendation-boss-pill small{grid-column:1/-1;color:var(--muted);font-size:.62rem;line-height:1.35}
.recommendation-variant-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:9px}
.recommendation-variant-card{display:flex!important;flex-direction:column;gap:9px!important;min-width:0;padding:11px!important}
.recommendation-variant-card .recommendation-plan-header{align-items:center}.recommendation-variant-card .recommendation-plan-header strong{font-size:.78rem}.recommendation-variant-card .recommendation-plan-header span{font-size:.72rem}
.recommendation-variant-title{display:flex;align-items:center;justify-content:space-between;gap:8px}.recommendation-variant-title span{color:var(--muted);font-size:.65rem;font-weight:800}.recommendation-variant-title strong{font-size:.76rem;font-weight:900}
.recommendation-variant-bosses{display:grid;grid-template-columns:1fr;gap:5px}
.recommendation-variant-card .recommendation-plan-select{margin-top:auto;justify-self:stretch;width:100%}
@media(max-width:980px){.input-hub.progress-polished .input-hub-grid{grid-template-columns:1fr}.progress-level-card,.progress-summary-card{min-height:128px}}
@media(max-width:700px){.input-hub.progress-polished{padding:14px}.progress-level-card,.progress-summary-card{grid-template-columns:1fr;grid-template-rows:auto}.progress-level-card .input-card-title,.progress-level-card .level-stepper,.progress-level-card .input-help,.progress-summary-card .input-card-title,.progress-summary-card .live-result-row,.progress-summary-card .full-input-button{grid-column:1;grid-row:auto}.recommendation-variant-grid{grid-template-columns:1fr}}
`;
  document.head.append(style);

  function polishProgressHeader() {
    const hub = document.querySelector('.input-hub');
    const grid = document.querySelector('.input-hub-grid');
    if (!hub || !grid) return;

    const cards = [...grid.querySelectorAll(':scope > .input-card')];
    const profileCard = cards.find((card) => card.querySelector('#profileSelect'));
    profileCard?.remove();

    const remainingCards = [...grid.querySelectorAll(':scope > .input-card')];
    const levelCard = remainingCards.find((card) => card.querySelector('#levelInput'));
    const summaryCard = remainingCards.find((card) => card.querySelector('#toolbarTotalPoints'));

    hub.classList.add('progress-polished');
    grid.classList.add('single-progress-grid');
    levelCard?.classList.add('progress-level-card');
    summaryCard?.classList.add('progress-summary-card');

    if (levelCard) {
      levelCard.querySelector('.step-number')?.replaceChildren('1');
      const title = levelCard.querySelector('.input-card-title strong');
      const helper = levelCard.querySelector('.input-card-title small');
      if (title) title.textContent = '현재 레벨';
      if (helper) helper.textContent = '레벨 미션 점수에 바로 반영됩니다.';
    }

    if (summaryCard) {
      summaryCard.querySelector('.step-number')?.replaceChildren('2');
      const title = summaryCard.querySelector('.input-card-title strong');
      const helper = summaryCard.querySelector('.input-card-title small');
      const button = summaryCard.querySelector('.full-input-button');
      if (title) title.textContent = '현재 점수';
      if (helper) helper.textContent = '레벨과 보스 체크를 합산합니다.';
      if (button) button.textContent = '보스 체크로 이동';
    }

    const kicker = hub.querySelector('.input-hub-heading .section-kicker');
    const heading = hub.querySelector('#inputHubTitle');
    const description = hub.querySelector('.input-hub-heading > div > p:last-child');
    if (kicker) kicker.textContent = '자동 저장';
    if (heading) heading.textContent = '레벨과 진행도 설정';
    if (description) description.textContent = '레벨과 보스 체크는 이 브라우저에 하나의 진행도로 저장됩니다.';

    if (el.resetProgressButton) el.resetProgressButton.textContent = '현재 진행도 초기화';
  }

  function actionKey(action) {
    return action.target.id;
  }

  function groupedPlans(plans) {
    if (plans.length < 2) return null;

    const commonKeys = new Set(
      plans[0].actions
        .map(actionKey)
        .filter((key) => plans.every((plan) => plan.actions.some((action) => actionKey(action) === key)))
    );
    const commonActions = plans[0].actions.filter((action) => commonKeys.has(actionKey(action)));
    if (!commonActions.length) return null;

    const variants = plans.map((plan, index) => ({
      index,
      plan,
      actions: plan.actions.filter((action) => !commonKeys.has(actionKey(action)))
    }));
    if (variants.some((variant) => variant.actions.length > 4)) return null;

    return { commonActions, variants };
  }

  function lowerMissionText(action) {
    const lowerBosses = action.ids
      .map((id) => byId.get(id))
      .filter((boss) => boss && boss.id !== action.target.id)
      .sort((a, b) => a.rank - b.rank);
    return lowerBosses.length
      ? `자동 포함: ${lowerBosses.map((boss) => bossMissionName(boss)).join(' · ')}`
      : '';
  }

  function bossPill(action) {
    const lower = lowerMissionText(action);
    return `
      <span class="recommendation-boss-pill">
        <b>${escapeHtml(bossMissionName(action.target))}</b>
        <em>+${number.format(action.points)}</em>
        ${lower ? `<small>${escapeHtml(lower)}</small>` : ''}
      </span>`;
  }

  function variantHeading(actions) {
    if (!actions.length) return '추가 선택 없음';
    const pointBands = [...new Set(actions.map((action) => action.target.points))];
    return pointBands.length === 1
      ? `${number.format(pointBands[0])}점 보스 ${actions.length}종`
      : `보스 ${actions.length}종 조합`;
  }

  function variantCard(variant, current) {
    const selected = variant.index === selectedRecommendationIndex;
    const uniquePoints = variant.actions.reduce((sum, action) => sum + action.points, 0);
    return `
      <article class="recommendation-plan recommendation-variant-card${selected ? ' selected' : ''}" data-recommendation-plan="${variant.index}">
        <div class="recommendation-plan-header">
          <strong>선택 ${variant.index + 1}</strong>
          <span>예상 ${number.format(current + variant.plan.points)}점</span>
        </div>
        <div class="recommendation-variant-title"><span>${escapeHtml(variantHeading(variant.actions))}</span><strong>+${number.format(uniquePoints)}</strong></div>
        <div class="recommendation-variant-bosses">${variant.actions.length ? variant.actions.map(bossPill).join('') : '<span class="micro-copy">공통 미션만 적용</span>'}</div>
        <button type="button" class="recommendation-plan-select" data-select-recommendation-plan="${variant.index}" aria-pressed="${selected}">${selected ? '선택됨' : '이 조합 선택'}</button>
      </article>`;
  }

  renderRecommendation = function groupedRecommendationRender() {
    const profile = activeProfile();
    const target = DATA.tiers.find((tier) => tier.id === profile.targetTierId) || DATA.tiers[1];
    const current = levelPoints(profile.level) + bossPoints(profile.clearedBossIds);
    const needed = Math.max(0, target.threshold - current);

    if (!needed) {
      recommendationIds = [];
      recommendationOptions = [];
      selectedRecommendationIndex = 0;
      el.recommendationResult.classList.remove('compact-grouped');
      el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)} 포인트 기준 달성</h3><p>현재 총점이 목표 이상입니다. 더 높은 티어를 선택해 보세요.</p>`;
      el.applyRecommendationButton.textContent = '추천 적용';
      el.applyRecommendationButton.disabled = true;
      return;
    }

    const plans = buildRecommendationPlans(profile.clearedBossIds, needed, 3);
    recommendationOptions = plans;
    selectedRecommendationIndex = 0;
    recommendationIds = plans[0]?.ids || [];

    if (!plans.length) {
      el.recommendationResult.classList.remove('compact-grouped');
      el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3><p>현재 보스 미션만으로는 목표에 도달하지 못합니다. 레벨을 올리거나 상위 보스를 확인해 주세요.</p>`;
      el.applyRecommendationButton.textContent = '추천 적용';
      el.applyRecommendationButton.disabled = true;
      return;
    }

    const grouped = groupedPlans(plans);
    if (grouped) {
      const commonPoints = grouped.commonActions.reduce((sum, action) => sum + action.points, 0);
      el.recommendationResult.classList.add('compact-grouped');
      el.recommendationResult.innerHTML = `
        <h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3>
        <p>같은 보스는 한 번만 묶었습니다. 공통 미션을 잡고 아래 조합 중 하나를 선택하세요.</p>
        <section class="recommendation-common">
          <div class="recommendation-group-summary"><span>모든 추천안 공통 · ${grouped.commonActions.length}종</span><strong>+${number.format(commonPoints)}</strong></div>
          <div class="recommendation-common-bosses">${grouped.commonActions.map(bossPill).join('')}</div>
        </section>
        <section class="recommendation-choice-section">
          <div class="recommendation-subheading"><strong>달라지는 보스 조합</strong><span>최대 3개만 비교합니다.</span></div>
          <div class="recommendation-variant-grid">${grouped.variants.map((variant) => variantCard(variant, current)).join('')}</div>
        </section>`;
      el.applyRecommendationButton.textContent = '선택 조합 적용';
      el.applyRecommendationButton.disabled = false;
      return;
    }

    el.recommendationResult.classList.remove('compact-grouped');
    const choiceCopy = plans.length > 1
      ? `아래 ${plans.length}가지 중 편한 조합을 선택할 수 있습니다.`
      : '필요한 미션을 정확한 이름으로 표시했습니다.';
    el.recommendationResult.innerHTML = `
      <h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3>
      <p>${choiceCopy} 자동 완료되는 하위 미션도 함께 적었습니다.</p>
      <div class="recommendation-plan-list">${plans.map((plan, index) => recommendationPlanHtml(plan, index, current)).join('')}</div>`;
    el.applyRecommendationButton.textContent = '추천안 1 적용';
    el.applyRecommendationButton.disabled = false;
  };

  el.recommendationResult?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-select-recommendation-plan]');
    if (!button) return;
    const index = Number(button.dataset.selectRecommendationPlan);
    requestAnimationFrame(() => {
      if (el.recommendationResult.classList.contains('compact-grouped')) {
        el.applyRecommendationButton.textContent = `선택 ${index + 1} 적용`;
      }
    });
  });

  el.resetProgressButton?.addEventListener('click', (event) => {
    event.stopImmediatePropagation();
    if (!window.confirm('현재 진행도를 초기화할까요?')) return;
    patchProfile({ level: 260, clearedBossIds: [], targetTierId: 'silver' }, '진행도 초기화됨');
    render();
  }, true);

  polishProgressHeader();
  renderRecommendation();

  const versionBadge = document.querySelector('.version-badge');
  if (versionBadge) versionBadge.textContent = 'UI v1.4';
})();
