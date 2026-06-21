(() => {
  'use strict';

  if (window.__kirakiTierBenefitDeltaLoaded) return;
  window.__kirakiTierBenefitDeltaLoaded = true;

  const benefitOrder = ['beginner', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'sapphire'];
  const benefitByTierId = {
    bronze: 'bronze',
    silver: 'silver',
    gold: 'gold',
    platinum: 'platinum',
    emerald: 'emerald',
    sapphire: 'sapphire',
    diamond: 'sapphire',
    master: 'sapphire',
    challenger: 'sapphire'
  };

  const benefitRows = {
    beginner: { name: '비기너', values: { exp: 1.5, attack: 50, normalDamage: 100, bossDamage: 30, ignoreDefense: 30, buffDuration: 30, critRate: 30, critDamage: 30, statusResist: 30, allStat: 50, hpMp: 2500, summonDuration: 10, stanceDuration: 10, dropMesoMultiplier: 2, runeDuration: 50, mesoExtra: 0, itemDropExtra: 0 } },
    bronze: { name: '브론즈', values: { exp: 1.5, attack: 50, normalDamage: 150, bossDamage: 30, ignoreDefense: 30, buffDuration: 30, critRate: 30, critDamage: 30, statusResist: 30, allStat: 100, hpMp: 2500, summonDuration: 10, stanceDuration: 10, dropMesoMultiplier: 2, runeDuration: 50, mesoExtra: 0, itemDropExtra: 0 } },
    silver: { name: '실버', values: { exp: 1.5, attack: 55, normalDamage: 150, bossDamage: 40, ignoreDefense: 40, buffDuration: 30, critRate: 30, critDamage: 30, statusResist: 30, allStat: 100, hpMp: 3000, summonDuration: 10, stanceDuration: 10, dropMesoMultiplier: 2, runeDuration: 50, mesoExtra: 0, itemDropExtra: 0 } },
    gold: { name: '골드', values: { exp: 1.5, attack: 55, normalDamage: 150, bossDamage: 50, ignoreDefense: 50, buffDuration: 30, critRate: 30, critDamage: 30, statusResist: 30, allStat: 100, hpMp: 3500, summonDuration: 10, stanceDuration: 10, dropMesoMultiplier: 2, runeDuration: 50, mesoExtra: 0, itemDropExtra: 0 } },
    platinum: { name: '플래티넘', values: { exp: 1.5, attack: 70, normalDamage: 150, bossDamage: 60, ignoreDefense: 50, buffDuration: 30, critRate: 30, critDamage: 35, statusResist: 30, allStat: 100, hpMp: 4500, summonDuration: 10, stanceDuration: 10, dropMesoMultiplier: 2, runeDuration: 50, mesoExtra: 0, itemDropExtra: 0 } },
    emerald: { name: '에메랄드', values: { exp: 1.5, attack: 80, normalDamage: 150, bossDamage: 70, ignoreDefense: 70, buffDuration: 40, critRate: 30, critDamage: 40, statusResist: 30, allStat: 100, hpMp: 5000, summonDuration: 10, stanceDuration: 10, dropMesoMultiplier: 2, runeDuration: 50, mesoExtra: 0, itemDropExtra: 0 } },
    sapphire: { name: '사파이어 이상', values: { exp: 1.5, attack: 80, normalDamage: 150, bossDamage: 70, ignoreDefense: 70, buffDuration: 60, critRate: 30, critDamage: 40, statusResist: 30, allStat: 100, hpMp: 5000, summonDuration: 10, stanceDuration: 10, dropMesoMultiplier: 2, runeDuration: 50, mesoExtra: 20, itemDropExtra: 20 } }
  };

  const fields = [
    { key: 'attack', label: '공격력/마력', unit: '', suffix: ' 증가' },
    { key: 'normalDamage', label: '일반 몬스터 데미지', unit: '%', suffix: ' 증가' },
    { key: 'bossDamage', label: '보스 몬스터 데미지', unit: '%', suffix: ' 증가' },
    { key: 'ignoreDefense', label: '방어율 무시', unit: '%', suffix: ' 증가' },
    { key: 'buffDuration', label: '버프 지속시간', unit: '%', suffix: ' 증가' },
    { key: 'critRate', label: '크리티컬 확률', unit: '%', suffix: ' 증가' },
    { key: 'critDamage', label: '크리티컬 데미지', unit: '%', suffix: ' 증가' },
    { key: 'allStat', label: '올스탯', unit: '', suffix: ' 증가' },
    { key: 'hpMp', label: '최대 HP/MP', unit: '', suffix: ' 증가' },
    { key: 'mesoExtra', label: '메소 획득량', unit: '%', suffix: ' 증가', hideWhenZero: true },
    { key: 'itemDropExtra', label: '아이템 드롭률', unit: '%', suffix: ' 증가', hideWhenZero: true },
    { key: 'exp', label: '경험치 획득량', unit: '배', suffix: '로 증가' },
    { key: 'statusResist', label: '상태이상 내성', unit: '%', suffix: ' 증가' },
    { key: 'summonDuration', label: '소환수 지속시간', unit: '%', suffix: ' 증가' },
    { key: 'stanceDuration', label: '스탠스 지속시간', unit: '%', suffix: ' 증가' },
    { key: 'dropMesoMultiplier', label: '아이템 드롭/메소 기본 배율', unit: '배', suffix: '' },
    { key: 'runeDuration', label: '해방된 룬의 힘 지속시간', unit: '%', suffix: ' 증가' }
  ];

  function installStyles() {
    if (document.querySelector('#kirakiTierBenefitDeltaStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiTierBenefitDeltaStyles';
    style.textContent = `
.tier-benefit-panel{display:grid;gap:11px;margin:12px 0 14px;padding:13px;border:1px solid color-mix(in srgb,#38bdf8 38%,var(--line));border-radius:13px;background:linear-gradient(135deg,color-mix(in srgb,#e0f7ff 56%,var(--surface)),var(--surface));box-shadow:0 10px 24px rgba(14,116,144,.08)}
.tier-benefit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.tier-benefit-head strong{color:var(--ink);font-size:.92rem;font-weight:900}.tier-benefit-head span{color:color-mix(in srgb,#0ea5e9 76%,var(--muted));font-size:.72rem;font-weight:900;white-space:nowrap}
.tier-benefit-route{display:flex;align-items:center;flex-wrap:wrap;gap:6px;color:var(--muted);font-size:.75rem;font-weight:850}.tier-benefit-route b{color:var(--ink);font-weight:900}.tier-benefit-arrow{color:#0ea5e9;font-weight:900}
.tier-benefit-delta-list{display:flex;flex-wrap:wrap;gap:6px}.tier-benefit-delta{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:4px 8px;border:1px solid color-mix(in srgb,#38bdf8 34%,var(--line));border-radius:999px;background:color-mix(in srgb,#ecfeff 72%,var(--surface));font-size:.7rem;font-weight:850;color:var(--ink)}.tier-benefit-delta em{font-style:normal;color:#0284c7;font-weight:950}.tier-benefit-empty{margin:0;color:var(--muted);font-size:.75rem;font-weight:800;line-height:1.5}
.tier-benefit-values{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.tier-benefit-value{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:31px;padding:6px 8px;border:1px solid color-mix(in srgb,var(--line) 82%,transparent);border-radius:9px;background:color-mix(in srgb,var(--soft) 72%,var(--surface));font-size:.7rem}.tier-benefit-value span{color:var(--muted);font-weight:800;min-width:0}.tier-benefit-value strong{color:var(--ink);font-weight:950;white-space:nowrap}.tier-benefit-value strong.changed{color:#0284c7;text-shadow:0 0 12px rgba(56,189,248,.28)}
@media(max-width:560px){.tier-benefit-head{display:grid}.tier-benefit-head span{white-space:normal}.tier-benefit-values{grid-template-columns:1fr}}
`;
    document.head.append(style);
  }

  function benefitIdForTier(tierId) {
    return benefitByTierId[tierId] || 'beginner';
  }

  function benefitIndex(id) {
    return benefitOrder.indexOf(id);
  }

  function currentBenefitId() {
    const profile = activeProfile();
    const total = levelPoints(profile.level) + bossPoints(profile.clearedBossIds);
    const current = tierState(total).current;
    return benefitIdForTier(current?.id);
  }

  function targetBenefitId() {
    return benefitIdForTier(activeProfile().targetTierId || el.targetTierSelect?.value);
  }

  function previousBenefitId(id) {
    const index = benefitIndex(id);
    return benefitOrder[Math.max(0, index - 1)] || 'beginner';
  }

  function valueText(field, value) {
    const formatted = Number.isInteger(value) ? number.format(value) : String(value);
    return `${formatted}${field.unit}${field.suffix}`;
  }

  function deltaText(field, before, after) {
    const diff = after - before;
    if (!diff) return '';
    const sign = diff > 0 ? '+' : '';
    const formatted = Number.isInteger(diff) ? number.format(diff) : String(diff);
    return `${sign}${formatted}${field.unit}`;
  }

  function ensurePanel() {
    let panel = document.querySelector('#tierBenefitDelta');
    if (panel) return panel;
    const anchor = document.querySelector('.recommendation-controls');
    if (!anchor) return null;
    panel = document.createElement('section');
    panel.id = 'tierBenefitDelta';
    panel.className = 'tier-benefit-panel';
    panel.setAttribute('aria-live', 'polite');
    anchor.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function rowLabel(id, appTierId) {
    const row = benefitRows[id] || benefitRows.beginner;
    const appTier = DATA.tiers.find((tier) => tier.id === appTierId);
    if (id === 'sapphire' && appTier && !['sapphire'].includes(appTier.id)) return `${appTier.name} (${row.name})`;
    return appTier?.name || row.name;
  }

  function renderBenefitPanel() {
    installStyles();
    const panel = ensurePanel();
    if (!panel) return;

    const currentId = currentBenefitId();
    const targetId = targetBenefitId();
    const currentRow = benefitRows[currentId] || benefitRows.beginner;
    const targetRow = benefitRows[targetId] || benefitRows.beginner;
    const previousRow = benefitRows[previousBenefitId(targetId)] || benefitRows.beginner;
    const currentIndex = benefitIndex(currentId);
    const targetIndex = benefitIndex(targetId);
    const targetTierId = activeProfile().targetTierId || el.targetTierSelect?.value;

    const changedFromCurrent = fields
      .filter((field) => targetRow.values[field.key] !== currentRow.values[field.key])
      .filter((field) => !(field.hideWhenZero && targetRow.values[field.key] === 0));
    const deltaHtml = changedFromCurrent.length && targetIndex > currentIndex
      ? changedFromCurrent.map((field) => `
        <span class="tier-benefit-delta"><span>${escapeHtml(field.label)}</span><em>${escapeHtml(deltaText(field, currentRow.values[field.key], targetRow.values[field.key]))}</em></span>`).join('')
      : '<p class="tier-benefit-empty">목표 티어가 현재 혜택 이하라 추가 상승 수치는 없습니다.</p>';

    const valueHtml = fields
      .filter((field) => !(field.hideWhenZero && targetRow.values[field.key] === 0))
      .map((field) => {
        const changedFromPrevious = targetRow.values[field.key] !== previousRow.values[field.key];
        return `
          <div class="tier-benefit-value">
            <span>${escapeHtml(field.label)}</span>
            <strong class="${changedFromPrevious ? 'changed' : ''}">${escapeHtml(valueText(field, targetRow.values[field.key]))}</strong>
          </div>`;
      }).join('');

    panel.innerHTML = `
      <div class="tier-benefit-head">
        <strong>티어 버프 변화</strong>
        <span>하늘색: 전 단계 대비 상승</span>
      </div>
      <div class="tier-benefit-route"><b>${escapeHtml(currentRow.name)}</b><span class="tier-benefit-arrow">→</span><b>${escapeHtml(rowLabel(targetId, targetTierId))}</b></div>
      <div class="tier-benefit-delta-list">${deltaHtml}</div>
      <div class="tier-benefit-values">${valueHtml}</div>`;
  }

  function wrapRenderers() {
    if (!window.__kirakiTierBenefitRenderWrapped && typeof renderSummary === 'function') {
      window.__kirakiTierBenefitRenderWrapped = true;
      const baseRenderSummary = renderSummary;
      renderSummary = function tierBenefitSummaryRender() {
        const result = baseRenderSummary();
        requestAnimationFrame(renderBenefitPanel);
        return result;
      };
    }

    if (!window.__kirakiTierBenefitRecommendationWrapped && typeof renderRecommendation === 'function') {
      window.__kirakiTierBenefitRecommendationWrapped = true;
      const baseRenderRecommendation = renderRecommendation;
      renderRecommendation = function tierBenefitRecommendationRender() {
        const result = baseRenderRecommendation();
        requestAnimationFrame(renderBenefitPanel);
        return result;
      };
    }
  }

  function boot() {
    wrapRenderers();
    renderBenefitPanel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();