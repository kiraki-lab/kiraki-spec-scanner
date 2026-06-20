(() => {
  const style = document.createElement('style');
  style.textContent = `
html.theme-clean{--ink:#1f2937;--muted:#667085;--line:#e3e7ee;--surface:#fff;--soft:#f7f9fc;--navy:#28324a;--navy2:#46536f;--accent:#7657d5;--accent2:#f1edff;--success:#18794e;--danger:#b42345;--shadow:0 12px 34px rgba(31,41,55,.075);font-family:'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif}
html.theme-clean body{color:var(--ink);background:#f5f7fa}
html.theme-clean body:before,html.theme-clean body:after{display:none}
html.theme-clean .site-header{color:var(--ink);background:#fff;border-bottom:1px solid #e8ebf0}
html.theme-clean .header-inner{align-items:flex-end;padding:28px 0 22px}
html.theme-clean .brand-copy h1{margin-bottom:7px;color:#172033;font-family:inherit;font-size:clamp(30px,4.4vw,48px);font-weight:900;letter-spacing:-.045em;text-shadow:none}
html.theme-clean .brand-copy>p:last-child{color:var(--muted);font-size:.92rem}
html.theme-clean .eyebrow{color:#7657d5;font-family:inherit;font-size:.76rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
html.theme-clean .version-badge{color:#5d47aa;background:#f3efff;border-color:#e3dafd;box-shadow:none}
html.theme-clean .header-button{color:#fff;background:#2f3a55;border-color:#2f3a55;box-shadow:none}
html.theme-clean .header-button:hover{background:#202a42}
html.theme-clean .theme-toggle{background:#fff;border-color:#dfe4eb;box-shadow:0 7px 20px rgba(31,41,55,.08)}
html.theme-clean .panel,html.theme-clean .preset-card,html.theme-clean .boss-group,html.theme-clean .admin-dialog{background:#fff;border:1px solid var(--line);box-shadow:var(--shadow);backdrop-filter:none}
html.theme-clean .input-card{background:#f8fafc;border-color:#e4e8ef}
html.theme-clean .step-number{background:#7657d5}
html.theme-clean .button,html.theme-clean .icon-button,html.theme-clean .file-button{border-radius:10px}
html.theme-clean .button.primary{color:#fff;background:#7657d5;border-color:#7657d5;box-shadow:none}
html.theme-clean .button.primary:hover{background:#6346c0}
html.theme-clean .button.secondary{color:#fff;background:#46536f;border-color:#46536f}
html.theme-clean .button.ghost,html.theme-clean .file-button,html.theme-clean .icon-button{color:var(--ink);background:#fff;border-color:#dfe4eb}
html.theme-clean .field select,html.theme-clean .field input,html.theme-clean .field textarea,html.theme-clean .profile-input-row select,html.theme-clean .level-input-label,html.theme-clean .stepper-button,html.theme-clean .search-input-wrap{background:#fff;border-color:#d8dee8}
html.theme-clean .field select:focus,html.theme-clean .field input:focus,html.theme-clean .field textarea:focus,html.theme-clean .profile-input-row select:focus,html.theme-clean .search-input-wrap:focus-within{border-color:#7657d5;box-shadow:0 0 0 3px rgba(118,87,213,.13)}
html.theme-clean .mini-score{background:#fff;border-color:#e0e5ec}
html.theme-clean .tier-mini strong,html.theme-clean .total-card strong,html.theme-clean #currentTierName,html.theme-clean .preset-score-row strong,html.theme-clean .admin-total{color:#6949c8}
html.theme-clean .utility-popover{background:#fff;border-color:#dfe4eb}
html.theme-clean .view-tabs{background:#e9edf3;border:1px solid #e0e5ec;box-shadow:none}
html.theme-clean .view-tab{color:#59657a;font-family:inherit;font-weight:800}
html.theme-clean .view-tab.active{color:#202a42;background:#fff;box-shadow:0 5px 14px rgba(31,41,55,.07)}
html.theme-clean .section-heading h2{color:#1f2937;font-family:inherit;font-weight:900;letter-spacing:-.025em}
html.theme-clean .section-heading h2:after{content:''}
html.theme-clean .section-kicker{color:#7657d5;font-family:inherit;font-weight:900}
html.theme-clean .recommendation-kicker{color:#9a6700}
html.theme-clean .score-card{background:#f8fafc;border-color:#edf0f4}
html.theme-clean .score-card strong,html.theme-clean #currentTierName{font-family:inherit;font-weight:900}
html.theme-clean .total-card{background:#f2efff;border-color:#e2dafc}
html.theme-clean .progress-track{background:#e6eaf0}
html.theme-clean .progress-fill{background:linear-gradient(90deg,#7657d5,#9a7fe8)}
html.theme-clean .recommendation-panel{background:#fffdf7;border-color:#eadca9}
html.theme-clean .recommendation-result{background:#fff;border-color:#eadca9}
html.theme-clean .quick-guide{background:#fff}
html.theme-clean .type-badge{color:#6848c1;background:#f1edff}
html.theme-clean .type-badge.hunting{color:#176b46;background:#e8f6ef}
html.theme-clean .type-badge.boss{color:#9f2948;background:#fdecef}
html.theme-clean .type-badge.newbie{color:#8a5b00;background:#fff4cc}
html.theme-clean .status-badge{color:#755400;background:#fff2bf}
html.theme-clean .status-badge.reference{color:#fff;background:#7657d5}
html.theme-clean .status-badge.custom{color:#176b46;background:#e8f6ef}
html.theme-clean .preset-card.reference{background:#faf8ff;border-color:#cfc2f6}
html.theme-clean .preset-card.admin-added{border-color:#9ed3b7;box-shadow:inset 0 3px 0 #43a876,var(--shadow)}
html.theme-clean .preset-score-row{background:#f7f8fb}
html.theme-clean .boss-filter-panel{background:#f8fafc}
html.theme-clean .boss-group>summary{background:#f7f9fc}
html.theme-clean .boss-check.checked,html.theme-clean .admin-boss-check.checked{background:#f2efff}
html.theme-clean .admin-dialog{background:#fff}
html.theme-clean .admin-notice{background:#fff8e6;border-color:#ead79d}
html.theme-clean .admin-form{background:#f8fafc;border-color:#e3e7ee}
html.theme-clean .save-status{color:#18794e;background:#e9f7f0}
html.theme-clean .page-note{color:#697386}
`;
  document.head.append(style);
})();
