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