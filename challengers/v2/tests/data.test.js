const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('challengers/v2/data.js', 'utf8'), context);
const data = context.window.CHALLENGERS_DATA;

const levelPoints = (level) => data.levelMissions
  .filter((mission) => mission.level <= level)
  .reduce((sum, mission) => sum + mission.points, 0);

const bossPointsAtOrBelow = (points) => data.bossMissions
  .filter((boss) => boss.points <= points)
  .reduce((sum, boss) => sum + boss.points, 0);

const byId = new Map(data.bossMissions.map((boss) => [boss.id, boss]));
const bySeries = new Map();
data.bossMissions.forEach((boss) => {
  if (!bySeries.has(boss.series)) bySeries.set(boss.series, []);
  bySeries.get(boss.series).push(boss);
});
bySeries.forEach((bosses) => bosses.sort((a, b) => a.rank - b.rank));

const normalizeBossIds = (ids) => {
  const selected = new Set(ids.filter((id) => byId.has(id)));
  [...selected].forEach((id) => {
    const boss = byId.get(id);
    (bySeries.get(boss.series) || []).forEach((candidate) => {
      if (candidate.rank < boss.rank) selected.add(candidate.id);
    });
  });
  return [...selected];
};

const presetBossIds = (preset) => {
  if (Array.isArray(preset.bossIds)) return normalizeBossIds(preset.bossIds);
  return normalizeBossIds([
    ...data.bossMissions.filter((boss) => boss.points <= Number(preset.includeAtOrBelow || 0)).map((boss) => boss.id),
    ...(Array.isArray(preset.extraBossIds) ? preset.extraBossIds : [])
  ]);
};

const presetTotal = (preset) => levelPoints(preset.level) + presetBossIds(preset)
  .reduce((sum, id) => sum + byId.get(id).points, 0);

assert.equal(data.bossMissions.length, 36);
assert.equal(levelPoints(276), 11200);
assert.equal(levelPoints(280), 15700);
assert.equal(levelPoints(281), 17200);
assert.equal(levelPoints(282), 18700);
assert.equal(levelPoints(284), 21700);
assert.equal(bossPointsAtOrBelow(3000), 29300);
assert.equal(levelPoints(276) + bossPointsAtOrBelow(3000), 40500);
assert.deepEqual(data.buildTypes.map((type) => type.id), ['hunting', 'boss']);
assert.deepEqual(data.buildTypes.map((type) => type.name), ['사냥 빌드', '보스 빌드']);
assert.equal(new Set(data.bossMissions.map((boss) => boss.id)).size, data.bossMissions.length);
assert.equal(new Set(data.presets.map((preset) => preset.id)).size, data.presets.length);
assert.ok(data.presets.every((preset) => ['hunting', 'boss'].includes(preset.type)), '모든 빌드는 두 유형 중 하나여야 합니다.');

const expected = {
  'bronze-stable-v01': 5300,
  'silver-stable-v01': 10000,
  'gold-stable-v01': 15100,
  'platinum-stable-v01': 20200,
  'emerald-stable-v01': 30000,
  'emerald-video-30k-v01': 30000,
  'sapphire-reference-v01': 40500,
  'sapphire-video-40k-no-hilla-v01': 40000,
  'sapphire-video-40k-normal-will-hilla-v01': 41000,
  'sapphire-video-40k-normal-will-no-hilla-v01': 40500,
  'diamond-video-50k-mayrin-v01': 50000,
  'diamond-video-50k-black-mage-v01': 51000,
  'diamond-video-50k-seren-v01': 51000,
  'master-video-adversary-v01': 70000,
  'master-video-kalos-v01': 70500,
  'challenger-video-hard-mayrin-v01': 90000
};

data.presets.forEach((preset) => {
  assert.ok(Object.prototype.hasOwnProperty.call(expected, preset.id), `예상값이 없는 프리셋: ${preset.id}`);
  assert.equal(presetTotal(preset), expected[preset.id], `${preset.name} 총점`);
});

console.log('challengers v2 data tests passed');
