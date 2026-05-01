const fields = {
  lucidLevel: document.getElementById('lucidLevel'),
  mastery: document.getElementById('mastery'),
  magicPower: document.getElementById('magicPower'),
  criticalRate: document.getElementById('criticalRate'),
  criticalDamage: document.getElementById('criticalDamage'),
  cooldownReduction: document.getElementById('cooldownReduction'),
};

const baseCpEl = document.getElementById('baseCp');
const finalCpEl = document.getElementById('finalCp');
const cooldownMultiplierEl = document.getElementById('cooldownMultiplier');
const noticeBox = document.getElementById('noticeBox');
const calculateButton = document.getElementById('calculateButton');
const resetButton = document.getElementById('resetButton');
const imageInput = document.getElementById('imageInput');
const previewBox = document.getElementById('previewBox');
const dropZone = document.getElementById('dropZone');

const cooldownLevelBreakpoints = [0, 1, 10, 20, 45];
const cooldownDamageTable = [
  [0, 49397696.46773333, 79807910.47733334, 94230321.81653333, 106206323.14986667],
  [0, 51494890.86622222, 81884467.96222222, 96294267.85422222, 108270269.18755555],
  [0, 53922452.26618803, 84288217.53880341, 98683465.76095727, 110659467.0942906],
  [0, 56762972.418, 87100957.22999999, 101479228.50400001, 113455229.83733334],
  [0, 60129076.43579798, 90434229.79434343, 104792437.40234342, 116768438.73567677],
  [0, 64178439.47937778, 94444195.09377778, 108778326.30257778, 120754327.6359111],
  [0, 66431275.62975438, 96674222.02385965, 110994414.26470175, 122970415.5980351],
  [0, 68940003.69807407, 99157606.51407407, 113462311.01274073, 125438312.34607407],
  [0, 71749781.08162092, 101939058.72209151, 116226453.39126797, 128202454.72460131],
  [0, 74917054.527, 105074466.345, 119342387.456, 131318388.78933334],
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

function getLevelColumnIndex(level) {
  let index = 0;
  for (let i = 0; i < cooldownLevelBreakpoints.length; i += 1) {
    if (level >= cooldownLevelBreakpoints[i]) index = i;
  }
  return index;
}

function getCorrectionMultiplier(lucidLevel, cooldownReduction) {
  const cooldownIndex = Math.max(0, Math.min(9, Math.trunc(cooldownReduction)));
  const levelColumnIndex = getLevelColumnIndex(lucidLevel);
  return cooldownDamageTable[cooldownIndex][levelColumnIndex] / cooldownReferenceDamage;
}

function validateInputs(values) {
  const errors = [];

  if (values.lucidLevel === null || values.lucidLevel < 0 || values.lucidLevel > 45) errors.push('루시드 레벨은 0~45 사이로 입력해 주세요.');
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
  const correctionMultiplier = getCorrectionMultiplier(values.lucidLevel, values.cooldownReduction);
  const finalCp = baseCp * correctionMultiplier;

  return { baseCp, correctionMultiplier, finalCp };
}

function updateNotice(type, messages) {
  if (type === 'error') {
    noticeBox.innerHTML = `<strong>확인 필요</strong><p>${messages.join('<br />')}</p>`;
    noticeBox.style.borderLeftColor = 'var(--warning)';
    return;
  }

  noticeBox.innerHTML = `
    <strong>계산 완료</strong>
    <p>기본 CP 공식은 기존 계산기와 동일하게 두고, 환산 보정은 업로드한 엑셀의 쿨감 시트 표를 기준으로 적용했습니다. 레벨 구간은 0 / 1 / 10 / 20 / 45 기준으로 매칭됩니다.</p>
  `;
  noticeBox.style.borderLeftColor = 'var(--pink)';
}

function handleCalculate() {
  const values = {
    lucidLevel: readNumber('lucidLevel'),
    mastery: readNumber('mastery'),
    magicPower: readNumber('magicPower'),
    criticalRate: readNumber('criticalRate'),
    criticalDamage: readNumber('criticalDamage'),
    cooldownReduction: readNumber('cooldownReduction'),
  };

  const errors = validateInputs(values);
  if (errors.length > 0) {
    baseCpEl.textContent = '-';
    cooldownMultiplierEl.textContent = '-';
    finalCpEl.textContent = '-';
    updateNotice('error', errors);
    return;
  }

  const result = calculateCp(values);
  baseCpEl.textContent = formatNumber(result.baseCp);
  cooldownMultiplierEl.textContent = `${formatNumber(result.correctionMultiplier, 3)}x`;
  finalCpEl.textContent = formatNumber(result.finalCp);
  updateNotice('success');
}

function resetForm() {
  Object.values(fields).forEach((input) => { input.value = ''; });
  baseCpEl.textContent = '-';
  cooldownMultiplierEl.textContent = '-';
  finalCpEl.textContent = '-';
  previewBox.innerHTML = '<p>아직 업로드된 이미지가 없습니다.</p>';
  imageInput.value = '';
  noticeBox.innerHTML = `
    <strong>계산식 메모</strong>
    <p>기본 CP는 기존 계산기 공식을 따르고, 레벨/쿨감 보정은 업로드한 엑셀의 쿨감 시트 표를 기준으로 계산합니다. 현재는 OCR을 붙이기 전 수동 입력 MVP입니다.</p>
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
