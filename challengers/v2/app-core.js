'use strict';

const DATA = window.CHALLENGERS_DATA;
if (!DATA) throw new Error('챌린저스 데이터를 불러오지 못했습니다.');

const STORAGE_KEY = 'kiraki-challengers-calculator:v1';
const ADMIN_SESSION_KEY = 'kiraki-challengers-admin-unlocked';
const VIEW_SESSION_KEY = 'kiraki-challengers-active-view';
const STORE_VERSION = 2;
const ADMIN_KEY_HASH = 'e0bc60c82713f64ef8a57c0c40d02ce24fd0141d5cc3086259c19b1e62a62bea';
const number = new Intl.NumberFormat('ko-KR');
const byId = new Map(DATA.bossMissions.map((boss) => [boss.id, boss]));
const bySeries = new Map();
const typeById = new Map(DATA.buildTypes.map((type) => [type.id, type]));
let recommendationIds = [];
let recommendationOptions = [];
let selectedRecommendationIndex = 0;
let adminDraftBossIds = [];
let saveTimer = null;
let levelTimer = null;
let toastTimer = null;

DATA.bossMissions.forEach((boss) => {
  if (!bySeries.has(boss.series)) bySeries.set(boss.series, []);
  bySeries.get(boss.series).push(boss);
});
bySeries.forEach((bosses) => bosses.sort((a, b) => a.rank - b.rank));

const el = {
  profileSelect: document.querySelector('#profileSelect'),
  addProfileButton: document.querySelector('#addProfileButton'),
  renameProfileButton: document.querySelector('#renameProfileButton'),
  deleteProfileButton: document.querySelector('#deleteProfileButton'),
  exportButton: document.querySelector('#exportButton'),
  importInput: document.querySelector('#importInput'),
  saveStatus: document.querySelector('#saveStatus'),
  resetProgressButton: document.querySelector('#resetProgressButton'),
  levelInput: document.querySelector('#levelInput'),
  toolbarTotalPoints: document.querySelector('#toolbarTotalPoints'),
  toolbarTierName: document.querySelector('#toolbarTierName'),
  levelMissionSummary: document.querySelector('#levelMissionSummary'),
  levelPoints: document.querySelector('#levelPoints'),
  bossPoints: document.querySelector('#bossPoints'),
  totalPoints: document.querySelector('#totalPoints'),
  currentTierName: document.querySelector('#currentTierName'),
  nextTierCopy: document.querySelector('#nextTierCopy'),
  tierProgressFill: document.querySelector('#tierProgressFill'),
  tierScale: document.querySelector('#tierScale'),
  targetTierSelect: document.querySelector('#targetTierSelect'),
  recommendationResult: document.querySelector('#recommendationResult'),
  applyRecommendationButton: document.querySelector('#applyRecommendationButton'),
  presetTypeFilter: document.querySelector('#presetTypeFilter'),
  presetTierFilter: document.querySelector('#presetTierFilter'),
  presetGrid: document.querySelector('#presetGrid'),
  presetEmptyState: document.querySelector('#presetEmptyState'),
  bossRangeFilter: document.querySelector('#bossRangeFilter'),
  bossGroups: document.querySelector('#bossGroups'),
  bossEmptyState: document.querySelector('#bossEmptyState'),
  clearBossesButton: document.querySelector('#clearBossesButton'),
  adminOpenButton: document.querySelector('#adminOpenButton'),
  adminDialog: document.querySelector('#adminDialog'),
  adminCloseButton: document.querySelector('#adminCloseButton'),
  adminLockButton: document.querySelector('#adminLockButton'),
  adminPresetForm: document.querySelector('#adminPresetForm'),
  adminPresetId: document.querySelector('#adminPresetId'),
  adminPresetName: document.querySelector('#adminPresetName'),
  adminPresetType: document.querySelector('#adminPresetType'),
  adminPresetTier: document.querySelector('#adminPresetTier'),
  adminPresetLevel: document.querySelector('#adminPresetLevel'),
  adminPresetSummary: document.querySelector('#adminPresetSummary'),
  adminPresetNote: document.querySelector('#adminPresetNote'),
  adminBossSummary: document.querySelector('#adminBossSummary'),
  adminBossPicker: document.querySelector('#adminBossPicker'),
  adminLoadCurrentButton: document.querySelector('#adminLoadCurrentButton'),
  adminClearBossButton: document.querySelector('#adminClearBossButton'),
  adminSavePresetButton: document.querySelector('#adminSavePresetButton'),
  adminResetFormButton: document.querySelector('#adminResetFormButton'),
  adminPresetTotal: document.querySelector('#adminPresetTotal'),
  adminExportBuildsButton: document.querySelector('#adminExportBuildsButton'),
  adminPresetList: document.querySelector('#adminPresetList'),
  toast: document.querySelector('#toast')
};

const canStore = (() => {
  try {
    localStorage.setItem(`${STORAGE_KEY}:test`, '1');
    localStorage.removeItem(`${STORAGE_KEY}:test`);
    return true;
  } catch {
    return false;
  }
})();

const makeId = (prefix = 'profile') => window.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function defaultProfile(name = '첫 캐릭터') {
  return { id: makeId('profile'), name, level: 260, clearedBossIds: [], targetTierId: 'silver', updatedAt: new Date().toISOString() };
}

function normalizeBosses(ids) {
  const selected = new Set((ids || []).filter((id) => byId.has(id)));
  [...selected].forEach((id) => {
    const boss = byId.get(id);
    (bySeries.get(boss.series) || []).forEach((candidate) => {
      if (candidate.rank < boss.rank) selected.add(candidate.id);
    });
  });
  return [...selected];
}

function removeBossAndHigher(ids, removedId) {
  const removed = byId.get(removedId);
  if (!removed) return (ids || []).filter((id) => id !== removedId);
  return (ids || []).filter((id) => {
    const boss = byId.get(id);
    return boss && (boss.series !== removed.series || boss.rank < removed.rank);
  });
}

function sanitizeProfile(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const validIds = Array.isArray(raw.clearedBossIds) ? raw.clearedBossIds.filter((id) => byId.has(id)) : [];
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId('profile'),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 30) : '캐릭터',
    level: clamp(Math.round(Number(raw.level) || 260), 260, 290),
    clearedBossIds: normalizeBosses([...new Set(validIds)]),
    targetTierId: DATA.tiers.some((tier) => tier.id === raw.targetTierId) ? raw.targetTierId : 'silver',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString()
  };
}

function sanitizeCustomPreset(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const bossIds = normalizeBosses(Array.isArray(raw.bossIds) ? raw.bossIds : []);
  const type = typeById.has(raw.type) ? raw.type : 'custom';
  const tierId = DATA.tiers.some((tier) => tier.id === raw.tierId) ? raw.tierId : 'bronze';
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 40) : '';
  if (!name) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeId('build'),
    name,
    type,
    tierId,
    level: clamp(Math.round(Number(raw.level) || 260), 260, 290),
    bossIds,
    status: 'custom',
    summary: typeof raw.summary === 'string' ? raw.summary.trim().slice(0, 100) : '',
    note: typeof raw.note === 'string' ? raw.note.trim().slice(0, 240) : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString()
  };
}

function loadStore() {
  try {
    if (!canStore) throw new Error('storage disabled');
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || ![1, 2].includes(parsed.version) || !Array.isArray(parsed.profiles)) throw new Error('invalid');
    const profiles = parsed.profiles.map(sanitizeProfile).filter(Boolean);
    if (!profiles.length) throw new Error('empty');
    const customPresets = Array.isArray(parsed.customPresets) ? parsed.customPresets.map(sanitizeCustomPreset).filter(Boolean) : [];
    return {
      version: STORE_VERSION,
      profiles,
      customPresets,
      activeProfileId: profiles.some((profile) => profile.id === parsed.activeProfileId) ? parsed.activeProfileId : profiles[0].id
    };
  } catch {
    const profile = defaultProfile();
    return { version: STORE_VERSION, profiles: [profile], customPresets: [], activeProfileId: profile.id };
  }
}

let store = loadStore();
function activeProfile() { return store.profiles.find((profile) => profile.id === store.activeProfileId) || store.profiles[0]; }
function save(message = '자동 저장됨') {
  if (!canStore) { el.saveStatus.textContent = '브라우저 저장 제한'; return; }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    el.saveStatus.textContent = message;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { el.saveStatus.textContent = '자동 저장 켜짐'; }, 1400);
  } catch { el.saveStatus.textContent = '저장 실패 · 백업 권장'; }
}
function patchProfile(patch, message) { Object.assign(activeProfile(), patch, { updatedAt: new Date().toISOString() }); save(message); }
function levelPoints(level) { return DATA.levelMissions.filter((mission) => mission.level <= level).reduce((sum, mission) => sum + mission.points, 0); }
function bossPoints(ids) { return [...new Set(ids || [])].reduce((sum, id) => sum + (byId.get(id)?.points || 0), 0); }
function tierState(total) { return { current: DATA.tiers.filter((tier) => total >= tier.threshold).at(-1) || null, next: DATA.tiers.find((tier) => total < tier.threshold) || null }; }

function collapseTargets(ids) {
  const grouped = new Map();
  [...new Set(ids || [])].forEach((id) => {
    const boss = byId.get(id);
    if (!boss) return;
    if (!grouped.has(boss.series)) grouped.set(boss.series, []);
    grouped.get(boss.series).push(boss);
  });
  return [...grouped.values()].map((bosses) => {
    bosses.sort((a, b) => a.rank - b.rank);
    return { target: bosses.at(-1), missionCount: bosses.length, points: bosses.reduce((sum, boss) => sum + boss.points, 0) };
  }).sort((a, b) => a.target.points - b.target.points || a.target.boss.localeCompare(b.target.boss, 'ko'));
}

function presetBossIds(preset) {
  if (Array.isArray(preset.bossIds)) return normalizeBosses(preset.bossIds);
  return normalizeBosses([
    ...DATA.bossMissions.filter((boss) => boss.points <= Number(preset.includeAtOrBelow || 0)).map((boss) => boss.id),
    ...(Array.isArray(preset.extraBossIds) ? preset.extraBossIds : [])
  ]);
}
function allPresets() { return [...DATA.presets, ...store.customPresets]; }

function setView(view, options = {}) {
  const next = ['dashboard', 'presets', 'bosses'].includes(view) ? view : 'dashboard';
  document.querySelectorAll('[data-view-button]').forEach((button) => {
    const active = button.dataset.viewButton === next;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    const active = panel.dataset.viewPanel === next;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
  try { sessionStorage.setItem(VIEW_SESSION_KEY, next); } catch {}
  if (options.scroll) document.querySelector('.view-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildStaticUi() {
  el.tierScale.innerHTML = DATA.tiers.map((tier) => `<span title="${number.format(tier.threshold)}점">${escapeHtml(tier.name)}</span>`).join('');
  const tierOptions = DATA.tiers.map((tier) => `<option value="${tier.id}">${escapeHtml(tier.name)} · ${number.format(tier.threshold)}</option>`).join('');
  el.targetTierSelect.innerHTML = tierOptions;
  el.adminPresetTier.innerHTML = tierOptions;
  el.presetTierFilter.innerHTML = `<option value="all">전체 티어</option>${DATA.tiers.map((tier) => `<option value="${tier.id}">${escapeHtml(tier.name)}</option>`).join('')}`;
  const typeOptions = DATA.buildTypes.map((type) => `<option value="${type.id}">${escapeHtml(type.name)}</option>`).join('');
  el.adminPresetType.innerHTML = typeOptions;
  el.presetTypeFilter.innerHTML = `<option value="all">전체 유형</option>${typeOptions}`;
  const groups = new Map();
  DATA.bossMissions.forEach((boss) => { if (!groups.has(boss.points)) groups.set(boss.points, []); groups.get(boss.points).push(boss); });
  el.bossGroups.innerHTML = [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([points, bosses]) => `
    <details class="boss-group" data-boss-group data-points="${points}"><summary><span class="boss-group-title">${number.format(points)}점 난이도 <span class="boss-group-meta" data-group-meta="${points}">0/${bosses.length} 완료</span></span></summary><div class="boss-card-grid">${bosses.map((boss) => `<label class="boss-check" data-boss-card="${boss.id}"><input type="checkbox" value="${boss.id}" data-boss-checkbox /><span class="boss-copy"><strong>${escapeHtml(boss.shortBoss || boss.boss)}</strong><span>${escapeHtml(boss.difficulty)} · ${number.format(boss.points)}점</span></span></label>`).join('')}</div></details>`).join('');
  el.adminBossPicker.innerHTML = DATA.bossMissions.map((boss) => `<label class="admin-boss-check" data-admin-boss-card="${boss.id}"><input type="checkbox" value="${boss.id}" data-admin-boss-checkbox /><span><strong>${escapeHtml(boss.shortBoss || boss.boss)} ${escapeHtml(boss.difficulty)}</strong><small>${number.format(boss.points)}점</small></span></label>`).join('');
  const savedView = (() => { try { return sessionStorage.getItem(VIEW_SESSION_KEY); } catch { return null; } })();
  setView(savedView || 'dashboard');
}
