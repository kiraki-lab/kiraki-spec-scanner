(() => {
  const style = document.createElement('style');
  style.textContent = `
:root{font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif}
body,button,input,select,textarea{font-family:inherit}
.theme-toggle{display:grid;gap:1px;min-width:138px;min-height:44px;padding:6px 13px;text-align:left;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);box-shadow:var(--shadow)}
.theme-toggle-main{font-size:.78rem;font-weight:900;line-height:1.2}.theme-toggle small{color:var(--muted);font-size:.66rem;font-weight:700}
.input-hub{display:grid;gap:16px;padding:20px;position:relative;z-index:10}
.input-hub-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
.input-hub-heading h2{margin:0 0 5px;font-size:1.28rem;font-weight:900;letter-spacing:-.025em}.input-hub-heading p:last-child{margin:0;color:var(--muted);font-size:.82rem;line-height:1.55}
.input-hub-utilities{display:flex;align-items:center;gap:8px;flex:0 0 auto}.input-hub .utility-menu{align-self:auto}.input-hub .utility-popover{top:calc(100% + 7px)}
.input-hub-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(220px,.8fr) minmax(245px,.9fr);gap:12px}
.input-card{display:flex;flex-direction:column;gap:12px;min-width:0;padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
.input-card-title{display:flex;align-items:center;gap:10px}.input-card-title>div{display:grid;gap:2px}.input-card-title strong{font-size:.9rem;font-weight:900}.input-card-title small{color:var(--muted);font-size:.7rem;line-height:1.35}
.step-number{display:inline-grid;place-items:center;width:28px;height:28px;flex:0 0 28px;border-radius:50%;background:var(--accent);color:#fff;font-size:.75rem;font-weight:900}
.profile-input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.profile-input-row select{min-width:0;min-height:44px;padding:0 12px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);font-weight:700;outline:none}
.profile-input-row select:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 16%,transparent)}
.input-inline-actions{display:flex;gap:6px}.input-inline-actions .button{flex:1}
.level-stepper{display:grid;grid-template-columns:44px minmax(100px,1fr) 44px;gap:7px;align-items:stretch}.stepper-button{display:grid;place-items:center;min-height:48px;padding:0;border:1px solid var(--line);border-radius:11px;background:var(--surface);color:var(--ink);font-size:1.25rem;font-weight:900}.stepper-button:hover{border-color:var(--accent);color:var(--accent)}
.level-input-label{display:flex;align-items:center;gap:6px;min-height:48px;padding:0 10px;border:1px solid var(--line);border-radius:11px;background:var(--surface)}.level-input-label span{color:var(--muted);font-size:.78rem;font-weight:800}.level-input-label input{width:100%;min-width:0;padding:0;border:0;outline:0;background:transparent;color:var(--ink);font-size:1.15rem;font-weight:900;text-align:center;-moz-appearance:textfield}.level-input-label input::-webkit-outer-spin-button,.level-input-label input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.input-help{margin:0;color:var(--muted);font-size:.7rem;line-height:1.45}.result-input-card{justify-content:space-between}.live-result-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.result-input-card .mini-score{min-height:56px;padding:9px 11px}.result-input-card .mini-score strong{font-size:1.05rem}.full-input-button{width:100%}
.boss-filter-panel{display:grid;grid-template-columns:minmax(280px,1.4fr) minmax(150px,.55fr) auto;gap:10px;align-items:end;margin-bottom:13px;padding:13px;border:1px solid var(--line);border-radius:13px;background:var(--soft)}
.boss-search-field{min-width:0}.search-input-wrap{display:flex;align-items:center;gap:8px;min-height:44px;padding:0 11px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}.search-input-wrap>span{color:var(--muted);font-size:1.1rem}.search-input-wrap input{width:100%;min-width:0;padding:0;border:0;outline:0;background:transparent;color:var(--ink);font-size:.88rem}.search-input-wrap:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 16%,transparent)}
.boss-expand-actions{display:flex;gap:7px;align-items:center}.boss-check[hidden]{display:none!important}
@media(max-width:980px){.input-hub-grid{grid-template-columns:1fr 1fr}.result-input-card{grid-column:1/-1}.boss-filter-panel{grid-template-columns:minmax(0,1fr) 180px}.boss-expand-actions{grid-column:1/-1;justify-content:flex-end}}
@media(max-width:700px){.header-actions{align-items:stretch;flex-wrap:wrap;justify-content:flex-end}.theme-toggle{min-width:128px}.input-hub{padding:15px}.input-hub-heading{flex-direction:column}.input-hub-utilities{width:100%;justify-content:space-between}.input-hub-grid{grid-template-columns:1fr}.result-input-card{grid-column:auto}.boss-filter-panel{grid-template-columns:1fr}.boss-expand-actions{grid-column:auto;display:grid;grid-template-columns:1fr 1fr}.profile-input-row{grid-template-columns:1fr}.profile-input-row .button{width:100%}}
@media(max-width:430px){.header-actions{width:100%;justify-content:stretch}.theme-toggle,.header-button{flex:1}.input-inline-actions{display:grid;grid-template-columns:1fr 1fr}.level-stepper{grid-template-columns:40px minmax(0,1fr) 40px}}
`;
  document.head.append(style);
})();
