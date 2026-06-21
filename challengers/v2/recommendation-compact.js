(() => {
  'use strict';

  if (window.__kirakiRecommendationCompactLoaded) return;
  window.__kirakiRecommendationCompactLoaded = true;

  function installStyles() {
    if (document.querySelector('#recommendationCompactStyles')) return;
    const style = document.createElement('style');
    style.id = 'recommendationCompactStyles';
    style.textContent = `
.recommendation-result.route-merged{max-height:560px}
.recommendation-route-group{display:grid;gap:11px;margin-top:10px}
.recommendation-route-block{display:grid;gap:8px;padding:10px;border:1px solid var(--line);border-radius:11px;background:var(--soft)}
.recommendation-route-title{display:flex;align-items:center;justify-content:space-between;gap:10px}
.recommendation-route-title strong{font-size:.82rem;font-weight:900}.recommendation-route-title span{color:var(--muted);font-size:.7rem;font-weight:800;text-align:right}
.recommendation-route-bosses{display:flex;flex-wrap:wrap;gap:6px}
.recommendation-route-pill{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 8px;align-items:center;min-width:150px;padding:8px 9px;border:1px solid color-mix(in srgb,var(--line) 86%,transparent);border-radius:9px;background:var(--surface)}
.recommendation-route-pill b{min-width:0;color:var(--ink);font-size:.78rem;font-weight:900;line-height:1.35}.recommendation-route-pill em{color:var(--accent);font-size:.72rem;font-style:normal;font-weight:900;white-space:nowrap}.recommendation-route-pill small{grid-column:1/-1;color:var(--muted);font-size:.64rem;line-height:1.35}
.recommendation-option-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:7px}
.recommendation-pick-option{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:10px!important}
.recommendation-pick-copy{display:grid;gap:3px;min-width:0}.recommendation-pick-copy strong{font-size:.82rem;font-weight:900}.recommendation-pick-copy small{color:var(--muted);font-size:.68rem;line-height:1.35}
.recommendation-pick-option .recommendation-plan-select{justify-self:end;white-space:nowrap}
.recommendation-extra-plans{display:grid;gap:8px;margin-top:4px}
.recommendation-extra-plans>.recommendation-subheading{margin-top:0}
@media(max-width:560px){.recommendation-route-title{align-items:flex-start;flex-direction:column}.recommendation-route-title span{text-align:left}.recommendation-option-strip{grid-template-columns:1fr}.recommendation-pick-option{grid-template-columns:1fr}.recommendation-pick-option .recommendation-plan-select{justify-self:stretch}}
`;
    document.head.append(style);
  }

  const actionKey = (action) => action.target.id;
  const actionPoints = (actions) => actions.reduce((sum, action) => sum + action.points, 0);
  const planExpected = (current, plan) => current + plan.points;

  function lowerMissionText(action) {
    const lowerBosses = action.ids
      .map((id) => byId.get(id))
      .filter((boss) => boss && boss.id !== action.target.id)
      .sort((a, b) => a.rank - b.rank);
    return lowerBosses.length
      ? `자동 포함: ${lowerBosses.map((boss) => bossMissionName(boss)).join(' · ')}`
      : '';
  }

  function routePill(action) {
    const lower = lowerMissionText(action);
    return `
      <span class="recommendation-route-pill">
        <b>${escapeHtml(bossMissionName(action.target))}</b>
        <em>+${number.format(action.points)}</em>
        ${lower ? `<small>${escapeHtml(lower)}</small>` : ''}
      </span>`;
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
        .map(actionKey)
        .filter((key) => selectedPlans.every((plan) => plan.actions.some((action) => actionKey(action) === key)))
    );
    const commonActions = selectedPlans[0].actions.filter((action) => commonKeys.has(actionKey(action)));
    if (!commonActions.length) return null;

    const variants = indexes.map((index) => {
      const plan = plans[index];
      return {
        index,
        plan,
        actions: plan.actions.filter((action) => !commonKeys.has(actionKey(action)))
      };
    });
    if (!variants.every((variant) => variant.actions.length === 1)) return null;

    const variantPointBands = new Set(variants.map((variant) => variant.actions[0].target.points));
    return {
      indexes,
      commonActions,
      variants,
      sameBand: variantPointBands.size === 1,
      commonPoints: actionPoints(commonActions)
    };
  }

  function findCompactGroup(plans) {
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
      Number(b.sameBand) - Number(a.sameBand)
      || b.indexes.length - a.indexes.length
      || a.indexes[0] - b.indexes[0]
      || a.commonPoints - b.commonPoints
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
  }

  function pickLabel(variant) {
    const action = variant.actions[0];
    return bossMissionName(action.target);
  }

  function pickOption(variant, current) {
    const selected = variant.index === selectedRecommendationIndex;
    const action = variant.actions[0];
    const lower = lowerMissionText(action);
    return `
      <article class="recommendation-plan recommendation-pick-option${selected ? ' selected' : ''}" data-recommendation-plan="${variant.index}">
        <span class="recommendation-pick-copy">
          <strong>${escapeHtml(pickLabel(variant))}</strong>
          <small>+${number.format(action.points)} · 예상 ${number.format(planExpected(current, variant.plan))}점${lower ? ` · ${escapeHtml(lower)}` : ''}</small>
        </span>
        <button type="button" class="recommendation-plan-select" data-select-recommendation-plan="${variant.index}" aria-pressed="${selected}">${selected ? '선택됨' : '이 조합 선택'}</button>
      </article>`;
  }

  function optionSummary(variants) {
    const labels = variants.map(pickLabel);
    const pointBands = [...new Set(variants.map((variant) => variant.actions[0].target.points))];
    const pointCopy = pointBands.length === 1 ? `${number.format(pointBands[0])}점 보스 택1` : '보스 택1';
    return `${pointCopy}: ${labels.map((label) => escapeHtml(label)).join(' / ')}`;
  }

  function renderMergedRecommendation(target, needed, plans, current, group) {
    const commonPoints = actionPoints(group.commonActions);
    el.recommendationResult.classList.add('compact-grouped', 'route-merged');
    el.recommendationResult.innerHTML = `
      <h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3>
      <p>겹치는 보스는 한 번만 표시했습니다. 공통 미션을 잡고, 같은 줄의 선택지만 고르면 됩니다.</p>
      <section class="recommendation-route-group">
        <div class="recommendation-route-block">
          <div class="recommendation-route-title"><strong>공통 미션</strong><span>모든 묶음 추천안 공통 · +${number.format(commonPoints)}</span></div>
          <div class="recommendation-route-bosses">${group.commonActions.map(routePill).join('')}</div>
        </div>
        <div class="recommendation-route-block">
          <div class="recommendation-route-title"><strong>달라지는 선택지</strong><span>${optionSummary(group.variants)}</span></div>
          <div class="recommendation-option-strip">${group.variants.map((variant) => pickOption(variant, current)).join('')}</div>
        </div>
        ${group.rest.length ? `
          <div class="recommendation-extra-plans">
            <div class="recommendation-subheading"><strong>다른 대체안</strong><span>위 묶음과 다른 루트입니다.</span></div>
            ${group.rest.map(({ plan, index }) => recommendationPlanHtml(plan, index, current)).join('')}
          </div>` : ''}
      </section>`;
    el.applyRecommendationButton.textContent = '선택 조합 적용';
    el.applyRecommendationButton.disabled = false;
  }

  renderRecommendation = function compactRouteRecommendationRender() {
    const profile = activeProfile();
    const target = DATA.tiers.find((tier) => tier.id === profile.targetTierId) || DATA.tiers[1];
    const current = levelPoints(profile.level) + bossPoints(profile.clearedBossIds);
    const needed = Math.max(0, target.threshold - current);

    if (!needed) {
      recommendationIds = [];
      recommendationOptions = [];
      selectedRecommendationIndex = 0;
      el.recommendationResult.classList.remove('compact-grouped', 'route-merged');
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
      el.recommendationResult.classList.remove('compact-grouped', 'route-merged');
      el.recommendationResult.innerHTML = `<h3>${escapeHtml(target.name)}까지 ${number.format(needed)}점 필요</h3><p>현재 보스 미션만으로는 목표에 도달하지 못합니다. 레벨을 올리거나 상위 보스를 확인해 주세요.</p>`;
      el.applyRecommendationButton.textContent = '추천 적용';
      el.applyRecommendationButton.disabled = true;
      return;
    }

    const group = findCompactGroup(plans);
    if (group) {
      renderMergedRecommendation(target, needed, plans, current, group);
      return;
    }

    el.recommendationResult.classList.remove('compact-grouped', 'route-merged');
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
    if (!button || !el.recommendationResult.classList.contains('route-merged')) return;
    const index = Number(button.dataset.selectRecommendationPlan);
    requestAnimationFrame(() => {
      el.recommendationResult.querySelectorAll('.recommendation-pick-option').forEach((card) => {
        const cardIndex = Number(card.dataset.recommendationPlan);
        const selected = cardIndex === selectedRecommendationIndex;
        const selectButton = card.querySelector('[data-select-recommendation-plan]');
        card.classList.toggle('selected', selected);
        if (selectButton) {
          selectButton.setAttribute('aria-pressed', String(selected));
          selectButton.textContent = selected ? '선택됨' : '이 조합 선택';
        }
      });
      if (Number.isFinite(index)) el.applyRecommendationButton.textContent = `선택 ${index + 1} 적용`;
    });
  });

  installStyles();
  renderRecommendation();
})();
