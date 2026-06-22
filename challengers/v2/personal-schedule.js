(() => {
  'use strict';

  if (window.__kirakiPersonalScheduleLoaded) return;
  window.__kirakiPersonalScheduleLoaded = true;

  const SCHEDULE_PUBLIC = false;
  const VIEW_ID = 'personalSchedule';
  const STORAGE_KEY = 'kiraki-personal-schedule:v1';
  const TOTAL_WEEKS = 12;
  const WEEKLY_COINS = 4000;
  const nf = typeof number !== 'undefined' ? number : new Intl.NumberFormat('ko-KR');
  const esc = typeof escapeHtml === 'function'
    ? escapeHtml
    : (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const CATEGORIES = ['코인샵', '레벨', '보스', '해방', '아이템버닝', '아버', '기타'];
  let pendingScheduleView = false;
  let saveTimer = null;

  function canAccess() {
    return SCHEDULE_PUBLIC || (typeof isAdminUnlocked === 'function' && isAdminUnlocked());
  }

  function defaultWeek(index) {
    return {
      week: index,
      category: index <= 4 ? '레벨' : index <= 8 ? '보스' : '코인샵',
      title: '',
      target: '',
      done: false,
      memo: ''
    };
  }

  function defaultState() {
    return {
      shareAllowed: false,
      publicName: '',
      activeWeek: 1,
      weeks: Array.from({ length: TOTAL_WEEKS }, (_, index) => defaultWeek(index + 1))
    };
  }

  function normalizeWeek(raw, index) {
    const base = defaultWeek(index);
    const category = CATEGORIES.includes(raw?.category) ? raw.category : base.category;
    return {
      week: index,
      category,
      title: typeof raw?.title === 'string' ? raw.title.slice(0, 60) : '',
      target: typeof raw?.target === 'string' ? raw.target.slice(0, 120) : '',
      done: Boolean(raw?.done),
      memo: typeof raw?.memo === 'string' ? raw.memo.slice(0, 300) : ''
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return defaultState();
      const weeks = Array.from({ length: TOTAL_WEEKS }, (_, index) => normalizeWeek(parsed.weeks?.[index], index + 1));
      return {
        shareAllowed: Boolean(parsed.shareAllowed),
        publicName: typeof parsed.publicName === 'string' ? parsed.publicName.slice(0, 30) : '',
        activeWeek: Math.min(Math.max(Math.round(Number(parsed.activeWeek) || 1), 1), TOTAL_WEEKS),
        weeks
      };
    } catch {
      return defaultState();
    }
  }

  let state = loadState();

  function saveSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 350);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function profileSnapshot() {
    let profile = null;
    try { profile = typeof activeProfile === 'function' ? activeProfile() : null; } catch {}
    const level = Number(profile?.level) || 260;
    const bossIds = Array.isArray(profile?.clearedBossIds) ? profile.clearedBossIds : [];
    const levelScore = typeof levelPoints === 'function' ? levelPoints(level) : 0;
    const bossScore = typeof bossPoints === 'function' ? bossPoints(bossIds) : 0;
    const totalScore = levelScore + bossScore;
    const tier = typeof tierState === 'function' ? tierState(totalScore).current : null;
    return {
      profileName: profile?.name || '캐릭터',
      level,
      bossMissionCount: bossIds.length,
      levelScore,
      bossScore,
      totalScore,
      tierName: tier?.name || '미달성'
    };
  }

  function installStyles() {
    if (document.querySelector('#kirakiPersonalScheduleStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiPersonalScheduleStyles';
    style.textContent = `
.personal-schedule-panel{display:grid;gap:14px}.schedule-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.schedule-head h2{margin:0 0 5px;font-size:1.35rem;font-weight:950}.schedule-head p{margin:0;color:var(--muted);font-size:.84rem}.schedule-badge{display:inline-flex;align-items:center;min-height:30px;padding:5px 10px;border:1px solid #ead49a;border-radius:999px;background:#fff7dd;color:#795500;font-size:.72rem;font-weight:950;white-space:nowrap}.schedule-grid{display:grid;grid-template-columns:minmax(310px,.9fr) minmax(0,1.1fr);gap:12px}.schedule-card{padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.schedule-card.tint{background:linear-gradient(135deg,color-mix(in srgb,#f3e8ff 62%,var(--surface)),var(--surface));border-color:color-mix(in srgb,#7c3aed 28%,var(--line))}.schedule-card h3{margin:0 0 12px;font-size:1rem;font-weight:950}.schedule-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.schedule-metric{display:grid;gap:4px;min-height:74px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}.schedule-metric span{color:var(--muted);font-size:.68rem;font-weight:850}.schedule-metric strong{font-size:1rem;font-weight:950}.schedule-week-list{display:grid;gap:7px;max-height:640px;overflow:auto;padding-right:2px}.schedule-week-button{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;width:100%;min-height:48px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);text-align:left;cursor:pointer}.schedule-week-button.active{border-color:#7c3aed;box-shadow:inset 3px 0 0 #7c3aed}.schedule-week-button.done{background:color-mix(in srgb,#ecfdf5 76%,var(--surface))}.schedule-week-button strong{font-size:.82rem;font-weight:950}.schedule-week-button span{color:var(--muted);font-size:.68rem;font-weight:800}.schedule-week-button em{font-style:normal;font-size:.65rem;font-weight:950;color:#6d28d9}.schedule-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.schedule-field{display:grid;gap:6px;color:var(--ink);font-size:.75rem;font-weight:850}.schedule-field.full{grid-column:1/-1}.schedule-field input,.schedule-field select,.schedule-field textarea{width:100%;min-height:42px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--ink);font:inherit;font-weight:850;outline:none}.schedule-field textarea{min-height:96px;padding:10px;line-height:1.55;resize:vertical}.schedule-field input:focus,.schedule-field select:focus,.schedule-field textarea:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.14)}.schedule-share-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--soft)}.schedule-share-row label{display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:900}.schedule-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.schedule-code{max-height:220px;overflow:auto;margin:12px 0 0;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--muted);font-size:.68rem;line-height:1.55;white-space:pre-wrap;word-break:break-all}.schedule-hidden-tab[hidden]{display:none!important}@media(max-width:960px){.schedule-grid{grid-template-columns:1fr}.schedule-week-list{max-height:none}.schedule-summary-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:640px){.schedule-head,.schedule-share-row{display:grid}.schedule-summary-grid,.schedule-editor-grid{grid-template-columns:1fr}.schedule-actions{display:grid}.schedule-actions .button{width:100%}}
`;
    document.head.append(style);
  }

  function insertUi() {
    const nav = document.querySelector('.view-tabs');
    const footer = document.querySelector('.page-note');
    if (!nav || !footer || document.querySelector(`[data-view-button="${VIEW_ID}"]`)) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'view-tab schedule-hidden-tab';
    tab.dataset.viewButton = VIEW_ID;
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = '개인 일정표';
    nav.append(tab);

    const panel = document.createElement('section');
    panel.className = 'view-panel';
    panel.dataset.viewPanel = VIEW_ID;
    panel.hidden = true;
    panel.innerHTML = `
      <section class="panel personal-schedule-panel" aria-labelledby="personalScheduleTitle">
        <div class="schedule-head">
          <div>
            <p class="section-kicker">키라키 모드</p>
            <h2 id="personalScheduleTitle">개인 일정표</h2>
            <p>12주 동안의 코인샵, 레벨, 보스, 해방, 아이템버닝, 아버 진행상황을 주차별로 기록합니다.</p>
          </div>
          <span class="schedule-badge">비공개 준비 중</span>
        </div>
        <div class="schedule-grid">
          <article class="schedule-card tint">
            <h3>진행 요약</h3>
            <div class="schedule-summary-grid" id="scheduleSummaryGrid"></div>
            <div class="schedule-actions">
              <button type="button" class="button secondary small" id="scheduleUseCurrentWeek">오늘 주차 추정 적용</button>
            </div>
            <div class="schedule-week-list" id="scheduleWeekList"></div>
          </article>
          <article class="schedule-card">
            <h3 id="scheduleEditorTitle">1주차 일정</h3>
            <div class="schedule-editor-grid">
              <label class="schedule-field"><span>공개 별명</span><input id="schedulePublicName" maxlength="30" /></label>
              <label class="schedule-field"><span>카테고리</span><select id="scheduleCategory"></select></label>
              <label class="schedule-field full"><span>주차 목표</span><input id="scheduleTitle" maxlength="60" placeholder="예: 1주차 코인샵 예산 확정" /></label>
              <label class="schedule-field full"><span>해야 할 일</span><textarea id="scheduleTarget"></textarea></label>
              <label class="schedule-field full"><span>메모</span><textarea id="scheduleMemo"></textarea></label>
            </div>
            <div class="schedule-share-row">
              <label><input id="scheduleDone" type="checkbox" /> 이 주차 완료</label>
              <label><input id="scheduleShareAllowed" type="checkbox" /> 공유 허가</label>
            </div>
            <div class="schedule-actions">
              <button type="button" class="button primary small" id="scheduleSaveButton">일정 저장</button>
              <button type="button" class="button secondary small" id="scheduleExportButton">공유 JSON 내보내기</button>
              <button type="button" class="button ghost small" id="scheduleCopyButton">공유 JSON 복사</button>
            </div>
            <pre class="schedule-code" id="scheduleSharePreview"></pre>
          </article>
        </div>
      </section>`;
    footer.parentNode.insertBefore(panel, footer);
    tab.addEventListener('click', () => setView(VIEW_ID, { scroll: true }));
  }

  function activeWeek() {
    return state.weeks[state.activeWeek - 1] || state.weeks[0];
  }

  function completionPercent() {
    return Math.round((state.weeks.filter((week) => week.done).length / TOTAL_WEEKS) * 100);
  }

  function renderSummary() {
    const snap = profileSnapshot();
    const doneWeeks = state.weeks.filter((week) => week.done).length;
    const active = activeWeek();
    const wrap = document.querySelector('#scheduleSummaryGrid');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="schedule-metric"><span>캐릭터</span><strong>${esc(snap.profileName)}</strong></div>
      <div class="schedule-metric"><span>현재 상태</span><strong>Lv.${snap.level} · ${esc(snap.tierName)}</strong></div>
      <div class="schedule-metric"><span>진행률</span><strong>${completionPercent()}%</strong></div>
      <div class="schedule-metric"><span>완료 주차</span><strong>${doneWeeks}/${TOTAL_WEEKS}</strong></div>
      <div class="schedule-metric"><span>선택 주차</span><strong>${active.week}주차</strong></div>
      <div class="schedule-metric"><span>예상 누적 코인</span><strong>${nf.format(active.week * WEEKLY_COINS)}</strong></div>`;
  }

  function renderWeekList() {
    const wrap = document.querySelector('#scheduleWeekList');
    if (!wrap) return;
    wrap.innerHTML = state.weeks.map((week) => `
      <button type="button" class="schedule-week-button${week.week === state.activeWeek ? ' active' : ''}${week.done ? ' done' : ''}" data-schedule-week="${week.week}">
        <em>${week.week}주</em>
        <span><strong>${esc(week.title || `${week.week}주차 계획`)}</strong><span>${esc(week.category)} · ${nf.format(week.week * WEEKLY_COINS)} 코인</span></span>
        <span>${week.done ? '완료' : '진행'}</span>
      </button>`).join('');
  }

  function renderEditor() {
    const week = activeWeek();
    const category = document.querySelector('#scheduleCategory');
    if (category && !category.options.length) {
      category.innerHTML = CATEGORIES.map((item) => `<option value="${esc(item)}">${esc(item)}</option>`).join('');
    }
    const values = [
      ['#schedulePublicName', state.publicName],
      ['#scheduleCategory', week.category],
      ['#scheduleTitle', week.title],
      ['#scheduleTarget', week.target],
      ['#scheduleMemo', week.memo]
    ];
    values.forEach(([selector, value]) => {
      const node = document.querySelector(selector);
      if (node && node.value !== String(value || '')) node.value = value || '';
    });
    const done = document.querySelector('#scheduleDone');
    if (done) done.checked = week.done;
    const share = document.querySelector('#scheduleShareAllowed');
    if (share) share.checked = state.shareAllowed;
    const title = document.querySelector('#scheduleEditorTitle');
    if (title) title.textContent = `${week.week}주차 일정`;
    renderPreview();
  }

  function syncActiveWeekFromForm() {
    const week = activeWeek();
    state.publicName = document.querySelector('#schedulePublicName')?.value.trim().slice(0, 30) || '';
    week.category = document.querySelector('#scheduleCategory')?.value || week.category;
    week.title = document.querySelector('#scheduleTitle')?.value.trim().slice(0, 60) || '';
    week.target = document.querySelector('#scheduleTarget')?.value.slice(0, 120) || '';
    week.memo = document.querySelector('#scheduleMemo')?.value.slice(0, 300) || '';
    week.done = Boolean(document.querySelector('#scheduleDone')?.checked);
    state.shareAllowed = Boolean(document.querySelector('#scheduleShareAllowed')?.checked);
  }

  function sharePayload() {
    const snap = profileSnapshot();
    return {
      version: 1,
      consent: Boolean(state.shareAllowed),
      exportedAt: new Date().toISOString(),
      publicName: state.publicName || snap.profileName,
      snapshot: snap,
      schedule: {
        totalWeeks: TOTAL_WEEKS,
        weeklyCoins: WEEKLY_COINS,
        completionPercent: completionPercent(),
        weeks: state.weeks
      }
    };
  }

  function renderPreview() {
    const preview = document.querySelector('#scheduleSharePreview');
    if (!preview) return;
    preview.textContent = state.shareAllowed
      ? JSON.stringify(sharePayload(), null, 2)
      : '공유 허가를 켜면 내보낼 일정 데이터가 표시됩니다.';
  }

  function renderAll() {
    renderSummary();
    renderWeekList();
    renderEditor();
  }

  function exportPayload(copyOnly = false) {
    syncActiveWeekFromForm();
    saveNow();
    if (!state.shareAllowed) {
      renderAll();
      if (typeof toast === 'function') toast('공유 허가를 켠 뒤 내보낼 수 있습니다.');
      return;
    }
    const text = JSON.stringify(sharePayload(), null, 2);
    renderPreview();
    if (copyOnly) {
      navigator.clipboard?.writeText(text).then(() => toast?.('일정 공유 JSON을 복사했습니다.')).catch(() => toast?.('복사에 실패했습니다.'));
      return;
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiraki-schedule-${Date.now()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    if (typeof toast === 'function') toast('일정 공유 JSON을 내보냈습니다.');
  }

  function updateAccess() {
    const tab = document.querySelector(`[data-view-button="${VIEW_ID}"]`);
    if (tab) tab.hidden = !canAccess();
    if (!canAccess() && document.querySelector(`[data-view-panel="${VIEW_ID}"]`)?.classList.contains('active')) {
      if (typeof setView === 'function') setView('dashboard');
    }
  }

  function bindUi() {
    document.querySelector('.personal-schedule-panel')?.addEventListener('input', () => {
      syncActiveWeekFromForm();
      saveSoon();
      renderSummary();
      renderWeekList();
      renderPreview();
    }, true);
    document.querySelector('.personal-schedule-panel')?.addEventListener('change', () => {
      syncActiveWeekFromForm();
      saveNow();
      renderAll();
    }, true);
    document.querySelector('#scheduleWeekList')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-schedule-week]');
      if (!button) return;
      syncActiveWeekFromForm();
      state.activeWeek = Math.min(Math.max(Math.round(Number(button.dataset.scheduleWeek) || 1), 1), TOTAL_WEEKS);
      saveNow();
      renderAll();
    });
    document.querySelector('#scheduleSaveButton')?.addEventListener('click', () => {
      syncActiveWeekFromForm();
      saveNow();
      renderAll();
      if (typeof toast === 'function') toast('개인 일정표를 저장했습니다.');
    });
    document.querySelector('#scheduleUseCurrentWeek')?.addEventListener('click', () => {
      state.activeWeek = Math.min(Math.max(Math.round(Number(document.querySelector('#eventCoinCurrentWeek')?.value) || state.activeWeek), 1), TOTAL_WEEKS);
      saveNow();
      renderAll();
    });
    document.querySelector('#scheduleExportButton')?.addEventListener('click', () => exportPayload(false));
    document.querySelector('#scheduleCopyButton')?.addEventListener('click', () => exportPayload(true));
  }

  function wrapSetView() {
    if (window.__kirakiPersonalScheduleSetViewWrapped || typeof setView !== 'function') return;
    window.__kirakiPersonalScheduleSetViewWrapped = true;
    const baseSetView = setView;
    setView = function scheduleAwareSetView(nextView, options = {}) {
      if (nextView !== VIEW_ID) return baseSetView(nextView, options);
      if (!canAccess()) {
        pendingScheduleView = true;
        if (typeof openAdminDialog === 'function') openAdminDialog();
        if (typeof toast === 'function') toast('개인 일정표는 키라키 모드에서만 열립니다.');
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
    if (window.__kirakiPersonalScheduleAdminWrapped || typeof setAdminUnlocked !== 'function') return;
    window.__kirakiPersonalScheduleAdminWrapped = true;
    const baseSetAdminUnlocked = setAdminUnlocked;
    setAdminUnlocked = function scheduleAwareAdminUnlock(unlocked) {
      baseSetAdminUnlocked(unlocked);
      updateAccess();
      if (unlocked && pendingScheduleView) {
        pendingScheduleView = false;
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
    try {
      if (typeof VIEW_SESSION_KEY !== 'undefined' && sessionStorage.getItem(VIEW_SESSION_KEY) === VIEW_ID) setTimeout(() => setView(VIEW_ID), 0);
    } catch {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();