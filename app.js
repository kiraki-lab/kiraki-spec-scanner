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

function validateInputs(values) {
  const errors = [];

  if (values.lucidLevel === null || values.lucidLevel < 1 || values.lucidLevel > 300) errors.push('루시드 레벨은 1~300 사이로 입력해 주세요.');
  if (values.mastery === null || values.mastery < 0 || values.mastery > 100) errors.push('숙련도는 0~100% 사이로 입력해 주세요.');
  if (values.magicPower === null || values.magicPower < 0) errors.push('마력은 0 이상의 숫자로 입력해 주세요.');
  if (values.criticalRate === null || values.criticalRate < 0 || values.criticalRate > 100) errors.push('크리티컬 확률은 0~100% 사이로 입력해 주세요.');
  if (values.criticalDamage === null || values.criticalDamage < 0) errors.push('크리티컬 데미지는 0 이상의 숫자로 입력해 주세요.');
  if (values.cooldownReduction === null || values.cooldownReduction < 0 || values.cooldownReduction > 10) errors.push('재사용 대기시간 감소는 0~10초 사이로 입력해 주세요.');

  return errors;
}

function calculateCp(values) {
  // 기준 공식:
  // 기본 CP = 마력 × (45 + 숙련도% × 0.075) × {1 + 크확% × (크뎀% - 1)}
  // 입력된 퍼센트 값은 계산 전에 소수 배율로 변환합니다.
  const masteryFactor = 45 + values.mastery * 0.075;
  const critRateRatio = values.criticalRate / 100;
  const critDamageRatio = values.criticalDamage / 100;
  const criticalFactor = 1 + critRateRatio * (critDamageRatio - 1);
  const baseCp = values.magicPower * masteryFactor * criticalFactor;

  // TODO: 기존 계산기 기준표에 맞춰 쿨타임 감소 배율을 확정합니다.
  const cooldownMultiplier = 1 + values.cooldownReduction * 0.025;

  // TODO: 루시드 레벨 기준의 레벨 페널티를 확정합니다.
  const levelPenalty = 1;
  const finalCp = baseCp * levelPenalty * cooldownMultiplier;

  return { baseCp, cooldownMultiplier, finalCp };
}

function updateNotice(type, messages) {
  if (type === 'error') {
    noticeBox.innerHTML = `<strong>확인 필요</strong><p>${messages.join('<br />')}</p>`;
    noticeBox.style.borderLeftColor = 'var(--warning)';
    return;
  }

  noticeBox.innerHTML = `
    <strong>계산 완료</strong>
    <p>기본 CP는 마력 × (45 + 숙련도% × 0.075) × {1 + 크확% × (크뎀% - 1)} 기준으로 계산했습니다. 레벨 페널티와 쿨감 보정표는 다음 단계에서 기존 계산기 기준에 맞춰 고정하면 됩니다.</p>
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
  cooldownMultiplierEl.textContent = `${formatNumber(result.cooldownMultiplier, 3)}x`;
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
    <p>기본 CP는 마력 × (45 + 숙련도% × 0.075) × {1 + 크확% × (크뎀% - 1)} 기준입니다. 현재는 OCR을 붙이기 전 수동 입력 MVP입니다.</p>
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
