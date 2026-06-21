(() => {
  'use strict';

  if (window.__kirakiRecommendationDuskPriorityLoaded) return;
  window.__kirakiRecommendationDuskPriorityLoaded = true;
  if (typeof compareRecommendationPlans !== 'function') return;

  const baseCompareRecommendationPlans = compareRecommendationPlans;
  const midBandMin = 2000;
  const midBandMax = 3000;
  const midBandSortValue = 2500;

  function isMidBand(points) {
    const value = Number(points) || 0;
    return value >= midBandMin && value <= midBandMax;
  }

  function normalizedMaxBand(plan) {
    const maxBand = Number(plan?.maxBand) || 0;
    return isMidBand(maxBand) ? midBandSortValue : maxBand;
  }

  function hasChaosDusk(plan) {
    return Array.isArray(plan?.actions) && plan.actions.some((action) => action?.target?.id === 'dusk-chaos');
  }

  function duskFirstRank(plan) {
    return isMidBand(plan?.maxBand) && hasChaosDusk(plan) ? 0 : 1;
  }

  compareRecommendationPlans = function compareDuskFirstRecommendationPlans(a, b, needed = 0) {
    return normalizedMaxBand(a) - normalizedMaxBand(b)
      || duskFirstRank(a) - duskFirstRank(b)
      || baseCompareRecommendationPlans(a, b, needed);
  };
})();
