const fields = {
  lucidLevel: document.getElementById('lucidLevel'),
  bossLevel: document.getElementById('bossLevel'),
  mastery: document.getElementById('mastery'),
  magicPower: document.getElementById('magicPower'),
  criticalRate: document.getElementById('criticalRate'),
  criticalDamage: document.getElementById('criticalDamage'),
  cooldownReduction: document.getElementById('cooldownReduction'),
};

const baseCpEl = document.getElementById('baseCp');
const finalCpEl = document.getElementById('finalCp');
const cooldownMultiplierEl = document.getElementById('cooldownMultiplier');
const levelPenaltyEl = document.getElementById('levelPenalty');
const noticeBox = document.getElementById('noticeBox');
const calculateButton = document.getElementById('calculateButton');
const resetButton = document.getElementById('resetButton');
const imageInput = document.getElementById('imageInput');
const previewBox = document.getElementById('previewBox');
const dropZone = document.getElementById('dropZone');

const cooldownDamageBySeconds = [
  106206323.14986667,
  108270269.18755555,
  110659467.0942906,
  113455229.83733334,
  116768438.73567677,
  120754327.6359111,
  122970415.5980351,
  125438312.34607407,
  128202454.72460131,
  131318388.78933334,
];
const cooldownReferenceDamage = 106206323.14986667;

function readNumber(id) {
  const raw = fields[id].value;
  if (raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function formatNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: digits }).format(value);
}

function formatPercent(value, digits = 0) {
  if (!Number.isFinite(value)) return '-';
  return `${formatNumber(value * 100, digits)}%`;
}

function getCooldownMultiplier(cooldownReduction) {
  const cooldownIndex = Math.max(0, Math.min(9, Math.trunc(cooldownReduction)));
  return cooldownDamageBySeconds[cooldownIndex] / cooldownReferenceDamage;
}

function getLevelPenaltyMultiplier(lucidLevel, bossLevel) {
  const levelGap = Math.max(0, bossLevel - lucidLevel);
  const cycle = Math.floor(levelGap / 4);
  const remainder = levelGap % 4;
  const remainderPenaltyPattern = [0, 2, 5, 7];
  const penaltyPercent = cycle * 10 + remainderPenaltyPattern[remainder];
  return Math.max(0, (100 - penaltyPercent) / 100);
}

function validateInputs(values) {
  const errors = [];

  if (values.lucidLevel === null || values.lucidLevel < 1 || values.lucidLevel > 100) errors.push('루시드 레벨은 1~100 사이로 입력해 주세요.');
  if (values.bossLevel === null || values.bossLevel < 1 || values.bossLevel > 100) errors.push('상대 보스 레벨은 1~100 사이로 입력해 주세요.');
  if (values.mastery === null || values.mastery < 0 || values.mastery > 100) errors.push('숙련도는 0~100% 사이로 입력해 주세요.');
  if (values.magicPower === null || values.magicPower < 0) errors.push('마력은 0 이상의 숫자로 입력해 주세요.');
  if (values.criticalRate === null || values.criticalRate < 0 || values.criticalRate > 100) errors.push('크리티컬 확률은 0~100% 사이로 입력해 주세요.');
  if (values.criticalDamage === null || values.criticalDamage < 0) errors.push('크리티컬 데미지는 0 이상의 숫자로 입력해 주세요.');
  if (values.cooldownReduction === null || values.cooldownReduction < 0 || values.cooldownReduction > 9 || !Number.isInteger(values.cooldownReduction)) errors.push('재사용 대기시간 감소는 0~9 사이의 정수로 입력해 주세요.');

  return errors;
}

function calculateCp(values) {
  const masteryFactor = 45 + values.mastery * 0.075;
  const critRateRatio = values.criticalRate / 100;
  const critDamageRatio = values.criticalDamage / 100;
  const criticalFactor = 1 + critRateRatio * (critDamageRatio - 1);
  const baseCp = values.magicPower * masteryFactor * criticalFactor;
  const levelPenaltyMultiplier = getLevelPenaltyMultiplier(values.lucidLevel, values.bossLevel);
  const cooldownMultiplier = getCooldownMultiplier(values.cooldownReduction);
  const finalCp = baseCp * levelPenaltyMultiplier * cooldownMultiplier;

  return { baseCp, levelPenaltyMultiplier, cooldownMultiplier, finalCp };
}

function updateNotice(type, messages, result, values) {
  if (type === 'error') {
    noticeBox.innerHTML = `<strong>확인 필요</strong><p>${messages.join('<br />')}</p>`;
    noticeBox.style.borderLeftColor = 'var(--warning)';
    return;
  }

  const levelGap = Math.max(0, values.bossLevel - values.lucidLevel);
  const penaltyPercent = Math.round((1 - result.levelPenaltyMultiplier) * 100);
  noticeBox.innerHTML = `
    <strong>계산 완료</strong>
    <p>레벨 차이는 ${levelGap}레벨 부족으로 계산했으며, 레벨 페널티는 -${penaltyPercent}%입니다. 기본 CP에 레벨 페널티와 엑셀 기준 쿨감 보정 배율을 곱해 최종 CP를 계산했습니다.</p>
  `;
  noticeBox.style.borderLeftColor = 'var(--pink)';
}

function handleCalculate() {
  const values = {
    lucidLevel: readNumber('lucidLevel'),
    bossLevel: readNumber('bossLevel'),
    mastery: readNumber('mastery'),
    magicPower: readNumber('magicPower'),
    criticalRate: readNumber('criticalRate'),
    criticalDamage: readNumber('criticalDamage'),
    cooldownReduction: readNumber('cooldownReduction'),
  };

  const errors = validateInputs(values);
  if (errors.length > 0) {
    baseCpEl.textContent = '-';
    levelPenaltyEl.textContent = '-';
    cooldownMultiplierEl.textContent = '-';
    finalCpEl.textContent = '-';
    updateNotice('error', errors);
    return;
  }

  const result = calculateCp(values);
  baseCpEl.textContent = formatNumber(result.baseCp);
  levelPenaltyEl.textContent = formatPercent(result.levelPenaltyMultiplier);
  cooldownMultiplierEl.textContent = `${formatNumber(result.cooldownMultiplier, 3)}x`;
  finalCpEl.textContent = formatNumber(result.finalCp);
  updateNotice('success', [], result, values);
}

function resetForm() {
  Object.values(fields).forEach((input) => { input.value = ''; });
  baseCpEl.textContent = '-';
  levelPenaltyEl.textContent = '-';
  cooldownMultiplierEl.textContent = '-';
  finalCpEl.textContent = '-';
  previewBox.innerHTML = '<p>아직 업로드된 이미지가 없습니다.</p>';
  imageInput.value = '';
  noticeBox.innerHTML = `
    <strong>계산식 메모</strong>
    <p>기본 CP는 기존 계산기 공식을 따르고, 최종 CP는 보스 레벨 대비 루시드 레벨 페널티와 쿨감 보정 배율을 함께 적용합니다. 현재는 OCR을 붙이기 전 수동 입력 MVP입니다.</p>
  `;
  noticeBox.style.borderLeftColor = 'var(--pink)';
}

function previewImage(file) {
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    previewBox.innerHTML = `<img src="${event.target.result}" alt="업로드한 스펙 캡처 미리보기" />`;
  };
  reader.readAsDataURL(file);
}

calculateButton.addEventListener('click', handleCalculate);
resetButton.addEventListener('click', resetForm);

imageInput.addEventListener('change', (event) => previewImage(event.target.files[0]));

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
  previewImage(event.dataTransfer.files[0]);
});

document.addEventListener('paste', (event) => {
  const items = Array.from(event.clipboardData?.items ?? []);
  const imageItem = items.find((item) => item.type.startsWith('image/'));
  if (!imageItem) return;
  previewImage(imageItem.getAsFile());
});

Object.values(fields).forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCalculate();
    }
  });
});
