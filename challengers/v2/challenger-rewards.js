(() => {
  'use strict';

  if (window.__kirakiChallengerRewardsLoaded) return;
  window.__kirakiChallengerRewardsLoaded = true;

  const view = 'tierRewards';
  const base = '.';
  const tiers = [
    ['bronze', 'BRONZE', '브론즈', 5000, '168,98,52', ['브론즈 티어 보상', '전용 보상 상자', '이벤트 재화', '치장 보상']],
    ['silver', 'SILVER', '실버', 10000, '176,190,204', ['실버 티어 보상', '전용 보상 상자', '이벤트 재화', '치장 보상']],
    ['gold', 'GOLD', '골드', 15000, '225,165,56', ['골드 티어 보상', '월드 전용 교환권', '이벤트 재화', '치장 보상']],
    ['platinum', 'PLATINUM', '플래티넘', 20000, '55,194,218', ['플래티넘 티어 보상', '월드 전용 교환권', '이벤트 재화', '치장 보상']],
    ['emerald', 'EMERALD', '에메랄드', 30000, '76,220,171', ['특수 스킬 반지 교환권', '200레벨 달성 보상 물약', '이벤트 리스트 수령']],
    ['sapphire', 'SAPPHIRE', '사파이어', 40000, '85,132,236', ['특수 스킬 반지 교환권', '상위 티어 보상', '이벤트 리스트 수령']],
    ['diamond', 'DIAMOND', '다이아몬드', 50000, '166,214,255', ['플라즈마 하트 모듈', '특수 스킬 반지 교환권', '이벤트 리스트 수령']],
    ['master', 'MASTER', '마스터', 70000, '144,151,225', ['메멘토 방어구 18성 강화권', '250레벨 달성의 비약', '이벤트 리스트 수령']],
    ['super-challenger', 'CHALLENGER / SUPER', '챌린저 / 슈퍼 챌린저', 90000, '117,232,255', ['솔 야누스 스킬 강화권', '치장 아이템 명칭만 상이', '동일 보상']]
  ];
  const notes = [
    '에메랄드 이상 보상은 이벤트 리스트를 통해 원하는 월드에서 수령할 수 있습니다.',
    '각 챌린저스 월드 전용 특수 스킬 반지 3레벨/4레벨 교환권이 포함됩니다.',
    '3만 점 보상의 물약은 기존 200레벨 달성 보상으로 정리했습니다.',
    '5만 점 보상에는 플라즈마 하트 모듈이 포함됩니다.',
    '챌린저와 슈퍼 챌린저는 치장 아이템 명칭만 다르고 동일한 보상입니다.'
  ];
  const items = [
    ['plasma-heart-module.png', '하트', '하트 업그레이드 모듈: 플라즈마', '교환 불가능한 페어리 하트, 티타늄 하트 혹은 리퀴드메탈 하트를 플라즈마 하트로 업그레이드할 수 있는 특수 모듈입니다.', '업그레이드 가능한 기계 심장: 페어리 하트, 티타늄 하트, 리퀴드메탈 하트|플라즈마 하트: 130레벨 이상 장착 가능, 스타포스 20성까지 강화 가능|전승 옵션: 주문서 강화 잔여 복구 가능 횟수, 강화로 획득 혹은 잃은 능력치, 스타포스 강화 단계, 잠재능력/에디셔널 잠재능력'],
    ['memento-18-star-scroll.png', '18성', '메멘토 방어구 스타포스 18성 강화권 (200제)', '200제 이하 교환 불가 방어구 아이템의 스타포스를 지정된 수치만큼 강화시키며 리커버리 실드의 효과를 받지 않습니다.', '사용 가능 아이템: 모자, 상의, 한벌옷, 하의, 신발, 장갑, 망토, 어깨장식|주의사항: 사용한 아이템은 30일 동안 교환 불가, 성공률 100%, 18성으로 강화, 조건에 맞지 않는 장비에는 사용 불가'],
    ['level-250-potion.png', '250', '250레벨 달성의 비약', '249레벨 이하의 캐릭터를 단숨에 250레벨로 만들어주는 전설 속의 성장의 비약입니다.', '사용 제한: 챌린저스 월드에서는 사용 불가, 250레벨 이상 259레벨 이하 하이퍼 버닝 MAX 및 부스터 캐릭터 사용 불가, 279레벨 이하 버닝 BEYOND 캐릭터 사용 불가'],
    ['sol-janus-scroll.png', 'SOL', '솔 야누스 스킬 강화권 (20레벨)', '자신의 솔 야누스 스킬 레벨에 따라 특정 레벨까지 강화할 수 있습니다.', '사용 기준: 스킬 레벨 0은 20레벨까지 강화, 스킬 레벨 1 이상은 필요한 솔 에르다/조각에 준하는 만큼 강화, 260레벨 이상 6차 전직 완료 캐릭터만 사용 가능, 스킬 레벨 30은 사용 불가']
  ];
  const sol = [['0~3', '20'], ['4~7', '21'], ['8~9', '22'], ['10~11', '23'], ['12~13', '24'], ['14~15', '25'], ['16', '26'], ['17~18', '27'], ['19', '28'], ['20~21', '29'], ['22~29', '30'], ['30', '사용 불가']];
  const pts = (value) => Number(value).toLocaleString('ko-KR');
  const img = (path) => `${base}/${path}`;
  const chips = (values) => values.map((value) => `<span>${escapeHtml(value)}</span>`).join('');
  const list = (values) => `<ul class="cr-list">${values.map((value) => `<li>${escapeHtml(value)}</li>`).join('')}</ul>`;

  function installStyles() {
    if (document.querySelector('#challengerRewardsStyles')) return;
    const style = document.createElement('style');
    style.id = 'challengerRewardsStyles';
    style.textContent = `
.barrier-reward-menu{margin:-6px 0 16px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:0 10px 24px rgba(31,41,55,.06)}
.barrier-reward-menu[hidden]{display:none!important}.barrier-reward-menu label{display:flex;align-items:center;justify-content:space-between;gap:12px}.barrier-reward-menu span{color:var(--muted);font-size:.78rem;font-weight:900}.barrier-reward-menu select{min-width:220px;min-height:38px;padding:0 38px 0 12px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--ink);font-weight:900;outline:none}
.challenger-rewards-panel{display:grid;gap:22px;overflow:hidden}.challenger-rewards-panel *{box-sizing:border-box}.cr-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:start;padding-bottom:18px;border-bottom:1px solid var(--line)}.cr-head h2,.cr-section h3,.cr-card h3,.cr-card h4{margin:0;letter-spacing:0}.cr-head p{max-width:72ch;margin:8px 0 0;color:var(--muted);line-height:1.7}.cr-badges,.cr-chips,.cr-notes{display:flex;flex-wrap:wrap;gap:8px}.cr-badges span,.cr-chips span,.cr-notes span{display:inline-flex;align-items:center;min-height:30px;padding:6px 10px;border:1px solid color-mix(in srgb,var(--accent) 28%,var(--line));border-radius:999px;background:color-mix(in srgb,var(--accent) 10%,var(--surface));color:var(--ink);font-size:12px;font-weight:800}.cr-section{display:grid;gap:14px}.cr-section-title{display:flex;align-items:end;justify-content:space-between;gap:14px}.cr-section-title h3{color:var(--ink);font-size:20px;line-height:1.25}.cr-section-title span{color:var(--muted);font-size:13px;font-weight:800}.cr-tiers{display:grid;gap:12px}.cr-tier{display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px;align-items:stretch;padding:12px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(90deg,rgba(var(--rgb),.17),transparent 42%),var(--soft)}.cr-label{display:grid;align-content:center;gap:7px;min-height:92px;padding:14px;border:1px solid color-mix(in srgb,rgb(var(--rgb)) 34%,var(--line));border-radius:12px;background:color-mix(in srgb,rgb(var(--rgb)) 12%,var(--surface))}.cr-label strong{color:var(--ink);font-size:18px;line-height:1.05}.cr-label span{color:var(--accent2);font-size:15px;font-weight:900}.cr-frame{display:grid;place-items:center;min-width:0;min-height:92px;padding:10px;border:1px solid var(--line);border-radius:12px;background:color-mix(in srgb,var(--surface) 82%,var(--soft));overflow:hidden}.cr-frame img{display:block;max-width:100%;height:auto}.cr-fallback{display:grid;grid-template-columns:minmax(120px,.35fr) minmax(0,1fr);gap:12px;align-items:center;width:100%}.cr-fallback[hidden],.cr-icon-text[hidden]{display:none!important}.cr-note-box{display:grid;gap:12px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}.cr-note-box p{margin:0;color:var(--muted);line-height:1.7}.cr-notes span{white-space:normal}.cr-items{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.cr-card{min-width:0;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.cr-card-head{display:flex;align-items:flex-start;gap:13px}.cr-icon{width:68px;height:68px;flex:0 0 auto;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--accent2) 48%,var(--line));border-radius:14px;background:radial-gradient(circle at 50% 28%,rgba(255,255,255,.85),transparent 24%),color-mix(in srgb,var(--accent) 14%,var(--soft));overflow:hidden}.cr-icon img{width:56px;height:56px;object-fit:contain}.cr-icon-text{color:var(--accent2);font-size:15px;font-weight:900;text-align:center}.cr-card h3{color:var(--ink);font-size:17px;line-height:1.35}.cr-card-head p{margin:5px 0 0;color:var(--accent2);font-size:12px;font-weight:900}.cr-desc{margin:13px 0 0;color:var(--muted);line-height:1.65}.cr-card h4{margin:14px 0 0;color:var(--ink);font-size:14px}.cr-list{display:grid;gap:6px;margin:8px 0 0;padding:0;list-style:none}.cr-list li{position:relative;padding-left:14px;color:var(--muted);font-size:13px;line-height:1.55}.cr-list li:before{content:'';position:absolute;left:0;top:.72em;width:5px;height:5px;border-radius:50%;background:var(--accent)}.cr-cond{display:grid;grid-template-columns:180px minmax(0,1fr);overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.cr-cond strong{display:grid;place-items:center;padding:16px;color:var(--ink);text-align:center;background:var(--soft);border-right:1px solid var(--line)}.cr-cond .cr-list{margin:0;padding:16px}.cr-table{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.cr-table table{width:100%;min-width:520px;border-collapse:collapse}.cr-table th,.cr-table td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:center;font-size:13px}.cr-table th{background:var(--soft);color:var(--ink);font-weight:900}.cr-table tr:last-child td{border-bottom:0}
@media(max-width:860px){.barrier-reward-menu label{align-items:stretch;flex-direction:column}.barrier-reward-menu select{width:100%;min-width:0}.cr-head,.cr-tier,.cr-fallback,.cr-items,.cr-cond{grid-template-columns:minmax(0,1fr)}.cr-frame{justify-items:start;overflow-x:auto}.cr-frame img{max-width:none;width:max-content}.cr-cond strong{border-right:0;border-bottom:1px solid var(--line)}}`;
    document.head.append(style);
  }

  function installFallbacks(root) {
    root.querySelectorAll('[data-fallback-wrap]').forEach((wrap) => {
      const image = wrap.querySelector('img');
      const fallback = wrap.querySelector('[data-fallback]');
      if (!image || !fallback) return;
      image.addEventListener('load', () => wrap.classList.add('has-image'), { once: true });
      image.addEventListener('error', () => {
        image.hidden = true;
        fallback.hidden = false;
        wrap.classList.add('is-fallback');
      }, { once: true });
    });
  }

  function tierHtml(tier) {
    const [id, label, koreanName, threshold, rgb, rewards] = tier;
    return `
      <article class="cr-tier" style="--rgb:${rgb}">
        <div class="cr-label"><strong>${escapeHtml(label)}</strong><span>${pts(threshold)}점</span></div>
        <div class="cr-frame" data-fallback-wrap>
          <img src="${img(`tier-reward-crops/${id}.png`)}" alt="${escapeHtml(koreanName)} 티어 인게임 보상 컷" loading="lazy">
          <div class="cr-fallback" data-fallback hidden><div><strong>${escapeHtml(koreanName)}</strong><small>인게임 컷 경로 준비됨</small></div><div class="cr-chips">${chips(rewards)}</div></div>
        </div>
      </article>`;
  }

  function itemCardHtml(item) {
    const [icon, fallback, title, description, detail] = item;
    const groups = detail.split('|').map((group) => {
      const [heading, body = ''] = group.split(': ');
      return `<h4>${escapeHtml(heading)}</h4>${list(body.split(', ').filter(Boolean))}`;
    }).join('');
    return `
      <article class="cr-card">
        <div class="cr-card-head">
          <div class="cr-icon" data-fallback-wrap><img src="${img(`item-icons/${icon}`)}" alt="${escapeHtml(title)} 인게임 아이콘" loading="lazy"><span class="cr-icon-text" data-fallback hidden>${escapeHtml(fallback)}</span></div>
          <div><h3>${escapeHtml(title)}</h3><p>월드 내 나의 캐릭터 간 이동만 가능</p></div>
        </div>
        <p class="cr-desc">${escapeHtml(description)}</p>${groups}
      </article>`;
  }

  function insertMenu() {
    const nav = document.querySelector('.view-tabs');
    if (!nav || document.querySelector('#barrierRewardMenu')) return;
    const menu = document.createElement('div');
    menu.id = 'barrierRewardMenu';
    menu.className = 'barrier-reward-menu';
    menu.hidden = true;
    menu.innerHTML = `<label><span>의문의 결계 보기</span><select id="barrierRewardSelect" aria-label="의문의 결계 관련 화면 선택"><option value="barrier">의문의 결계</option><option value="${view}">티어별 보상 정리</option></select></label>`;
    nav.insertAdjacentElement('afterend', menu);
    menu.querySelector('select')?.addEventListener('change', (event) => setView(event.target.value, { scroll: true }));
  }

  function insertPanel() {
    const footer = document.querySelector('.page-note');
    if (!footer || document.querySelector(`[data-view-panel="${view}"]`)) return;
    const panel = document.createElement('section');
    panel.className = 'view-panel';
    panel.dataset.viewPanel = view;
    panel.hidden = true;
    panel.innerHTML = `
      <section class="panel challenger-rewards-panel" data-challenger-rewards aria-labelledby="challengerRewardsTitle">
        <div class="cr-head"><div><p class="section-kicker">챌린저스 월드 보상</p><h2 id="challengerRewardsTitle">티어별 보상 정리</h2><p>원본 3개 자료의 핵심 문구를 줄이고, 사이트 테마와 같은 패널 구조로 정리했습니다.</p></div><div class="cr-badges"><span>5,000점 ~ 90,000점</span><span>인게임 컷 우선</span><span>핵심 아이템 상세</span></div></div>
        <section class="cr-section"><div class="cr-section-title"><h3>티어별 보상 한눈에 보기</h3><span>인게임 컷 기준</span></div><div class="cr-tiers">${tiers.map(tierHtml).join('')}</div></section>
        <section class="cr-note-box"><p>원본 메모 정리</p><div class="cr-notes">${chips(notes)}</div></section>
        <section class="cr-section"><div class="cr-section-title"><h3>핵심 아이템 상세</h3><span>인게임 아이콘 기준</span></div><div class="cr-items">${items.map(itemCardHtml).join('')}</div></section>
        <section class="cr-section"><div class="cr-section-title"><h3>챌린저 / 슈퍼 챌린저 조건</h3><span>현재 챌린저 달성 인원 0 기준</span></div><div class="cr-cond"><strong>챌린저스 1~3 월드<br>티어 달성 조건</strong>${list(['마스터: 70,000점 달성 & 메인(노말) 격파', '챌린저: 90,000점 달성 & 메인(하드) 격파 & 1000등부터', '슈퍼 챌린저: 90,000점 달성 & 메인(하드) 격파 & 999등까지'])}</div></section>
        <section class="cr-section"><div class="cr-section-title"><h3>솔 야누스 강화권 적용 표</h3><span>사용 전 레벨 기준</span></div><div class="cr-table"><table><thead><tr><th>사용 전 스킬 레벨</th><th>사용 후 스킬 레벨</th></tr></thead><tbody>${sol.map((row) => `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td></tr>`).join('')}</tbody></table></div></section>
      </section>`;
    footer.parentNode.insertBefore(panel, footer);
    installFallbacks(panel);
  }

  function syncMenu(active) {
    const menu = document.querySelector('#barrierRewardMenu');
    const select = document.querySelector('#barrierRewardSelect');
    if (!menu || !select) return;
    const show = active === 'barrier' || active === view;
    if (menu.hidden === show) menu.hidden = !show;
    if (show) select.value = active === view ? view : 'barrier';
  }

  function activeView() {
    return document.querySelector('[data-view-panel].active')?.dataset.viewPanel || null;
  }

  function wrapSetView() {
    if (window.__kirakiRewardSetViewWrapped || typeof setView !== 'function') return;
    window.__kirakiRewardSetViewWrapped = true;
    const baseSetView = setView;
    setView = function rewardAwareSetView(next, options = {}) {
      if (next !== view) {
        const result = baseSetView(next, options);
        syncMenu(next);
        return result;
      }
      document.querySelectorAll('[data-view-button]').forEach((button) => {
        const active = button.dataset.viewButton === 'barrier';
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('[data-view-panel]').forEach((panel) => {
        const active = panel.dataset.viewPanel === view;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
      try { sessionStorage.setItem(VIEW_SESSION_KEY, view); } catch {}
      syncMenu(view);
      if (options.scroll) document.querySelector('.view-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }

  function boot() {
    if (!document.querySelector('.view-tabs') || typeof setView !== 'function') {
      setTimeout(boot, 80);
      return;
    }
    installStyles();
    insertMenu();
    insertPanel();
    wrapSetView();
    try {
      if (sessionStorage.getItem(VIEW_SESSION_KEY) === view) setView(view);
    } catch {}
    syncMenu(activeView());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
