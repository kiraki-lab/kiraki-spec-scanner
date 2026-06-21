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

data.stages.forEach((stage) => {
  const total = Object.values(stage.probabilities).reduce((sum, probability) => sum + probability, 0);
  assert.ok(Math.abs(total - 100) < 0.000001, `${stage.name} 확률 합계가 100%가 아닙니다.`);
});

assert.equal(data.stages[3].probabilities.normal, 0);
assert.equal(data.stages[4].probabilities.rare, 0);
assert.equal(data.stages[4].probabilities.legendary, 1.05);

console.log('mystery barrier data tests passed');
