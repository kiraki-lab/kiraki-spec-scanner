(() => {
  const style = document.createElement('style');
  style.textContent = `
body{font-size:16px;line-height:1.55;word-break:keep-all}
.field{font-size:.84rem;font-weight:800}.field>span{color:var(--ink)}
.section-intro{font-size:.9rem;line-height:1.7}.micro-copy{font-size:.78rem;line-height:1.55}
.button.small,.file-button.small{font-size:.82rem}.view-tab{font-size:.9rem}
.score-card span,.muted-label{font-size:.78rem}.score-card strong{font-size:1.35rem}
.next-tier-copy{font-size:.88rem}.recommendation-result p{font-size:.86rem}.recommendation-list li{font-size:.82rem}

.recommendation-result{max-height:520px;padding:13px}
.recommendation-plan-list{display:grid;gap:9px;margin-top:10px}
.recommendation-plan{display:grid;gap:9px;padding:11px;border:1px solid var(--line);border-radius:11px;background:var(--surface);transition:border-color .12s ease,box-shadow .12s ease,background .12s ease}
.recommendation-plan.selected{border-color:var(--accent);background:color-mix(in srgb,var(--accent2) 38%,var(--surface));box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 10%,transparent)}
.recommendation-plan-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.recommendation-plan-header>div{display:grid;gap:3px}.recommendation-plan-header>div>strong{font-size:.9rem;font-weight:900}.recommendation-plan-header small{color:var(--muted);font-size:.68rem;line-height:1.45}
.recommendation-plan-header>span{flex:0 0 auto;color:var(--accent);font-size:.78rem;font-weight:900;white-space:nowrap}
.recommendation-plan .recommendation-list{gap:6px}
.recommendation-action-item{align-items:center!important;padding:8px 9px!important;border:1px solid color-mix(in srgb,var(--line) 80%,transparent);background:color-mix(in srgb,var(--soft) 70%,var(--surface))!important}
.recommendation-action-copy{display:grid;gap:3px;min-width:0}.recommendation-action-copy>strong{font-size:.8rem;font-weight:900}.recommendation-action-copy small{color:var(--muted);font-size:.68rem;line-height:1.45}
.recommendation-action-points{flex:0 0 auto;color:var(--accent);font-size:.78rem;font-weight:900;white-space:nowrap}
.recommendation-plan-select{justify-self:end;min-height:31px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);font-size:.72rem;font-weight:850;cursor:pointer}
.recommendation-plan-select:hover{border-color:var(--accent);color:var(--accent)}
.recommendation-plan.selected .recommendation-plan-select{border-color:var(--accent);background:var(--accent);color:#fff}

.preset-tier-filter-panel{display:grid;gap:13px;margin-bottom:16px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
.preset-tier-filter-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:14px}
.preset-tier-filter-heading>div:first-child{display:grid;gap:3px}.preset-tier-filter-heading strong{font-size:1rem;font-weight:900}.preset-tier-filter-heading span{color:var(--muted);font-size:.8rem}
.preset-tier-actions{display:flex;gap:7px;flex:0 0 auto}
.preset-tier-checklist{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px}
.preset-tier-choice{display:flex;align-items:center;gap:10px;min-height:64px;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface);cursor:pointer;transition:border-color .12s ease,background .12s ease,transform .12s ease,box-shadow .12s ease}
.preset-tier-choice:hover:not(.disabled){transform:translateY(-1px);border-color:var(--accent)}
.preset-tier-choice.selected{border-color:var(--accent);background:var(--accent2);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 10%,transparent)}
.preset-tier-choice.disabled{cursor:not-allowed;opacity:.46}.preset-tier-choice input{width:20px;height:20px;margin:0;accent-color:var(--accent)}
.preset-tier-choice>span{display:grid;gap:3px;min-width:0}.preset-tier-choice strong{font-size:.9rem;font-weight:900}.preset-tier-choice small{color:var(--muted);font-size:.72rem;white-space:nowrap}

.preset-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:14px!important;overflow:visible!important;padding:0!important;width:100%}
.preset-tier-group{width:100%;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:15px;background:var(--surface);box-shadow:var(--shadow)}
.preset-tier-group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:62px;padding:0 17px;background:var(--soft);list-style:none;cursor:pointer}
.preset-tier-group>summary::-webkit-details-marker{display:none}.preset-tier-group>summary:after{content:'펼치기';color:var(--muted);font-size:.74rem;font-weight:800}.preset-tier-group[open]>summary:after{content:'접기'}
.preset-tier-group-title{display:flex;align-items:baseline;gap:10px}.preset-tier-group-title strong{font-size:1.08rem;font-weight:900}.preset-tier-group-title small{color:var(--muted);font-size:.8rem;font-weight:800}
.preset-tier-group-count{margin-left:auto;color:var(--muted);font-size:.78rem;font-weight:800}
.preset-tier-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;padding:16px;align-items:stretch}
.preset-tier-card-grid.single-card{grid-template-columns:minmax(0,620px);justify-content:start}
.preset-tier-card-grid.two-cards{grid-template-columns:repeat(2,minmax(0,1fr))}

.preset-card-readable{display:flex;flex-direction:column;gap:12px;width:100%;max-width:none;min-width:0;min-height:0;padding:18px;border-radius:14px}
.preset-card-readable .preset-topline{margin:0}
.preset-title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
.preset-title-row h3{margin:0;min-width:0;font-size:1.15rem;font-weight:900;letter-spacing:-.025em;line-height:1.4}
.preset-total-score{flex:0 0 auto;color:var(--accent);font-size:1.18rem;font-weight:900;white-space:nowrap}
.preset-card-readable .preset-summary{margin:0;color:var(--ink);font-size:.9rem;font-weight:750;line-height:1.65}
.preset-key-bosses{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 10px;align-items:start;padding:11px 12px;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:11px;background:color-mix(in srgb,var(--accent2) 55%,var(--surface))}
.preset-key-bosses-label{padding-top:4px;color:var(--accent);font-size:.73rem;font-weight:900;white-space:nowrap}
.preset-key-bosses-list{display:flex;flex-wrap:wrap;gap:6px;min-width:0}
.preset-boss-chip{display:inline-flex;align-items:center;min-height:27px;padding:4px 9px;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line));border-radius:999px;background:var(--surface);color:var(--ink);font-size:.75rem;font-weight:850;line-height:1.3}
.preset-boss-chip.more{color:var(--muted);font-weight:750}
.preset-metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.preset-metric{display:grid;gap:4px;padding:11px 12px;border:1px solid var(--line);border-radius:11px;background:var(--soft)}
.preset-metric span{color:var(--muted);font-size:.7rem;font-weight:750}.preset-metric strong{font-size:.96rem;font-weight:900}
.preset-detail-row{display:flex;flex-wrap:wrap;gap:6px}
.preset-detail-row span{display:inline-flex;align-items:center;min-height:27px;padding:4px 8px;border-radius:999px;background:var(--soft);color:var(--muted);font-size:.72rem;font-weight:750}
.preset-card-readable .preset-note{display:block;margin:0;color:var(--muted);font-size:.83rem;line-height:1.65;overflow:visible;-webkit-line-clamp:unset;-webkit-box-orient:unset}
.preset-card-readable .preset-actions{margin-top:auto;padding-top:2px}
.preset-card-readable .preset-actions .button{min-width:130px}

.boss-filter-panel{grid-template-columns:minmax(260px,1.35fr) minmax(155px,.55fr) minmax(250px,.9fr)}
.boss-action-stack{display:grid;gap:7px}.boss-bulk-actions,.boss-expand-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.boss-group>summary{min-height:58px;padding:8px 14px}.boss-group-title{display:flex;align-items:center;flex-wrap:wrap;gap:7px 10px;min-width:0}
.boss-group-score{color:var(--accent);font-size:.98rem;font-weight:900;white-space:nowrap}.boss-group-names{color:var(--ink);font-size:.88rem;font-weight:800;line-height:1.45}.boss-group-meta{margin-left:auto;color:var(--muted);font-size:.72rem;font-weight:800;white-space:nowrap}
.boss-check{min-height:74px;padding:13px}.boss-copy strong{font-size:.9rem;font-weight:900}.boss-copy span{font-size:.76rem}.boss-group>summary:after{flex:0 0 auto}
.empty-state{font-size:.88rem;line-height:1.6}

@media(max-width:1050px){
  .preset-tier-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .preset-tier-card-grid.single-card{grid-template-columns:minmax(0,620px)}
  .boss-filter-panel{grid-template-columns:minmax(0,1fr) 180px}.boss-action-stack{grid-column:1/-1;grid-template-columns:1fr 1fr}
}
@media(max-width:760px){
  body{font-size:15px}
  .recommendation-plan-header{display:grid;gap:5px}.recommendation-plan-header>span{white-space:normal}.recommendation-plan-select{justify-self:stretch}
  .preset-tier-filter-heading{align-items:stretch;flex-direction:column}.preset-tier-actions{display:grid;grid-template-columns:1fr 1fr}
  .preset-tier-checklist{grid-template-columns:repeat(2,minmax(0,1fr))}
  .preset-tier-card-grid,.preset-tier-card-grid.single-card,.preset-tier-card-grid.two-cards{grid-template-columns:1fr;padding:11px}
  .preset-card-readable{padding:16px}.preset-title-row{align-items:flex-start}.preset-key-bosses{grid-template-columns:1fr}.preset-key-bosses-label{padding-top:0}.preset-metric-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .boss-filter-panel{grid-template-columns:1fr}.boss-action-stack{grid-column:auto;grid-template-columns:1fr}.boss-group-title{gap:5px 8px}.boss-group-meta{width:100%;margin-left:0}.boss-group>summary:after{align-self:flex-start;margin-top:4px}
}
@media(max-width:470px){
  .recommendation-action-item{align-items:flex-start!important}.recommendation-action-points{padding-top:2px}
  .preset-tier-checklist{grid-template-columns:1fr}.preset-tier-choice{min-height:56px}
  .preset-title-row{display:grid;gap:6px}.preset-total-score{font-size:1.1rem}
  .preset-key-bosses-list{display:grid;grid-template-columns:1fr}.preset-boss-chip{justify-content:center;text-align:center}
  .preset-metric-grid{grid-template-columns:1fr}.preset-detail-row{display:grid;grid-template-columns:1fr 1fr}.preset-detail-row span{justify-content:center;text-align:center}
  .preset-card-readable .preset-actions{display:grid}.preset-card-readable .preset-actions .button{width:100%}
  .boss-bulk-actions,.boss-expand-actions{grid-template-columns:1fr 1fr}
}
`;
  document.head.append(style);
})();
