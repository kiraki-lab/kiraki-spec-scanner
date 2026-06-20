(() => {
  const style = document.createElement('style');
  style.textContent = `
html.theme-kiraki{--ink:#251c2c;--muted:#67596f;--line:#ebd2e1;--surface:rgba(255,255,255,.95);--soft:#fff7fb;--navy:#3b2152;--navy2:#6d3a83;--accent:#9a63e8;--accent2:#f4ecff;--success:#237b55;--danger:#b53258;--shadow:0 18px 48px rgba(216,91,157,.16);font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif}
html.theme-kiraki body{color:var(--ink);background:radial-gradient(circle at 14% 8%,rgba(255,188,222,.62),transparent 26%),radial-gradient(circle at 88% 12%,rgba(132,169,255,.23),transparent 28%),linear-gradient(135deg,#fff6fa,#ffe8f3);position:relative;overflow-x:hidden}
html.theme-kiraki body:before{content:'✦ ✧ ✨ ❤ ✦ ✧ ✨ ❤ ✦ ✧';position:fixed;inset:0;pointer-events:none;z-index:-1;color:rgba(255,255,255,.76);font-size:20px;letter-spacing:64px;line-height:96px;text-shadow:0 0 12px rgba(255,255,255,.95),0 0 24px rgba(255,188,222,.3);opacity:.22;transform:rotate(-8deg) scale(1.2)}
html.theme-kiraki body:after{content:'';position:fixed;inset:0;pointer-events:none;z-index:-2;background:linear-gradient(#fff8fc 1px,transparent 1px),linear-gradient(90deg,#fff8fc 1px,transparent 1px);background-size:64px 64px;opacity:.26}
html.theme-kiraki .site-header{color:var(--ink);background:transparent;border:0}
html.theme-kiraki .header-inner{align-items:flex-end;padding:32px 0 19px}
html.theme-kiraki .brand-copy h1{margin-bottom:7px;color:#261a33;font-family:inherit;font-size:clamp(32px,4.8vw,52px);font-weight:900;letter-spacing:-.045em;text-shadow:0 3px 0 rgba(255,255,255,.72),0 0 20px rgba(255,188,222,.34)}
html.theme-kiraki .brand-copy>p:last-child{color:var(--muted);font-size:.92rem}
html.theme-kiraki .eyebrow{color:#8d5add;font-family:inherit;font-size:.78rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
html.theme-kiraki .eyebrow:before{content:'✦ ';color:#e972aa}html.theme-kiraki .eyebrow:after{content:' ✨';color:#6f9de7}
html.theme-kiraki .version-badge{color:#693b70;background:rgba(255,255,255,.86);border-color:#efd0e2;box-shadow:0 8px 20px rgba(216,91,157,.12)}
html.theme-kiraki .theme-toggle{background:linear-gradient(135deg,#fff,#ffe5f1 55%,#edf7ff);border-color:#e6bfd6;box-shadow:0 10px 24px rgba(216,91,157,.16)}
html.theme-kiraki .header-button{color:#3a2647;background:linear-gradient(135deg,#e8e2fa,#f7b4cf 48%,#bceefa);border:1px solid rgba(255,255,255,.9);box-shadow:0 10px 24px rgba(216,91,157,.2)}
html.theme-kiraki .header-button:hover{background:linear-gradient(135deg,#f0ebff,#ffc3d8 48%,#cdf4fb)}
html.theme-kiraki .panel,html.theme-kiraki .preset-card,html.theme-kiraki .boss-group,html.theme-kiraki .admin-dialog{background:linear-gradient(rgba(255,255,255,.96),rgba(255,255,255,.96)) padding-box,linear-gradient(135deg,#8db0f5,#a8ebf8,#c8f2d0,#f7e3ad,#f2b5d4) border-box;border:1px solid transparent;box-shadow:var(--shadow);backdrop-filter:blur(13px)}
html.theme-kiraki .input-card{background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,247,252,.92));border-color:#eed9e6}
html.theme-kiraki .step-number{background:linear-gradient(135deg,#9967e2,#dd72aa)}
html.theme-kiraki .field select,html.theme-kiraki .field input,html.theme-kiraki .field textarea,html.theme-kiraki .profile-input-row select,html.theme-kiraki .level-input-label,html.theme-kiraki .stepper-button,html.theme-kiraki .search-input-wrap{background:rgba(255,255,255,.96);border-color:#e7cddd}
html.theme-kiraki .field select:focus,html.theme-kiraki .field input:focus,html.theme-kiraki .field textarea:focus,html.theme-kiraki .profile-input-row select:focus,html.theme-kiraki .search-input-wrap:focus-within{border-color:#df7aad;box-shadow:0 0 0 3px rgba(223,122,173,.16)}
html.theme-kiraki .button,html.theme-kiraki .icon-button,html.theme-kiraki .file-button{border-radius:999px}
html.theme-kiraki .button.primary{color:#3a2647;background:linear-gradient(135deg,#e8e2fa,#f7b4cf 48%,#bceefa);border-color:rgba(255,255,255,.9);box-shadow:0 8px 20px rgba(216,91,157,.16)}
html.theme-kiraki .button.secondary{color:#fff;background:linear-gradient(135deg,#4b2a62,#c85892)}
html.theme-kiraki .button.ghost,html.theme-kiraki .file-button,html.theme-kiraki .icon-button{background:rgba(255,255,255,.9);border-color:#e6cedc}
html.theme-kiraki .mini-score{background:linear-gradient(145deg,#fff,#fff7fc);border-color:#ecd4e3}
html.theme-kiraki .tier-mini strong,html.theme-kiraki .total-card strong,html.theme-kiraki #currentTierName,html.theme-kiraki .preset-score-row strong,html.theme-kiraki .admin-total{color:#8651ca}
html.theme-kiraki .utility-popover{background:rgba(255,255,255,.98);border-color:#e6cedc}
html.theme-kiraki .view-tabs{background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.9);box-shadow:0 10px 26px rgba(216,91,157,.12)}
html.theme-kiraki .view-tab{color:#665873;font-family:inherit;font-weight:800}
html.theme-kiraki .view-tab.active{color:#3c274a;background:linear-gradient(135deg,#fff,#ffe8f3,#eef8ff);box-shadow:0 8px 20px rgba(216,91,157,.14)}
html.theme-kiraki .section-heading h2{color:#24172f;font-family:inherit;font-weight:900;letter-spacing:-.025em}
html.theme-kiraki .section-heading h2:after{content:' ✦';color:#dc6fa7}
html.theme-kiraki .section-kicker{color:#8d5add;font-family:inherit;font-weight:900}
html.theme-kiraki .recommendation-kicker{color:#a86924}
html.theme-kiraki .score-card{background:linear-gradient(145deg,#fff,#fff8fc);border-color:#eedce7}
html.theme-kiraki .score-card strong,html.theme-kiraki #currentTierName{font-family:inherit;font-weight:900}
html.theme-kiraki .total-card{background:linear-gradient(135deg,#f2ebff,#ffe7f1,#eaf8ff);border-color:#e5cde3}
html.theme-kiraki .progress-track{background:#efdeea}
html.theme-kiraki .progress-fill{background:linear-gradient(90deg,#9662df,#df72aa,#75a6ee)}
html.theme-kiraki .recommendation-panel{background:linear-gradient(rgba(255,255,255,.97),rgba(255,251,245,.97)) padding-box,linear-gradient(135deg,#f5dfa3,#efb4d1,#a7e9f5) border-box}
html.theme-kiraki .recommendation-result{background:rgba(255,255,255,.92);border-color:#ecd8a7}
html.theme-kiraki .quick-guide{background:linear-gradient(rgba(255,255,255,.95),rgba(255,255,255,.95)) padding-box,linear-gradient(135deg,#efb4d1,#dcd7f6,#a7e9f5) border-box}
html.theme-kiraki .type-badge{color:#7040ae;background:#f1eaff}html.theme-kiraki .type-badge.hunting{color:#237b55;background:#e8f8ef}html.theme-kiraki .type-badge.boss{color:#9d3456;background:#ffeaf0}html.theme-kiraki .type-badge.newbie{color:#8e5d17;background:#fff3cc}
html.theme-kiraki .status-badge{color:#75510f;background:#fff1bf}html.theme-kiraki .status-badge.reference{color:#fff;background:linear-gradient(135deg,#9260d8,#ce5f95)}html.theme-kiraki .status-badge.custom{color:#237b55;background:#e8f8ef}
html.theme-kiraki .preset-card.reference{background:linear-gradient(rgba(251,247,255,.97),rgba(255,247,252,.97)) padding-box,linear-gradient(135deg,#9260d8,#dd72aa,#75a6ee) border-box}
html.theme-kiraki .preset-card.admin-added{border-color:transparent;box-shadow:inset 0 3px 0 #69c79a,var(--shadow)}
html.theme-kiraki .preset-score-row{background:linear-gradient(135deg,#fff9fc,#f5f0ff)}
html.theme-kiraki .boss-filter-panel{background:linear-gradient(145deg,#fff,#fff7fc)}
html.theme-kiraki .boss-group>summary{background:linear-gradient(135deg,#fff,#fff4fa,#f5f1ff)}
html.theme-kiraki .boss-check.checked,html.theme-kiraki .admin-boss-check.checked{background:linear-gradient(135deg,#f4efff,#fff0f7)}
html.theme-kiraki .boss-check input,html.theme-kiraki .admin-boss-check input{accent-color:#ce5f95}
html.theme-kiraki .admin-dialog{background:linear-gradient(rgba(255,255,255,.98),rgba(255,255,255,.98)) padding-box,linear-gradient(135deg,#df72aa,#9260d8,#75a6ee) border-box}
html.theme-kiraki .admin-notice{background:linear-gradient(135deg,#fff9e9,#fff1f8);border-color:#ecd5aa}
html.theme-kiraki .admin-form{background:linear-gradient(145deg,#fff,#fff7fc);border-color:#ead5e2}
html.theme-kiraki .save-status{color:#237b55;background:#e8f8ef}
html.theme-kiraki .page-note{color:#716278}
`;
  document.head.append(style);
})();
