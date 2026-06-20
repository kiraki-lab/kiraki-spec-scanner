(() => {
  const style = document.createElement('style');
  style.textContent = `
body{font-size:16px;line-height:1.55;word-break:keep-all}
.field{font-size:.84rem;font-weight:800}.field>span{color:var(--ink)}
.section-intro{font-size:.9rem;line-height:1.7}.micro-copy{font-size:.78rem;line-height:1.55}
.button.small,.file-button.small{font-size:.82rem}.view-tab{font-size:.9rem}
.score-card span,.muted-label{font-size:.78rem}.score-card strong{font-size:1.35rem}
.next-tier-copy{font-size:.88rem}.recommendation-result p{font-size:.86rem}.recommendation-list li{font-size:.82rem}
.preset-tier-filter-panel{display:grid;gap:12px;margin-bottom:14px;padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
.preset-tier-filter-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:14px}
.preset-tier-filter-heading>div:first-child{display:grid;gap:3px}.preset-tier-filter-heading strong{font-size:.96rem;font-weight:900}.preset-tier-filter-heading span{color:var(--muted);font-size:.78rem}
.preset-tier-actions{display:flex;gap:7px;flex:0 0 auto}
.preset-tier-checklist{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.preset-tier-choice{display:flex;align-items:center;gap:9px;min-height:58px;padding:10px 11px;border:1px solid var(--line);border-radius:11px;background:var(--surface);cursor:pointer;transition:border-color .12s ease,background .12s ease,transform .12s ease}
.preset-tier-choice:hover:not(.disabled){transform:translateY(-1px);border-color:var(--accent)}
.preset-tier-choice.selected{border-color:var(--accent);background:var(--accent2);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 10%,transparent)}
.preset-tier-choice.disabled{cursor:not-allowed;opacity:.46}.preset-tier-choice input{width:19px;height:19px;margin:0;accent-color:var(--accent)}
.preset-tier-choice>span{display:grid;gap:2px;min-width:0}.preset-tier-choice strong{font-size:.86rem;font-weight:900}.preset-tier-choice small{color:var(--muted);font-size:.69rem;white-space:nowrap}
.preset-grid{display:grid!important;gap:10px!important;overflow:visible!important;padding:0!important}
.preset-tier-group{overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:var(--shadow)}
.preset-tier-group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:58px;padding:0 15px;background:var(--soft);list-style:none;cursor:pointer}
.preset-tier-group>summary::-webkit-details-marker{display:none}.preset-tier-group>summary:after{content:'펼치기';color:var(--muted);font-size:.72rem;font-weight:800}.preset-tier-group[open]>summary:after{content:'접기'}
.preset-tier-group-title{display:flex;align-items:baseline;gap:9px}.preset-tier-group-title strong{font-size:1.04rem;font-weight:900}.preset-tier-group-title small{color:var(--muted);font-size:.76rem;font-weight:800}
.preset-tier-group-count{margin-left:auto;color:var(--muted);font-size:.76rem;font-weight:800}
.preset-tier-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:12px}
.preset-card{min-height:0;padding:17px}.preset-card h3{font-size:1.08rem;font-weight:900;letter-spacing:-.02em}.preset-summary{font-size:.86rem;font-weight:700;color:var(--ink)}.preset-target-count{font-size:.8rem}.preset-note{font-size:.82rem;line-height:1.6}.preset-score-row{font-size:.8rem}.preset-score-row strong{font-size:1.02rem}
.boss-filter-panel{grid-template-columns:minmax(260px,1.35fr) minmax(155px,.55fr) minmax(250px,.9fr)}
.boss-action-stack{display:grid;gap:7px}.boss-bulk-actions,.boss-expand-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.boss-group>summary{min-height:58px;padding:8px 14px}.boss-group-title{display:flex;align-items:center;flex-wrap:wrap;gap:7px 10px;min-width:0}
.boss-group-score{color:var(--accent);font-size:.98rem;font-weight:900;white-space:nowrap}.boss-group-names{color:var(--ink);font-size:.88rem;font-weight:800;line-height:1.45}.boss-group-meta{margin-left:auto;color:var(--muted);font-size:.72rem;font-weight:800;white-space:nowrap}
.boss-check{min-height:74px;padding:13px}.boss-copy strong{font-size:.9rem;font-weight:900}.boss-copy span{font-size:.76rem}.boss-group>summary:after{flex:0 0 auto}
.empty-state{font-size:.88rem;line-height:1.6}
@media(max-width:1050px){.preset-tier-checklist{grid-template-columns:repeat(3,minmax(0,1fr))}.preset-tier-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.boss-filter-panel{grid-template-columns:minmax(0,1fr) 180px}.boss-action-stack{grid-column:1/-1;grid-template-columns:1fr 1fr}}
@media(max-width:700px){body{font-size:15px}.preset-tier-filter-heading{align-items:stretch;flex-direction:column}.preset-tier-actions{display:grid;grid-template-columns:1fr 1fr}.preset-tier-checklist{grid-template-columns:repeat(2,minmax(0,1fr))}.preset-tier-card-grid{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:10px}.preset-tier-card-grid .preset-card{flex:0 0 min(84vw,330px);scroll-snap-align:start}.boss-filter-panel{grid-template-columns:1fr}.boss-action-stack{grid-column:auto;grid-template-columns:1fr}.boss-group-title{gap:5px 8px}.boss-group-meta{width:100%;margin-left:0}.boss-group>summary:after{align-self:flex-start;margin-top:4px}}
@media(max-width:430px){.preset-tier-checklist{grid-template-columns:1fr}.preset-tier-choice{min-height:52px}.boss-bulk-actions,.boss-expand-actions{grid-template-columns:1fr 1fr}}
`;
  document.head.append(style);
})();
