(() => {
  'use strict';

  window.__kirakiRecommendationCompactLoaded = true;

  function planActionKey(action) {
    return action.target.id;
  }

  function combinations(items, size, start = 0, prefix = [], result = []) {
    if (prefix.length === size) {
      result.push(prefix);
      return result;
    }
    for (let index = start; index < items.length; index += 1) {
      combinations(items, size, index + 1, [...prefix, items[index]], result);
    }
    return result;
  }

  function compactCandidate(plans, indexes) {
    const selectedPlans = indexes.map((index) => plans[index]);
    const commonKeys = new Set(
      selectedPlans[0].actions
        .map(planActionKey)
        .filter((key) => selectedPlans.every((plan) => plan.actions.some((action) => planActionKey(action) === key)))
    );
    const commonActions = selectedPlans[0].actions.filter((action) => commonKeys.has(planActionKey(action)));
    if (!commonActions.length) return null;

    const choices = indexes.map((index) => {
      const plan = plans[index];
      return {
        index,
        plan,
        actions: plan.actions.filter((action) => !commonKeys.has(planActionKey(action)))
      };
    });
    if (!choices.every((choice) => choice.actions.length === 1)) return null;

    return {
      indexes,
      commonActions,
      choices,
      commonPoints: commonActions.reduce((sum, action) => sum + action.points, 0),
      commonMissionCount: commonActions.reduce((sum, action) => sum + action.missionCount, 0),
      sameBand: new Set(choices.map((choice) => choice.actions[0].target.points)).size === 1
    };
  }

  compactRecommendationGroup = function partiallyCompactRecommendationGroup(plans) {
    if (plans.length < 2) return null;
    const indexes = plans.map((_, index) => index);
    const candidates = [];

    for (let size = plans.length; size >= 2; size -= 1) {
      combinations(indexes, size).forEach((combo) => {
        const candidate = compactCandidate(plans, combo);
        if (candidate) candidates.push(candidate);
      });
      if (candidates.length) break;
    }

    candidates.sort((a, b) =>
      Number(b.indexes.includes(0)) - Number(a.indexes.includes(0))
      || b.indexes.length - a.indexes.length
      || Number(b.sameBand) - Number(a.sameBand)
      || b.commonPoints - a.commonPoints
      || a.indexes[0] - b.indexes[0]
    );

    const best = candidates[0];
    if (!best) return null;
    const grouped = new Set(best.indexes);
    return {
      ...best,
      rest: plans
        .map((plan, index) => ({ plan, index }))
        .filter((item) => !grouped.has(item.index))
    };
  };

  renderCompactRecommendation = function renderPartiallyCompactRecommendation(target, needed, compact, current) {
    const selectedChoice = compact.choices.find((choice) => choice.index === selectedRecommendationIndex) || compact.choices[0];
    selectedRecommendationIndex = selectedChoice.index;
    recommendationIds = selectedChoice.plan.ids;
    const expected = current + selectedChoice.plan.points;

    el.recommendationResult.classList.add('recommendation-merged');
    el.recommendationResult.innerHTML = `
      <h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3>
      <p>겹치는 보스는 한 번만 표시했습니다. 공통 미션을 잡고, 선택 보스 중 하나만 고르면 됩니다.</p>
      <div class="recommendation-plan-list">
        <article class="recommendation-plan recommendation-common-plan">
          <div class="recommendation-plan-header">
            <div>
              <strong>공통 미션</strong>
              <small>묶인 선택안 공통 · 완료 미션 ${compact.commonMissionCount}개</small>
            </div>
            <span>+${number.format(compact.commonPoints)}</span>
          </div>
          <ul class="recommendation-list">${compact.commonActions.map(recommendationActionHtml).join('')}</ul>
        </article>
        <div class="recommendation-plan-list">${compact.choices.map((choice) => compactRecommendationChoiceHtml(choice, current)).join('')}</div>
        ${compact.rest.length ? `
          <div class="recommendation-subheading"><strong>다른 대체안</strong><span>위 묶음과 다른 루트입니다.</span></div>
          <div class="recommendation-plan-list">${compact.rest.map(({ plan, index }) => recommendationPlanHtml(plan, index, current)).join('')}</div>` : ''}
      </div>`;
    el.applyRecommendationButton.textContent = `선택안 적용 · 예상 ${number.format(expected)}점`;
    el.applyRecommendationButton.disabled = false;
  };
})();
