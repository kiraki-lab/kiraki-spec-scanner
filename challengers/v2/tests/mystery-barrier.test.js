const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('challengers/v2/mystery-barrier-data.js', 'utf8'), context);

const data = context.window.MYSTERY_BARRIER_DATA;
assert.equal(data.stages.length, 5);
assert.deepEqual(data.stages.map((stage) => stage.minPoints), [0, 15000, 30000, 40000, 50000]);
assert.deepEqual(data.stages.map((stage) => stage.condition), ['골드 미만', '골드 이상', '에메랄드 이상', '사파이어 이상', '다이아몬드 이상']);
assert.deepEqual(data.stages.map((stage) => stage.recommendation.gradeId), ['rare', 'epic', 'epic', 'unique', 'unique']);
assert.equal(data.stages[3].recommendation.label, '유니크 이상');
assert.equal(data.stages[4].recommendation.label, '유니크~레전드리');

const rarityIds = data.rarities.map((rarity) => rarity.id);
const cumulativeChance = (stage, rarityId) => {
  const start = rarityIds.indexOf(rarityId);
  return rarityIds.slice(start).reduce((sum, id) => sum + stage.probabilities[id], 0);
};

data.stages.forEach((stage) => {
  const total = Object.values(stage.probabilities).reduce((sum, probability) => sum + probability, 0);
  assert.ok(Math.abs(total - 100) < 0.000001, `${stage.name} 확률 합계가 100%가 아닙니다.`);
  assert.ok(stage.appliesTo.length > 0, `${stage.name} 적용 티어 문구가 없습니다.`);
  assert.ok(rarityIds.includes(stage.recommendation.gradeId), `${stage.name} 추천 등급이 잘못되었습니다.`);
  assert.ok(rarityIds.includes(stage.recommendation.stretchGradeId), `${stage.name} 상향 등급이 잘못되었습니다.`);
  assert.ok(stage.recommendation.note.length > 0, `${stage.name} 추천 설명이 없습니다.`);
});

assert.equal(data.stages[3].probabilities.normal, 0);
assert.equal(data.stages[4].probabilities.rare, 0);
assert.equal(data.stages[4].probabilities.legendary, 1.05);
assert.ok(Math.abs(cumulativeChance(data.stages[0], 'rare') - 32.51) < 0.000001);
assert.ok(Math.abs(cumulativeChance(data.stages[1], 'epic') - 16) < 0.000001);
assert.ok(Math.abs(cumulativeChance(data.stages[2], 'epic') - 20.1) < 0.000001);
assert.ok(Math.abs(cumulativeChance(data.stages[3], 'unique') - 7.17) < 0.000001);
assert.ok(Math.abs(cumulativeChance(data.stages[4], 'unique') - 8.15) < 0.000001);

console.log('mystery barrier data tests passed');
