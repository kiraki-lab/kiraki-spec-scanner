const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('./data.js', 'utf8'), context);
const data = context.window.CHALLENGERS_DATA;

const levelPoints = (level) => data.levelMissions
  .filter((mission) => mission.level <= level)
  .reduce((sum, mission) => sum + mission.points, 0);
const bossPointsAtOrBelow = (points) => data.bossMissions
  .filter((boss) => boss.points <= points)
  .reduce((sum, boss) => sum + boss.points, 0);

assert.equal(data.bossMissions.length, 36, '보스 미션은 36개여야 합니다.');
assert.equal(levelPoints(276), 11200, 'Lv.276 레벨 포인트가 11,200점이어야 합니다.');
assert.equal(bossPointsAtOrBelow(3000), 29300, '3,000점 이하 보스 합계가 29,300점이어야 합니다.');
assert.equal(levelPoints(276) + bossPointsAtOrBelow(3000), 40500, '사파이어 기준 빌드는 40,500점이어야 합니다.');
assert.equal(levelPoints(264), 4200);
assert.equal(bossPointsAtOrBelow(500), 3800);
assert.equal(levelPoints(266), 4800);
assert.equal(bossPointsAtOrBelow(1000), 8800);

const bossById = new Map(data.bossMissions.map((boss) => [boss.id, boss]));
const presetTotal = (preset) => {
  const ids = new Set([
    ...data.bossMissions.filter((boss) => boss.points <= preset.includeAtOrBelow).map((boss) => boss.id),
    ...preset.extraBossIds
  ]);
  const bossPoints = [...ids].reduce((sum, id) => sum + bossById.get(id).points, 0);
  return levelPoints(preset.level) + bossPoints;
};

assert.equal(new Set(data.bossMissions.map((boss) => boss.id)).size, data.bossMissions.length, '보스 ID는 중복되면 안 됩니다.');
assert.equal(new Set(data.presets.map((preset) => preset.id)).size, data.presets.length, '프리셋 ID는 중복되면 안 됩니다.');

const expectedPresetTotals = {
  'bronze-stable-v01': 5300,
  'silver-stable-v01': 10000,
  'gold-stable-v01': 15100,
  'platinum-stable-v01': 20200,
  'emerald-stable-v01': 30000,
  'sapphire-reference-v01': 40500
};

data.presets.forEach((preset) => {
  assert.equal(presetTotal(preset), expectedPresetTotals[preset.id], `${preset.name} 총점이 예상과 다릅니다.`);
});

console.log('데이터 검증 통과');
