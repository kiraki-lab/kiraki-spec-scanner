(() => {
  'use strict';

  if (window.__kirakiSiteReadabilityPolishLoaded) return;
  window.__kirakiSiteReadabilityPolishLoaded = true;

  const style = document.createElement('style');
  style.id = 'kirakiSiteReadabilityPolishStyles';
  style.textContent = `
:root{--readable-line:1.68;--readable-small:.82rem;--readable-tiny:.74rem;--panel-soft-shadow:0 12px 28px rgba(15,23,42,.055)}
body{letter-spacing:0;text-rendering:optimizeLegibility}.panel{box-shadow:var(--panel-soft-shadow)}
.site-header{border-bottom:1px solid color-mix(in srgb,var(--line) 78%,transparent)}.header-inner{gap:18px}.brand-copy h1{line-height:1.18}.brand-copy p:not(.eyebrow){line-height:1.55;max-width:640px}
.page-shell{gap:18px}.section-heading h2,.input-hub-heading h2,.coinshop-head h2{line-height:1.25}.section-heading p,.input-hub-heading p,.coinshop-head p,.section-intro,.micro-copy,.page-note{line-height:var(--readable-line)}
.section-kicker{font-size:.72rem;font-weight:950;letter-spacing:.02em}.button{letter-spacing:0;white-space:normal}.button.small{min-height:36px;padding-inline:12px;line-height:1.25}.icon-button{line-height:1}
.view-tabs{gap:7px;padding:6px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}.view-tab{min-height:44px;border-radius:10px;line-height:1.25}.view-tab.active{box-shadow:0 8px 18px rgba(31,41,55,.09)}
.input-hub{display:grid;gap:16px}.input-card{min-height:0}.input-card-title strong{font-size:.95rem;line-height:1.35}.input-card-title small,.input-help{line-height:1.55}.live-result-row{gap:8px}.mini-score{min-height:70px}.mini-score span,.score-card span,.muted-label{font-weight:850}.mini-score strong,.score-card strong{letter-spacing:0}
.dashboard-grid{align-items:start}.score-grid{gap:9px}.score-card{min-height:88px}.tier-result{gap:10px}.tier-scale span{line-height:1.3}.quick-guide{gap:12px}.quick-guide span{line-height:1.5}
.recommendation-panel{align-self:start}.recommendation-controls{align-items:end}.recommendation-result h3{line-height:1.35}.recommendation-result p{line-height:1.65}.recommendation-action-item{min-height:52px}.recommendation-action-copy small{line-height:1.45}
.boss-filter-panel,.preset-tier-filter-panel{box-shadow:none}.boss-search-field input{font-weight:850}.boss-group{border-radius:14px}.boss-group>summary{gap:10px}.boss-card-grid{gap:9px}.boss-check{border-radius:12px}.boss-check input{width:19px;height:19px;flex:0 0 19px}.boss-copy{gap:4px}.boss-copy strong{line-height:1.35}.boss-copy span{line-height:1.35}
html:not([data-kiraki-admin-open="1"]) #bossCoinSyncCard{display:none!important}
.preset-card,.preset-card-readable{overflow:hidden}.preset-note,.preset-summary,.preset-target-count{word-break:keep-all}.preset-actions{gap:8px;flex-wrap:wrap}.preset-boss-chip{word-break:keep-all}
.coinshop-panel,.event-coinshop-panel,.personal-schedule-panel,.item-burning-panel,.roadmap-journal-panel{word-break:keep-all}.coinshop-card-title,.event-roadmap-head,.schedule-head,.item-burning-head{gap:12px}.coinshop-card-title strong,.event-roadmap-head strong{line-height:1.35}.coinshop-item{box-shadow:0 6px 16px rgba(15,23,42,.035)}.coinshop-item-copy strong{line-height:1.45}.coinshop-item-meta{line-height:1.4}.coinshop-summary strong,.coinshop-income-metric strong{letter-spacing:0}.coinshop-season-select{min-height:104px}.coinshop-season-select-title strong{line-height:1.35}.coinshop-season-earned{line-height:1.35}
.field input,.field select,.field textarea,.coinshop-budget-inputs input,.coinshop-season-select select{font-size:.9rem}.field>span,.coinshop-budget-inputs label span{line-height:1.35}.utility-popover{box-shadow:0 18px 36px rgba(15,23,42,.16)}
@media(max-width:900px){.page-shell{gap:14px}.dashboard-grid{gap:12px}.view-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.recommendation-controls{grid-template-columns:1fr}.recommendation-controls .button{width:100%}.coinshop-income-total{min-height:108px}}
@media(max-width:620px){body{font-size:15px}.panel{padding:15px}.site-header{position:static}.header-inner,.input-hub-heading,.section-heading,.coinshop-head{display:grid;gap:10px}.header-actions{justify-content:stretch}.theme-toggle,.header-button{width:100%}.view-tabs{grid-template-columns:1fr}.score-grid,.live-result-row{grid-template-columns:1fr}.score-card,.mini-score{min-height:72px}.boss-bulk-actions,.boss-expand-actions{grid-template-columns:1fr}.coinshop-item{padding:11px}.coinshop-icon{width:40px;height:40px;flex-basis:40px}.coinshop-qty{width:100%;justify-content:stretch}.coinshop-qty input{width:100%}}
@media(max-width:420px){.button.small{width:100%}.preset-detail-row{grid-template-columns:1fr}.coinshop-draft-actions,.input-inline-actions,.profile-input-row{display:grid;grid-template-columns:1fr}.level-stepper{grid-template-columns:42px minmax(0,1fr) 42px}}
`;
  document.head.append(style);

  function syncAdminOpenState() {
    let unlocked = false;
    try { unlocked = typeof isAdminUnlocked === 'function' && isAdminUnlocked(); } catch {}
    document.documentElement.dataset.kirakiAdminOpen = unlocked ? '1' : '0';
  }

  function wrapAdminUnlock() {
    if (window.__kirakiReadabilityAdminGuardWrapped || typeof setAdminUnlocked !== 'function') return;
    window.__kirakiReadabilityAdminGuardWrapped = true;
    const baseSetAdminUnlocked = setAdminUnlocked;
    setAdminUnlocked = function readabilityAdminGuard(unlocked) {
      const result = baseSetAdminUnlocked.apply(this, arguments);
      syncAdminOpenState();
      return result;
    };
  }

  syncAdminOpenState();
  document.addEventListener('click', () => setTimeout(syncAdminOpenState, 0), true);
  document.addEventListener('visibilitychange', syncAdminOpenState);
  setTimeout(() => { wrapAdminUnlock(); syncAdminOpenState(); }, 0);
  setTimeout(() => { wrapAdminUnlock(); syncAdminOpenState(); }, 250);
})();
