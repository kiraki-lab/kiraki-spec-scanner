(() => {
  'use strict';

  if (window.__kirakiItemBurningTrackerLoaded) return;
  window.__kirakiItemBurningTrackerLoaded = true;

  const ITEM_BURNING_PUBLIC = false;
  const VIEW_ID = 'itemBurning';
  const STORAGE_KEY = 'kiraki-item-burning:v1';
  const HUNT_EMBLEM_PER_2000 = 10;
  const nf = typeof number !== 'undefined' ? number : new Intl.NumberFormat('ko-KR');
  const esc = typeof escapeHtml === 'function'
    ? escapeHtml
    : (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const stages = [
    { stage: 1, level: 225, boss: '스우 (노멀)', emblem: 0, reward: '도전자의 장비 1차 성장', growth: '방어구 스타포스 18성, 무기/방어구 잠재 유니크' },
    { stage: 2, level: 250, boss: '루시드 (이지)', emblem: 0, reward: '도전자의 장비 2차 성장', growth: '주문서 강화 수치 성장, 방어구 에디 에픽, 무기 에디 유니크' },
    { stage: 3, level: 255, boss: '윌 (이지)', emblem: 250, reward: '도전자의 장비 3차 성장', growth: '무기 잠재능력 레전드리' },
    { stage: 4, level: 260, boss: '카이 (노멀)', emblem: 750, reward: '도전자의 장비 4차 성장', growth: '모자 잠재 레전드리, 재사용 2초+주스탯 1줄 또는 주스탯 2줄' },
    { stage: 5, level: 265, boss: '루시드 (노멀)', emblem: 1500, reward: '도전자의 장비 5차 성장', growth: '신발/망토/장갑 스타포스 19성' },
    { stage: 6, level: 265, boss: '듄켈 (노멀)', emblem: 2250, reward: '도전자의 장비 6차 성장', growth: '상의/하의/모자/어깨장식 스타포스 19성' },
    { stage: 7, level: 270, boss: '데미안 (하드)', emblem: 3000, reward: '도전자의 장비 7차 성장', growth: '신발/망토/장갑 스타포스 20성' },
    { stage: 8, level: 270, boss: '진 힐라 (노멀)', emblem: 3750, reward: '도전자의 장비 8차 성장', growth: '상의/하의/모자/어깨장식 스타포스 20성' },
    { stage: 9, level: 275, boss: '가디언 엔젤 슬라임 (카오스)', emblem: 4500, reward: '도전자의 장비 9차 성장', growth: '신발/망토/장갑 스타포스 21성' },
    { stage: 10, level: 275, boss: '더스크 (카오스)', emblem: 5500, reward: '도전자의 장비 10차 성장', growth: '상의/하의/모자/어깨장식 스타포스 21성' },
    { stage: 11, level: 280, boss: '메이린 (노멀)', emblem: 6500, reward: '도전자의 장비 11차 성장', growth: '방어구 스타포스 22성' }
  ];

  const weeklySources = [
    { id: 'n-lotus', boss: '스우 (노멀)', amount: 50 },
    { id: 'n-damien', boss: '데미안 (노멀)', amount: 50 },
    { id: 'e-lucid', boss: '루시드 (이지)', amount: 50 },
    { id: 'n-slime', boss: '가디언 엔젤 슬라임 (노멀)', amount: 50 },
    { id: 'n-kai', boss: '카이 (노멀)', amount: 50 },
    { id: 'e-will', boss: '윌 (이지)', amount: 50 },
    { id: 'n-will', boss: '윌 (노멀)', amount: 100 },
    { id: 'n-lucid', boss: '루시드 (노멀)', amount: 100 },
    { id: 'n-dusk', boss: '더스크 (노멀)', amount: 150 },
    { id: 'n-dunkel', boss: '듄켈 (노멀)', amount: 150 }
  ];

  const oneTimeSources = [
    { id: 'h-lotus', boss: '스우 (하드)', amount: 150 },
    { id: 'h-damien', boss: '데미안 (하드)', amount: 150 },
    { id: 'n-verus-hilla', boss: '진 힐라 (노멀)', amount: 175 },
    { id: 'h-lucid', boss: '루시드 (하드)', amount: 175 },
    { id: 'h-will', boss: '윌 (하드)', amount: 175 },
    { id: 'c-slime', boss: '가디언 엔젤 슬라임 (카오스)', amount: 175 },
    { id: 'c-dusk', boss: '더스크 (카오스)', amount: 200 },
    { id: 'h-dunkel', boss: '듄켈 (하드)', amount: 200 },
    { id: 'h-verus-hilla', boss: '진 힐라 (하드)', amount: 200 },
    { id: 'n-meirin', boss: '메이린 (노멀)', amount: 200 }
  ];

  let pendingItemBurningView = false;
  let saveTimer = null;

  function canAccess() {
    return ITEM_BURNING_PUBLIC || (typeof isAdminUnlocked === 'function' && isAdminUnlocked());
  }

  const toInt = (value) => Math.max(0, Math.round(Number(value) || 0));
  const clamp = (value, min, max) => Math.min(Math.max(Math.round(Number(value) || min), min), max);

  function defaultState() {
    return {
      currentLevel: '',
      completedStage: 0,
      emblemHeld: 0,
      huntBatches: 0,
      weekly: {},
      oneTime: {},
      shareAllowed: false
    };
  }

  function normalizeSourceMap(raw, sources) {
    const out = {};
    sources.forEach((source) => { out[source.id] = Boolean(raw?.[source.id]); });
    return out;
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!raw || typeof raw !== 'object') return defaultState();
      return {
        currentLevel: raw.currentLevel === '' ? '' : toInt(raw.currentLevel),
        completedStage: clamp(raw.completedStage, 0, stages.length),
        emblemHeld: toInt(raw.emblemHeld),
        huntBatches: toInt(raw.huntBatches),
        weekly: normalizeSourceMap(raw.weekly, weeklySources),
        oneTime: normalizeSourceMap(raw.oneTime, oneTimeSources),
        shareAllowed: Boolean(raw.shareAllowed)
      };
    } catch {
      return defaultState();
    }
  }

  let state = loadState();

  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 300);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function profileLevel() {
    try {
      const profile = typeof activeProfile === 'function' ? activeProfile() : null;
      return toInt(profile?.level) || 260;
    } catch {
      return 260;
    }
  }

  function effectiveLevel() {
    return toInt(state.currentLevel) || profileLevel();
  }

  function sumChecked(sources, checkedMap) {
    return sources.reduce((sum, source) => sum + (checkedMap[source.id] ? source.amount : 0), 0);
  }

  function computed() {
    const hunt = state.huntBatches * HUNT_EMBLEM_PER_2000;
    const weekly = sumChecked(weeklySources, state.weekly);
    const oneTime = sumChecked(oneTimeSources, state.oneTime);
    const planned = state.emblemHeld + hunt + weekly + oneTime;
    const next = stages.find((item) => item.stage > state.completedStage) || null;
    const level = effectiveLevel();
    return {
      level,
      hunt,
      weekly,
      oneTime,
      planned,
      next,
      missingLevel: next ? Math.max(0, next.level - level) : 0,
      missingEmblem: next ? Math.max(0, next.emblem - planned) : 0,
      completed: state.completedStage,
      total: stages.length
    };
  }

  function installStyles() {
    if (document.querySelector('#kirakiItemBurningStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiItemBurningStyles';
    style.textContent = `
.item-burning-panel{display:grid;gap:14px}.item-burning-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.item-burning-head h2{margin:0 0 5px;font-size:1.35rem;font-weight:950}.item-burning-head p{margin:0;color:var(--muted);font-size:.84rem}.item-burning-badge{display:inline-flex;align-items:center;min-height:30px;padding:5px 10px;border:1px solid #fecaca;border-radius:999px;background:#fff1f2;color:#be123c;font-size:.72rem;font-weight:950;white-space:nowrap}.item-burning-grid{display:grid;grid-template-columns:minmax(300px,.86fr) minmax(0,1.14fr);gap:12px}.item-burning-card{padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.item-burning-card.accent{border-color:color-mix(in srgb,#ef4444 30%,var(--line));background:linear-gradient(135deg,color-mix(in srgb,#fff1f2 72%,var(--surface)),var(--surface))}.item-burning-card h3{margin:0 0 12px;font-size:1rem;font-weight:950}.item-burning-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.item-burning-field{display:grid;gap:6px;color:var(--ink);font-size:.74rem;font-weight:850}.item-burning-field input,.item-burning-field select{width:100%;min-height:42px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--ink);font:inherit;font-weight:850;outline:none}.item-burning-field input:focus,.item-burning-field select:focus{border-color:#dc2626;box-shadow:0 0 0 3px rgba(220,38,38,.14)}.item-burning-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.item-burning-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.item-burning-metric{display:grid;gap:5px;min-height:78px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}.item-burning-metric span{color:var(--muted);font-size:.67rem;font-weight:850}.item-burning-metric strong{font-size:1rem;font-weight:950}.item-burning-metric.good strong{color:#047857}.item-burning-metric.bad strong{color:var(--danger)}.item-burning-next{display:grid;gap:8px;margin-top:12px;padding:12px;border:1px solid color-mix(in srgb,#ef4444 24%,var(--line));border-radius:12px;background:color-mix(in srgb,#fff7ed 62%,var(--surface))}.item-burning-next strong{font-size:1.05rem;font-weight:950}.item-burning-next span{color:var(--muted);font-size:.74rem;font-weight:820}.item-stage-list{display:grid;gap:7px}.item-stage-row{display:grid;grid-template-columns:70px 66px minmax(130px,1fr) 86px minmax(150px,1.2fr) 72px;gap:8px;align-items:center;min-height:52px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}.item-stage-row.done{background:color-mix(in srgb,#ecfdf5 74%,var(--surface))}.item-stage-row.ready{border-color:#f59e0b;background:color-mix(in srgb,#fffbeb 72%,var(--surface))}.item-stage-row b{font-size:.78rem}.item-stage-row span{color:var(--muted);font-size:.7rem;font-weight:820;line-height:1.35}.item-stage-status{justify-self:end;display:inline-flex;align-items:center;justify-content:center;min-width:58px;min-height:24px;padding:2px 7px;border-radius:999px;background:var(--soft);border:1px solid var(--line);font-size:.65rem!important;font-weight:950!important;color:var(--muted)!important}.item-stage-row.done .item-stage-status{background:#ecfdf5;border-color:#86efac;color:#047857!important}.item-stage-row.ready .item-stage-status{background:#fffbeb;border-color:#facc15;color:#a16207!important}.emblem-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.emblem-source{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;min-height:46px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);cursor:pointer}.emblem-source input{width:16px;height:16px}.emblem-source strong{font-size:.75rem;font-weight:950}.emblem-source small{color:var(--muted);font-size:.66rem;font-weight:850}.item-burning-section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 8px}.item-burning-section-title strong{font-size:.9rem;font-weight:950}.item-burning-section-title span{color:var(--muted);font-size:.68rem;font-weight:850}.item-burning-share{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--soft)}.item-burning-share label{display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:900}.item-burning-code{max-height:220px;overflow:auto;margin:12px 0 0;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--muted);font-size:.68rem;line-height:1.55;white-space:pre-wrap;word-break:break-all}.item-burning-hidden-tab[hidden]{display:none!important}@media(max-width:1040px){.item-burning-grid{grid-template-columns:1fr}.item-burning-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.item-burning-head,.item-burning-share{display:grid}.item-burning-form,.item-burning-summary,.emblem-source-grid{grid-template-columns:1fr}.item-stage-row{grid-template-columns:1fr}.item-stage-status{justify-self:start}.item-burning-actions{display:grid}.item-burning-actions .button{width:100%}}
`;
    document.head.append(style);
  }

  function insertUi() {
    const nav = document.querySelector('.view-tabs');
    const footer = document.querySelector('.page-note');
    if (!nav || !footer || document.querySelector(`[data-view-button="${VIEW_ID}"]`)) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'view-tab item-burning-hidden-tab';
    tab.dataset.viewButton = VIEW_ID;
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = '아이템버닝';
    nav.append(tab);

    const panel = document.createElement('section');
    panel.className = 'view-panel';
    panel.dataset.viewPanel = VIEW_ID;
    panel.hidden = true;
    panel.innerHTML = `
      <section class="panel item-burning-panel" aria-labelledby="itemBurningTitle">
        <div class="item-burning-head">
          <div>
            <p class="section-kicker">키라키 모드</p>
            <h2 id="itemBurningTitle">아이템버닝 미션</h2>
            <p>도전자의 장비 성장 단계와 도전의 문장 수급을 함께 기록합니다.</p>
          </div>
          <span class="item-burning-badge">비공개 준비 중</span>
        </div>
        <div class="item-burning-grid">
          <article class="item-burning-card accent">
            <h3>현재 진행</h3>
            <div class="item-burning-form">
              <label class="item-burning-field"><span>현재 레벨</span><input id="itemBurningLevel" inputmode="numeric" /></label>
              <label class="item-burning-field"><span>완료 단계</span><select id="itemBurningCompletedStage"></select></label>
              <label class="item-burning-field"><span>보유 문장</span><input id="itemBurningEmblemHeld" inputmode="numeric" /></label>
              <label class="item-burning-field"><span>사냥 2,000마리 횟수</span><input id="itemBurningHuntBatches" inputmode="numeric" /></label>
            </div>
            <div class="item-burning-actions">
              <button type="button" class="button secondary small" id="itemBurningUseProfileLevel">현재 레벨 가져오기</button>
              <button type="button" class="button primary small" id="itemBurningSaveButton">진행 저장</button>
            </div>
          </article>
          <article class="item-burning-card">
            <h3>다음 성장 체크</h3>
            <div class="item-burning-summary" id="itemBurningSummary"></div>
            <div class="item-burning-next" id="itemBurningNext"></div>
          </article>
        </div>
        <div class="item-burning-grid">
          <article class="item-burning-card">
            <div class="item-burning-section-title"><strong>단계 미션</strong><span>레벨 · 보스 · 문장 보유량</span></div>
            <div class="item-stage-list" id="itemBurningStageList"></div>
          </article>
          <article class="item-burning-card">
            <div class="item-burning-section-title"><strong>도전의 문장 수급</strong><span id="itemBurningSourceTotal"></span></div>
            <div class="item-burning-section-title"><strong>주간 사냥/보스</strong><span>2,000마리당 10개</span></div>
            <div class="emblem-source-grid" id="itemBurningWeeklySources"></div>
            <div class="item-burning-section-title" style="margin-top:12px"><strong>보스 1회 처치</strong><span>체크한 보상만 합산</span></div>
            <div class="emblem-source-grid" id="itemBurningOneTimeSources"></div>
            <div class="item-burning-share">
              <label><input id="itemBurningShareAllowed" type="checkbox" /> 공유 허가</label>
              <div class="item-burning-actions" style="margin:0">
                <button type="button" class="button secondary small" id="itemBurningExportButton">공유 JSON 내보내기</button>
                <button type="button" class="button ghost small" id="itemBurningCopyButton">공유 JSON 복사</button>
              </div>
            </div>
            <pre class="item-burning-code" id="itemBurningSharePreview"></pre>
          </article>
        </div>
      </section>`;
    footer.parentNode.insertBefore(panel, footer);
    tab.addEventListener('click', () => setView(VIEW_ID, { scroll: true }));
  }

  function renderControls() {
    const level = document.querySelector('#itemBurningLevel');
    if (level && level.value !== String(effectiveLevel())) level.value = String(effectiveLevel());
    const held = document.querySelector('#itemBurningEmblemHeld');
    if (held && held.value !== String(state.emblemHeld)) held.value = String(state.emblemHeld);
    const hunt = document.querySelector('#itemBurningHuntBatches');
    if (hunt && hunt.value !== String(state.huntBatches)) hunt.value = String(state.huntBatches);
    const select = document.querySelector('#itemBurningCompletedStage');
    if (select && !select.options.length) {
      select.innerHTML = [`<option value="0">시작 전</option>`].concat(stages.map((item) => `<option value="${item.stage}">${item.stage}단계 완료</option>`)).join('');
    }
    if (select && select.value !== String(state.completedStage)) select.value = String(state.completedStage);
    const share = document.querySelector('#itemBurningShareAllowed');
    if (share) share.checked = state.shareAllowed;
  }

  function renderSummary() {
    const data = computed();
    const wrap = document.querySelector('#itemBurningSummary');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="item-burning-metric"><span>진행 단계</span><strong>${data.completed}/${data.total}</strong></div>
      <div class="item-burning-metric"><span>보유+예정 문장</span><strong>${nf.format(data.planned)}</strong></div>
      <div class="item-burning-metric ${data.missingEmblem ? 'bad' : 'good'}"><span>다음 문장 부족분</span><strong>${nf.format(data.missingEmblem)}</strong></div>
      <div class="item-burning-metric"><span>사냥 문장</span><strong>${nf.format(data.hunt)}</strong></div>
      <div class="item-burning-metric"><span>주간 보스 문장</span><strong>${nf.format(data.weekly)}</strong></div>
      <div class="item-burning-metric"><span>1회 처치 문장</span><strong>${nf.format(data.oneTime)}</strong></div>`;

    const sourceTotal = document.querySelector('#itemBurningSourceTotal');
    if (sourceTotal) sourceTotal.textContent = `예정 +${nf.format(data.hunt + data.weekly + data.oneTime)}개`;
  }

  function renderNext() {
    const data = computed();
    const wrap = document.querySelector('#itemBurningNext');
    if (!wrap) return;
    if (!data.next) {
      wrap.innerHTML = '<strong>아이템버닝 11단계 완료</strong><span>모든 도전자 장비 성장 단계를 완료한 상태입니다.</span>';
      return;
    }
    const ready = data.missingLevel === 0 && data.missingEmblem === 0;
    wrap.innerHTML = `
      <strong>${data.next.stage}단계 · ${esc(data.next.reward)}</strong>
      <span>Lv.${data.next.level} · ${esc(data.next.boss)} 1인 격파 · 도전의 문장 ${nf.format(data.next.emblem)}개 보유</span>
      <span>${ready ? '레벨과 문장 조건은 충족 상태입니다.' : `부족: 레벨 ${data.missingLevel}, 문장 ${nf.format(data.missingEmblem)}개`}</span>
      <span>${esc(data.next.growth)}</span>`;
  }

  function stageStatus(item, data) {
    if (item.stage <= state.completedStage) return { key: 'done', label: '완료' };
    if (data.level >= item.level && data.planned >= item.emblem) return { key: 'ready', label: '가능' };
    return { key: 'locked', label: '대기' };
  }

  function renderStages() {
    const data = computed();
    const wrap = document.querySelector('#itemBurningStageList');
    if (!wrap) return;
    wrap.innerHTML = stages.map((item) => {
      const status = stageStatus(item, data);
      return `<div class="item-stage-row ${status.key}">
        <b>${item.stage}단계</b>
        <span>Lv.${item.level}</span>
        <span>${esc(item.boss)}</span>
        <span>${item.emblem ? nf.format(item.emblem) : '없음'}개</span>
        <span>${esc(item.growth)}</span>
        <span class="item-stage-status">${status.label}</span>
      </div>`;
    }).join('');
  }

  function renderSourceList(target, sources, checkedMap, key) {
    const wrap = document.querySelector(target);
    if (!wrap) return;
    wrap.innerHTML = sources.map((source) => `
      <label class="emblem-source">
        <input type="checkbox" data-emblem-source="${key}" data-emblem-id="${source.id}" ${checkedMap[source.id] ? 'checked' : ''} />
        <strong>${esc(source.boss)}</strong>
        <small>+${nf.format(source.amount)}개</small>
      </label>`).join('');
  }

  function sharePayload() {
    const data = computed();
    return {
      version: 1,
      consent: Boolean(state.shareAllowed),
      exportedAt: new Date().toISOString(),
      itemBurning: {
        completedStage: state.completedStage,
        currentLevel: data.level,
        emblemHeld: state.emblemHeld,
        huntBatches: state.huntBatches,
        plannedEmblems: data.planned,
        nextStage: data.next,
        weekly: state.weekly,
        oneTime: state.oneTime
      }
    };
  }

  function renderPreview() {
    const preview = document.querySelector('#itemBurningSharePreview');
    if (!preview) return;
    preview.textContent = state.shareAllowed
      ? JSON.stringify(sharePayload(), null, 2)
      : '공유 허가를 켜면 내보낼 아이템버닝 진행 데이터가 표시됩니다.';
  }

  function renderAll() {
    renderControls();
    renderSummary();
    renderNext();
    renderStages();
    renderSourceList('#itemBurningWeeklySources', weeklySources, state.weekly, 'weekly');
    renderSourceList('#itemBurningOneTimeSources', oneTimeSources, state.oneTime, 'oneTime');
    renderPreview();
  }

  function syncFromForm() {
    state.currentLevel = toInt(document.querySelector('#itemBurningLevel')?.value || effectiveLevel());
    state.completedStage = clamp(document.querySelector('#itemBurningCompletedStage')?.value, 0, stages.length);
    state.emblemHeld = toInt(document.querySelector('#itemBurningEmblemHeld')?.value);
    state.huntBatches = toInt(document.querySelector('#itemBurningHuntBatches')?.value);
    state.shareAllowed = Boolean(document.querySelector('#itemBurningShareAllowed')?.checked);
    document.querySelectorAll('[data-emblem-source]').forEach((input) => {
      const group = input.dataset.emblemSource;
      const id = input.dataset.emblemId;
      if (group === 'weekly') state.weekly[id] = input.checked;
      if (group === 'oneTime') state.oneTime[id] = input.checked;
    });
  }

  function exportPayload(copyOnly = false) {
    syncFromForm();
    saveNow();
    if (!state.shareAllowed) {
      renderAll();
      if (typeof toast === 'function') toast('공유 허가를 켠 뒤 내보낼 수 있습니다.');
      return;
    }
    const text = JSON.stringify(sharePayload(), null, 2);
    renderPreview();
    if (copyOnly) {
      navigator.clipboard?.writeText(text).then(() => toast?.('아이템버닝 공유 JSON을 복사했습니다.')).catch(() => toast?.('복사에 실패했습니다.'));
      return;
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiraki-item-burning-${Date.now()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    if (typeof toast === 'function') toast('아이템버닝 공유 JSON을 내보냈습니다.');
  }

  function bindUi() {
    const panel = document.querySelector('.item-burning-panel');
    panel?.addEventListener('input', () => {
      syncFromForm();
      saveSoon();
      renderSummary();
      renderNext();
      renderStages();
      renderPreview();
    }, true);
    panel?.addEventListener('change', () => {
      syncFromForm();
      saveNow();
      renderAll();
    }, true);
    document.querySelector('#itemBurningSaveButton')?.addEventListener('click', () => {
      syncFromForm();
      saveNow();
      renderAll();
      if (typeof toast === 'function') toast('아이템버닝 진행상황을 저장했습니다.');
    });
    document.querySelector('#itemBurningUseProfileLevel')?.addEventListener('click', () => {
      state.currentLevel = profileLevel();
      saveNow();
      renderAll();
    });
    document.querySelector('#itemBurningExportButton')?.addEventListener('click', () => exportPayload(false));
    document.querySelector('#itemBurningCopyButton')?.addEventListener('click', () => exportPayload(true));
  }

  function updateAccess() {
    const tab = document.querySelector(`[data-view-button="${VIEW_ID}"]`);
    if (tab) tab.hidden = !canAccess();
    if (!canAccess() && document.querySelector(`[data-view-panel="${VIEW_ID}"]`)?.classList.contains('active')) {
      if (typeof setView === 'function') setView('dashboard');
    }
  }

  function wrapSetView() {
    if (window.__kirakiItemBurningSetViewWrapped || typeof setView !== 'function') return;
    window.__kirakiItemBurningSetViewWrapped = true;
    const baseSetView = setView;
    setView = function itemBurningAwareSetView(nextView, options = {}) {
      if (nextView !== VIEW_ID) return baseSetView(nextView, options);
      if (!canAccess()) {
        pendingItemBurningView = true;
        if (typeof openAdminDialog === 'function') openAdminDialog();
        if (typeof toast === 'function') toast('아이템버닝 미션은 키라키 모드에서만 열립니다.');
        return;
      }
      document.querySelectorAll('[data-view-button]').forEach((button) => {
        const active = button.dataset.viewButton === VIEW_ID;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
      });
      document.querySelectorAll('[data-view-panel]').forEach((panel) => {
        const active = panel.dataset.viewPanel === VIEW_ID;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
      });
      try { if (typeof VIEW_SESSION_KEY !== 'undefined') sessionStorage.setItem(VIEW_SESSION_KEY, VIEW_ID); } catch {}
      if (options.scroll) document.querySelector('.view-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      renderAll();
    };
  }

  function wrapAdminUnlock() {
    if (window.__kirakiItemBurningAdminWrapped || typeof setAdminUnlocked !== 'function') return;
    window.__kirakiItemBurningAdminWrapped = true;
    const baseSetAdminUnlocked = setAdminUnlocked;
    setAdminUnlocked = function itemBurningAwareAdminUnlock(unlocked) {
      baseSetAdminUnlocked(unlocked);
      updateAccess();
      if (unlocked && pendingItemBurningView) {
        pendingItemBurningView = false;
        setTimeout(() => setView(VIEW_ID, { scroll: true }), 0);
      }
    };
  }

  function boot() {
    installStyles();
    insertUi();
    bindUi();
    wrapSetView();
    wrapAdminUnlock();
    updateAccess();
    renderAll();
    window.KirakiItemBurningData = { stages, weeklySources, oneTimeSources, getState: () => ({ ...state }), getComputed: computed };
    try {
      if (typeof VIEW_SESSION_KEY !== 'undefined' && sessionStorage.getItem(VIEW_SESSION_KEY) === VIEW_ID) setTimeout(() => setView(VIEW_ID), 0);
    } catch {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();