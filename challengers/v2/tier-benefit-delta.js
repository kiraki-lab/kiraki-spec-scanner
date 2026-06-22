(() => {
  'use strict';

  if (window.__kirakiTierBenefitDeltaVersion === '0.1.2') return;
  window.__kirakiTierBenefitDeltaVersion = '0.1.2';
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

  const zeroValues = {
    attack: 0,
    normalDamage: 0,
    bossDamage: 0,
    ignoreDefense: 0,
    buffDuration: 0,
    critDamage: 0,
    allStat: 0,
    hpMp: 0,
    mesoExtra: 0,
    itemDropExtra: 0
  };

  const benefitRows = {
    beginner: { name: '비기너', values: { ...zeroValues } },
    bronze: {
      name: '브론즈',
      values: { ...zeroValues, normalDamage: 50 }
    },
    silver: {
      name: '실버',
      values: { ...zeroValues, normalDamage: 50, attack: 5, bossDamage: 10, ignoreDefense: 10, hpMp: 500, allStat: 10 }
    },
    gold: {
      name: '골드',
      values: { ...zeroValues, normalDamage: 50, attack: 10, bossDamage: 20, ignoreDefense: 20, hpMp: 1000, allStat: 20 }
    },
    platinum: {
      name: '플래티넘',
      values: { ...zeroValues, normalDamage: 50, attack: 20, bossDamage: 30, ignoreDefense: 30, critDamage: 5, hpMp: 2000, allStat: 40 }
    },
    emerald: {
      name: '에메랄드',
      values: { ...zeroValues, normalDamage: 50, attack: 30, bossDamage: 40, ignoreDefense: 40, critDamage: 10, buffDuration: 30, hpMp: 2500, allStat: 50 }
    },
    sapphire: {
      name: '사파이어 이상',
      values: { ...zeroValues, normalDamage: 50, attack: 30, bossDamage: 40, ignoreDefense: 40, critDamage: 10, buffDuration: 30, hpMp: 2500, allStat: 50, mesoExtra: 20, itemDropExtra: 20 }
    }
  };

  const fields = [
    { key: 'attack', label: '공격력/마력', unit: '' },
    { key: 'normalDamage', label: '일반 몬스터 데미지', unit: '%' },
    { key: 'bossDamage', label: '보스 몬스터 데미지', unit: '%' },
    { key: 'ignoreDefense', label: '방어율 무시', unit: '%' },
    { key: 'critDamage', label: '크리티컬 데미지', unit: '%' },
    { key: 'buffDuration', label: '버프 지속시간', unit: '%' },
    { key: 'allStat', label: '올스탯', unit: '' },
    { key: 'hpMp', label: '최대 HP/MP', unit: '' },
    { key: 'mesoExtra', label: '메소 획득량', unit: '%', hideWhenZero: true },
    { key: 'itemDropExtra', label: '아이템 드롭률', unit: '%', hideWhenZero: true }
  ];

  function installStyles() {
    if (document.querySelector('#kirakiTierBenefitDeltaStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiTierBenefitDeltaStyles';
    style.textContent = `
.tier-benefit-panel{display:grid;gap:10px;margin:15px 0 0;padding:13px;border:1px solid color-mix(in srgb,#38bdf8 36%,var(--line));border-radius:13px;background:linear-gradient(135deg,color-mix(in srgb,#ecfeff 68%,var(--surface)),var(--surface));box-shadow:0 10px 22px rgba(14,116,144,.07)}
.tier-benefit-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.tier-benefit-head strong{color:var(--ink);font-size:.92rem;font-weight:900}.tier-benefit-head span{color:#0284c7;font-size:.72rem;font-weight:900;white-space:nowrap}
.tier-benefit-route{display:flex;align-items:center;flex-wrap:wrap;gap:6px;color:var(--muted);font-size:.76rem;font-weight:850}.tier-benefit-route b{color:var(--ink);font-weight:900}.tier-benefit-arrow{color:#0ea5e9;font-weight:900}
.tier-benefit-delta-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.tier-benefit-delta{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:34px;padding:7px 9px;border:1px solid color-mix(in srgb,#38bdf8 28%,var(--line));border-radius:10px;background:color-mix(in srgb,#f0fdff 70%,var(--surface));font-size:.72rem;font-weight:850;color:var(--ink)}.tier-benefit-delta span{min-width:0;color:var(--muted)}.tier-benefit-delta em{flex:0 0 auto;font-style:normal;color:#0284c7;font-weight:950;white-space:nowrap}.tier-benefit-empty{margin:0;color:var(--muted);font-size:.78rem;font-weight:800;line-height:1.55}
@media(max-width:760px){.tier-benefit-delta-list{grid-template-columns:1fr}.tier-benefit-head{display:grid}.tier-benefit-head span{white-space:normal}}
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

  function deltaText(before, after, unit) {
    const diff = after - before;
    if (!diff) return '';
    const sign = diff > 0 ? '+' : '';
    const formatted = Number.isInteger(diff) ? number.format(diff) : String(diff);
    return `${sign}${formatted}${unit}`;
  }

  function ensurePanel() {
    let panel = document.querySelector('#tierBenefitDelta');
    const anchor = document.querySelector('.progress-panel .tier-scale') || document.querySelector('.progress-panel .progress-track');
    if (!anchor) return panel;
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'tierBenefitDelta';
      panel.className = 'tier-benefit-panel';
      panel.setAttribute('aria-live', 'polite');
    }
    if (panel.parentElement !== anchor.parentElement || panel.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement('afterend', panel);
    }
    return panel;
  }

  function labelFor(id, appTierId) {
    const row = benefitRows[id] || benefitRows.beginner;
    const appTier = DATA.tiers.find((tier) => tier.id === appTierId);
    if (id === 'sapphire' && appTier && appTier.id !== 'sapphire') return `${appTier.name} (${row.name})`;
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
    const currentIndex = benefitIndex(currentId);
    const targetIndex = benefitIndex(targetId);
    const targetTierId = activeProfile().targetTierId || el.targetTierSelect?.value;

    const changed = fields
      .map((field) => ({ field, before: currentRow.values[field.key] || 0, after: targetRow.values[field.key] || 0 }))
      .filter((item) => item.after !== item.before)
      .filter((item) => !(item.field.hideWhenZero && item.after === 0));

    const deltaHtml = changed.length && targetIndex > currentIndex
      ? changed.map(({ field, before, after }) => `
        <span class="tier-benefit-delta"><span>${escapeHtml(field.label)}</span><em>${escapeHtml(deltaText(before, after, field.unit))}</em></span>`).join('')
      : '<p class="tier-benefit-empty">현재 티어와 목표 티어의 버프 차이가 없습니다.</p>';

    panel.innerHTML = `
      <div class="tier-benefit-head">
        <strong>티어 버프 변화량</strong>
        <span>내 티어 → 목표 티어</span>
      </div>
      <div class="tier-benefit-route"><b>${escapeHtml(labelFor(currentId))}</b><span class="tier-benefit-arrow">→</span><b>${escapeHtml(labelFor(targetId, targetTierId))}</b></div>
      <div class="tier-benefit-delta-list">${deltaHtml}</div>`;
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