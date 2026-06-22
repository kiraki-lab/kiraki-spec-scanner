(() => {
  'use strict';

  if (window.__kirakiRoadmapJournalLoaded) return;
  window.__kirakiRoadmapJournalLoaded = true;

  const ROADMAP_PUBLIC = false;
  const VIEW_ID = 'roadmapJournal';
  const STORAGE_KEY = 'kiraki-roadmap-journal:v1';
  const nf = typeof number !== 'undefined' ? number : new Intl.NumberFormat('ko-KR');
  const esc = typeof escapeHtml === 'function'
    ? escapeHtml
    : (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  let pendingRoadmapView = false;
  let saveTimer = null;

  function canAccess() {
    return ROADMAP_PUBLIC || (typeof isAdminUnlocked === 'function' && isAdminUnlocked());
  }

  function defaultState() {
    return {
      publicName: '',
      shareAllowed: false,
      goalLevel: 280,
      goalTierId: 'sapphire',
      goalText: '',
      weeklyMemo: '',
      nextAction: '',
      tags: []
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== 'object') return defaultState();
      return { ...defaultState(), ...parsed, shareAllowed: Boolean(parsed.shareAllowed) };
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
    const total = levelScore + bossScore;
    const tier = typeof tierState === 'function' ? tierState(total).current : null;
    return {
      profileName: profile?.name || '캐릭터',
      level,
      bossCount: bossIds.length,
      levelScore,
      bossScore,
      totalScore: total,
      tierName: tier?.name || '미달성'
    };
  }

  function installStyles() {
    if (document.querySelector('#kirakiRoadmapJournalStyles')) return;
    const style = document.createElement('style');
    style.id = 'kirakiRoadmapJournalStyles';
    style.textContent = `
.roadmap-panel{display:grid;gap:14px}.roadmap-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.roadmap-head h2{margin:0 0 5px;font-size:1.35rem;font-weight:950}.roadmap-head p{margin:0;color:var(--muted);font-size:.84rem}.roadmap-badge{display:inline-flex;align-items:center;min-height:30px;padding:5px 10px;border:1px solid #ead49a;border-radius:999px;background:#fff7dd;color:#795500;font-size:.72rem;font-weight:950;white-space:nowrap}.roadmap-grid{display:grid;grid-template-columns:minmax(0,.92fr) minmax(320px,1.08fr);gap:12px}.roadmap-card{padding:15px;border:1px solid var(--line);border-radius:14px;background:var(--surface)}.roadmap-card.tint{background:linear-gradient(135deg,color-mix(in srgb,#e0f7ff 70%,var(--surface)),var(--surface));border-color:color-mix(in srgb,#38bdf8 35%,var(--line))}.roadmap-card h3{margin:0 0 12px;font-size:1rem;font-weight:950}.roadmap-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.roadmap-field{display:grid;gap:6px;color:var(--ink);font-size:.75rem;font-weight:850}.roadmap-field.full{grid-column:1/-1}.roadmap-field input,.roadmap-field select,.roadmap-field textarea{width:100%;min-height:42px;padding:0 10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--ink);font:inherit;font-weight:850;outline:none}.roadmap-field textarea{min-height:92px;padding:10px;line-height:1.55;resize:vertical}.roadmap-field input:focus,.roadmap-field select:focus,.roadmap-field textarea:focus{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.16)}.roadmap-share-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:10px;border:1px solid var(--line);border-radius:12px;background:var(--soft)}.roadmap-share-row label{display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:900}.roadmap-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.roadmap-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.roadmap-metric{display:grid;gap:4px;min-height:76px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--soft)}.roadmap-metric span{color:var(--muted);font-size:.68rem;font-weight:850}.roadmap-metric strong{font-size:1rem;font-weight:950}.roadmap-code{max-height:220px;overflow:auto;margin:12px 0 0;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--muted);font-size:.68rem;line-height:1.55;white-space:pre-wrap;word-break:break-all}.roadmap-hidden-tab[hidden]{display:none!important}@media(max-width:900px){.roadmap-grid{grid-template-columns:1fr}.roadmap-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.roadmap-head,.roadmap-share-row{display:grid}.roadmap-form-grid,.roadmap-metrics{grid-template-columns:1fr}.roadmap-actions{display:grid}.roadmap-actions .button{width:100%}}
`;
    document.head.append(style);
  }

  function tierOptions() {
    const tiers = (typeof DATA !== 'undefined' && Array.isArray(DATA.tiers)) ? DATA.tiers : [];
    return tiers.map((tier) => `<option value="${esc(tier.id)}">${esc(tier.name)} · ${nf.format(tier.threshold)}</option>`).join('');
  }

  function insertUi() {
    const nav = document.querySelector('.view-tabs');
    const footer = document.querySelector('.page-note');
    if (!nav || !footer || document.querySelector(`[data-view-button="${VIEW_ID}"]`)) return;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'view-tab roadmap-hidden-tab';
    tab.dataset.viewButton = VIEW_ID;
    tab.setAttribute('aria-selected', 'false');
    tab.textContent = '로드맵 일지';
    nav.append(tab);

    const panel = document.createElement('section');
    panel.className = 'view-panel';
    panel.dataset.viewPanel = VIEW_ID;
    panel.hidden = true;
    panel.innerHTML = `
      <section class="panel roadmap-panel" aria-labelledby="roadmapJournalTitle">
        <div class="roadmap-head">
          <div>
            <p class="section-kicker">키라키 모드</p>
            <h2 id="roadmapJournalTitle">로드맵 일지</h2>
            <p>캐릭터 목표와 진행도 스냅샷을 저장하고, 허가한 경우만 공유용 데이터로 내보냅니다.</p>
          </div>
          <span class="roadmap-badge">비공개 준비 중</span>
        </div>
        <div class="roadmap-grid">
          <article class="roadmap-card tint">
            <h3>현재 스냅샷</h3>
            <div class="roadmap-metrics" id="roadmapSnapshotMetrics"></div>
            <div class="roadmap-actions">
              <button type="button" class="button secondary small" id="roadmapRefreshSnapshot">현재 진행도 새로고침</button>
            </div>
          </article>
          <article class="roadmap-card">
            <h3>개인 로드맵</h3>
            <div class="roadmap-form-grid">
              <label class="roadmap-field"><span>공개 별명</span><input id="roadmapPublicName" maxlength="30" /></label>
              <label class="roadmap-field"><span>목표 레벨</span><input id="roadmapGoalLevel" type="number" min="260" max="290" step="1" inputmode="numeric" /></label>
              <label class="roadmap-field full"><span>목표 티어</span><select id="roadmapGoalTier">${tierOptions()}</select></label>
              <label class="roadmap-field full"><span>이번 목표</span><textarea id="roadmapGoalText"></textarea></label>
              <label class="roadmap-field full"><span>다음 행동</span><textarea id="roadmapNextAction"></textarea></label>
              <label class="roadmap-field full"><span>주간 메모</span><textarea id="roadmapWeeklyMemo"></textarea></label>
            </div>
            <div class="roadmap-share-row">
              <label><input id="roadmapShareAllowed" type="checkbox" /> 공유 허가</label>
              <span class="roadmap-badge" id="roadmapShareState">로컬 저장</span>
            </div>
            <div class="roadmap-actions">
              <button type="button" class="button primary small" id="roadmapSaveButton">일지 저장</button>
              <button type="button" class="button secondary small" id="roadmapExportButton">공유 JSON 내보내기</button>
              <button type="button" class="button ghost small" id="roadmapCopyButton">공유 JSON 복사</button>
            </div>
            <pre class="roadmap-code" id="roadmapSharePreview"></pre>
          </article>
        </div>
      </section>`;
    footer.parentNode.insertBefore(panel, footer);
    tab.addEventListener('click', () => setView(VIEW_ID, { scroll: true }));
  }

  function setText(selector, text) {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }

  function renderSnapshot() {
    const snap = profileSnapshot();
    const wrap = document.querySelector('#roadmapSnapshotMetrics');
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="roadmap-metric"><span>캐릭터</span><strong>${esc(snap.profileName)}</strong></div>
      <div class="roadmap-metric"><span>레벨</span><strong>Lv.${snap.level}</strong></div>
      <div class="roadmap-metric"><span>티어</span><strong>${esc(snap.tierName)}</strong></div>
      <div class="roadmap-metric"><span>총 포인트</span><strong>${nf.format(snap.totalScore)}</strong></div>
      <div class="roadmap-metric"><span>보스 미션</span><strong>${nf.format(snap.bossCount)}개</strong></div>
      <div class="roadmap-metric"><span>보스 포인트</span><strong>${nf.format(snap.bossScore)}</strong></div>`;
  }

  function renderForm() {
    const fields = [
      ['#roadmapPublicName', state.publicName],
      ['#roadmapGoalLevel', state.goalLevel],
      ['#roadmapGoalTier', state.goalTierId],
      ['#roadmapGoalText', state.goalText],
      ['#roadmapNextAction', state.nextAction],
      ['#roadmapWeeklyMemo', state.weeklyMemo]
    ];
    fields.forEach(([selector, value]) => {
      const node = document.querySelector(selector);
      if (node && node.value !== String(value || '')) node.value = value || '';
    });
    const checkbox = document.querySelector('#roadmapShareAllowed');
    if (checkbox) checkbox.checked = state.shareAllowed;
    setText('#roadmapShareState', state.shareAllowed ? '공유 허가됨' : '로컬 저장');
    renderSharePreview();
  }

  function sharePayload() {
    const snap = profileSnapshot();
    const goalTier = (typeof DATA !== 'undefined' ? DATA.tiers : [])?.find?.((tier) => tier.id === state.goalTierId) || null;
    return {
      version: 1,
      consent: Boolean(state.shareAllowed),
      exportedAt: new Date().toISOString(),
      publicName: state.publicName || snap.profileName,
      snapshot: snap,
      goals: {
        level: Number(state.goalLevel) || 280,
        tierId: state.goalTierId,
        tierName: goalTier?.name || '',
        text: state.goalText,
        nextAction: state.nextAction,
        weeklyMemo: state.weeklyMemo
      }
    };
  }

  function renderSharePreview() {
    const preview = document.querySelector('#roadmapSharePreview');
    if (!preview) return;
    const payload = sharePayload();
    preview.textContent = state.shareAllowed
      ? JSON.stringify(payload, null, 2)
      : '공유 허가를 켜면 내보낼 데이터가 표시됩니다.';
  }

  function syncStateFromForm() {
    state.publicName = document.querySelector('#roadmapPublicName')?.value.trim().slice(0, 30) || '';
    state.goalLevel = Math.min(Math.max(Math.round(Number(document.querySelector('#roadmapGoalLevel')?.value) || 280), 260), 290);
    state.goalTierId = document.querySelector('#roadmapGoalTier')?.value || 'sapphire';
    state.goalText = document.querySelector('#roadmapGoalText')?.value || '';
    state.nextAction = document.querySelector('#roadmapNextAction')?.value || '';
    state.weeklyMemo = document.querySelector('#roadmapWeeklyMemo')?.value || '';
    state.shareAllowed = Boolean(document.querySelector('#roadmapShareAllowed')?.checked);
  }

  function exportPayload(copyOnly = false) {
    syncStateFromForm();
    saveNow();
    if (!state.shareAllowed) {
      if (typeof toast === 'function') toast('공유 허가를 켠 뒤 내보낼 수 있습니다.');
      renderForm();
      return;
    }
    const text = JSON.stringify(sharePayload(), null, 2);
    renderSharePreview();
    if (copyOnly) {
      navigator.clipboard?.writeText(text).then(() => toast?.('공유 JSON을 복사했습니다.')).catch(() => toast?.('복사에 실패했습니다.'));
      return;
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiraki-roadmap-${Date.now()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    if (typeof toast === 'function') toast('공유 JSON을 내보냈습니다.');
  }

  function renderAll() {
    renderSnapshot();
    renderForm();
  }

  function updateAccess() {
    const tab = document.querySelector(`[data-view-button="${VIEW_ID}"]`);
    if (tab) tab.hidden = !canAccess();
    if (!canAccess() && document.querySelector(`[data-view-panel="${VIEW_ID}"]`)?.classList.contains('active')) {
      if (typeof setView === 'function') setView('dashboard');
    }
  }

  function bindUi() {
    document.querySelector('.roadmap-panel')?.addEventListener('input', () => {
      syncStateFromForm();
      saveSoon();
      renderSharePreview();
      setText('#roadmapShareState', state.shareAllowed ? '공유 허가됨' : '로컬 저장');
    }, true);
    document.querySelector('.roadmap-panel')?.addEventListener('change', () => {
      syncStateFromForm();
      saveNow();
      renderForm();
    }, true);
    document.querySelector('#roadmapSaveButton')?.addEventListener('click', () => {
      syncStateFromForm();
      saveNow();
      renderAll();
      if (typeof toast === 'function') toast('로드맵 일지를 저장했습니다.');
    });
    document.querySelector('#roadmapRefreshSnapshot')?.addEventListener('click', renderSnapshot);
    document.querySelector('#roadmapExportButton')?.addEventListener('click', () => exportPayload(false));
    document.querySelector('#roadmapCopyButton')?.addEventListener('click', () => exportPayload(true));
  }

  function wrapSetView() {
    if (window.__kirakiRoadmapJournalSetViewWrapped || typeof setView !== 'function') return;
    window.__kirakiRoadmapJournalSetViewWrapped = true;
    const baseSetView = setView;
    setView = function roadmapAwareSetView(nextView, options = {}) {
      if (nextView !== VIEW_ID) return baseSetView(nextView, options);
      if (!canAccess()) {
        pendingRoadmapView = true;
        if (typeof openAdminDialog === 'function') openAdminDialog();
        if (typeof toast === 'function') toast('로드맵 일지는 키라키 모드에서만 열립니다.');
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
    if (window.__kirakiRoadmapJournalAdminWrapped || typeof setAdminUnlocked !== 'function') return;
    window.__kirakiRoadmapJournalAdminWrapped = true;
    const baseSetAdminUnlocked = setAdminUnlocked;
    setAdminUnlocked = function roadmapAwareAdminUnlock(unlocked) {
      baseSetAdminUnlocked(unlocked);
      updateAccess();
      if (unlocked && pendingRoadmapView) {
        pendingRoadmapView = false;
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