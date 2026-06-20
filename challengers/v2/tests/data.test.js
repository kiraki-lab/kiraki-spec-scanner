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
const presetTotal = (preset) => {
  const ids = new Set([
    ...data.bossMissions.filter((boss) => boss.points <= preset.includeAtOrBelow).map((boss) => boss.id),
    ...preset.extraBossIds
  ]);
  return levelPoints(preset.level) + [...ids].reduce((sum, id) => sum + byId.get(id).points, 0);
};

assert.equal(data.bossMissions.length, 36);
assert.equal(levelPoints(276), 11200);
assert.equal(bossPointsAtOrBelow(3000), 29300);
assert.equal(levelPoints(276) + bossPointsAtOrBelow(3000), 40500);
assert.deepEqual(
  data.buildTypes.map((type) => type.id),
  ['balanced', 'hunting', 'boss', 'newbie', 'custom']
);
assert.equal(new Set(data.bossMissions.map((boss) => boss.id)).size, data.bossMissions.length);
assert.equal(new Set(data.presets.map((preset) => preset.id)).size, data.presets.length);

const expected = {
  'bronze-stable-v01': 5300,
  'silver-stable-v01': 10000,
  'gold-stable-v01': 15100,
  'platinum-stable-v01': 20200,
  'emerald-stable-v01': 30000,
  'sapphire-reference-v01': 40500
};

data.presets.forEach((preset) => assert.equal(presetTotal(preset), expected[preset.id], preset.name));
console.log('challengers v2 data tests passed');
