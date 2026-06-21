(() => {
  'use strict';

  if (window.__kirakiRewardsPolishLoaded) return;
  window.__kirakiRewardsPolishLoaded = true;

  let attempts = 0;

  function installStyles() {
    if (document.querySelector('#kirakiRewardsPolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiRewardsPolishStyles';
    style.textContent = `
.view-tab.barrier-has-rewards{gap:7px;position:relative}.barrier-reward-cue{display:inline-flex;align-items:center;min-height:21px;padding:2px 7px;border:1px solid color-mix(in srgb,var(--accent) 38%,var(--line));border-radius:999px;background:color-mix(in srgb,var(--accent) 10%,var(--surface));color:var(--accent);font-size:.62rem;font-weight:900;white-space:nowrap}.view-tab.barrier-has-rewards.active .barrier-reward-cue{background:var(--surface);color:var(--accent)}
.barrier-reward-menu{position:relative;margin:-4px 0 18px!important;padding:12px 14px!important;border-color:color-mix(in srgb,var(--accent) 34%,var(--line))!important;background:linear-gradient(135deg,color-mix(in srgb,var(--accent2) 42%,var(--surface)),var(--surface))!important}.barrier-reward-menu:before{content:'결계 확률과 티어 보상을 함께 확인';display:block;margin:0 0 8px;color:var(--accent);font-size:.72rem;font-weight:900}.barrier-reward-menu label{gap:10px!important}.barrier-reward-menu span{color:var(--ink)!important}.barrier-reward-menu select{background:var(--surface)!important;border-color:color-mix(in srgb,var(--accent) 26%,var(--line))!important}
.challenger-rewards-panel{gap:24px!important}.challenger-rewards-panel .cr-head{position:relative;overflow:hidden;padding:20px!important;border:1px solid color-mix(in srgb,var(--accent) 24%,var(--line))!important;border-radius:18px;background:linear-gradient(135deg,color-mix(in srgb,var(--accent2) 55%,var(--surface)),var(--surface) 58%,color-mix(in srgb,var(--soft) 84%,var(--surface)))!important}.challenger-rewards-panel .cr-head:before{content:'';position:absolute;inset:0 0 auto;height:5px;background:linear-gradient(90deg,#a85d34,#d5dce4,#e0a42f,#4fc9d6,#59d8aa,#6694f0,#a8d7ff,#8f97e1,#74e8ff)}.challenger-rewards-panel .cr-head>*{position:relative}.challenger-rewards-panel .cr-head h2{font-size:clamp(1.45rem,2.4vw,2rem)!important;font-weight:900}.challenger-rewards-panel .cr-head p{font-size:.92rem}.challenger-rewards-panel .cr-badges{align-content:start;justify-content:flex-end}.challenger-rewards-panel .cr-badges span{min-height:34px;border-color:color-mix(in srgb,var(--accent) 34%,var(--line));background:var(--surface);box-shadow:0 8px 18px rgba(31,41,55,.06)}
.cr-spotlight{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.cr-spotlight-card{display:grid;gap:5px;min-width:0;padding:13px 14px;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:0 10px 24px rgba(31,41,55,.05)}.cr-spotlight-card span{color:var(--muted);font-size:.72rem;font-weight:800}.cr-spotlight-card strong{color:var(--ink);font-size:.98rem;font-weight:900;line-height:1.3}
.challenger-rewards-panel .cr-section-title{padding:0 2px}.challenger-rewards-panel .cr-section-title h3{font-size:1.22rem!important}.challenger-rewards-panel .cr-tier{position:relative;grid-template-columns:170px minmax(0,1fr)!important;padding:14px!important;border-radius:16px!important;background:linear-gradient(90deg,rgba(var(--rgb),.18),transparent 38%),var(--surface)!important;box-shadow:0 8px 22px rgba(31,41,55,.045)}.challenger-rewards-panel .cr-tier:before{content:'';position:absolute;left:0;top:12px;bottom:12px;width:4px;border-radius:999px;background:rgb(var(--rgb))}.challenger-rewards-panel .cr-label{min-height:112px!important;border-radius:14px!important}.challenger-rewards-panel .cr-label strong{font-size:1.08rem!important}.challenger-rewards-panel .cr-frame{min-height:118px!important;border-radius:14px!important;background:linear-gradient(180deg,#fff,color-mix(in srgb,var(--surface) 82%,var(--soft)))!important}.challenger-rewards-panel .cr-frame img{width:100%;max-height:220px;object-fit:contain}.challenger-rewards-panel .cr-note-box{border-color:color-mix(in srgb,var(--accent) 18%,var(--line))!important;background:linear-gradient(135deg,var(--soft),var(--surface))!important}.challenger-rewards-panel .cr-note-box p{color:var(--ink)!important;font-weight:900}.challenger-rewards-panel .cr-items{gap:16px!important}.challenger-rewards-panel .cr-card{border-radius:16px!important;box-shadow:0 8px 22px rgba(31,41,55,.045)}.challenger-rewards-panel .cr-card:hover{border-color:color-mix(in srgb,var(--accent) 32%,var(--line))}.challenger-rewards-panel .cr-icon{width:76px!important;height:76px!important}.challenger-rewards-panel .cr-icon img{width:64px!important;height:64px!important}.challenger-rewards-panel .cr-cond,.challenger-rewards-panel .cr-table{border-radius:16px!important}
@media(max-width:860px){.barrier-reward-cue{margin-left:auto}.cr-spotlight{grid-template-columns:1fr}.challenger-rewards-panel .cr-tier{grid-template-columns:minmax(0,1fr)!important}.challenger-rewards-panel .cr-frame img{max-height:none}.challenger-rewards-panel .cr-badges{justify-content:flex-start}}
@media(max-width:430px){.view-tab.barrier-has-rewards{justify-content:space-between}.barrier-reward-cue{font-size:.58rem;padding-inline:6px}.challenger-rewards-panel .cr-head{padding:18px 14px!important}.challenger-rewards-panel .cr-card-head{align-items:center}}
`;
    document.head.append(style);
  }

  function decorateBarrierTab() {
    const tab = document.querySelector('[data-view-button="barrier"]');
    if (!tab || tab.querySelector('[data-reward-cue]')) return;
    tab.classList.add('barrier-has-rewards');
    const cue = document.createElement('span');
    cue.className = 'barrier-reward-cue';
    cue.dataset.rewardCue = 'true';
    cue.textContent = '보상 정리';
    tab.append(cue);
  }

  function decorateRewardPanel() {
    const panel = document.querySelector('[data-challenger-rewards]');
    if (!panel || panel.querySelector('.cr-spotlight')) return;
    const head = panel.querySelector('.cr-head');
    if (!head) return;
    const spotlight = document.createElement('div');
    spotlight.className = 'cr-spotlight';
    spotlight.innerHTML = `
      <div class="cr-spotlight-card"><span>보상 컷</span><strong>9개 티어 인게임 화면 기준</strong></div>
      <div class="cr-spotlight-card"><span>핵심 아이템</span><strong>아이콘과 사용 조건을 함께 정리</strong></div>
      <div class="cr-spotlight-card"><span>영상용 구성</span><strong>긴 원본 문구를 짧게 압축</strong></div>`;
    head.insertAdjacentElement('afterend', spotlight);
  }

  function decorateMenu() {
    const label = document.querySelector('#barrierRewardMenu label > span');
    if (label) label.textContent = '결계 관련 화면';
  }

  function decorate() {
    installStyles();
    decorateBarrierTab();
    decorateRewardPanel();
    decorateMenu();
  }

  function boot() {
    decorate();
    attempts += 1;
    if (attempts < 30 && (!document.querySelector('[data-view-button="barrier"]') || !document.querySelector('[data-challenger-rewards]'))) {
      setTimeout(boot, 120);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  if (typeof setView === 'function' && !window.__kirakiRewardsPolishSetViewWrapped) {
    window.__kirakiRewardsPolishSetViewWrapped = true;
    const baseSetView = setView;
    setView = function polishedRewardSetView(view, options = {}) {
      const result = baseSetView(view, options);
      requestAnimationFrame(decorate);
      return result;
    };
  }
})();
