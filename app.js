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
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: digits,
  }).format(value);
}

function validateInputs(values) {
  const errors = [];

  if (values.lucidLevel === null || values.lucidLevel < 1 || values.lucidLevel > 300) {
    errors.push('루시드 레벨은 1~300 사이로 입력해 주세요.');
  }
  if (values.mastery === null || values.mastery < 0 || values.mastery > 100) {
    errors.push('숙련도는 0~100% 사이로 입력해 주세요.');
  }
  if (values.magicPower === null || values.magicPower < 0) {
    errors.push('마력은 0 이상의 숫자로 입력해 주세요.');
  }
  if (values.criticalRate === null || values.criticalRate < 0 || values.criticalRate > 100) {
    errors.push('크리티컬 확률은 0~100% 사이로 입력해 주세요.');
  }
  if (values.criticalDamage === null || values.criticalDamage < 0) {
    errors.push('크리티컬 데미지는 0 이상의 숫자로 입력해 주세요.');
  }
  if (values.cooldownReduction === null || values.cooldownReduction < 0 || values.cooldownReduction > 10) {
    errors.push('재사용 대기시간 감소는 0~10초 사이로 입력해 주세요.');
  }

  return errors;
}

function calculateCp(values) {
  // MVP formula based on the visible reference calculator note:
  // baseCp = magicPower * (45 + mastery * 0.075) * (1 + critRate * (critDamage - 1))
  // Here percentage inputs are converted to ratios before calculation.
  const masteryFactor = 45 + values.mastery * 0.075;
  const critRateRatio = values.criticalRate / 100;
  const critDamageRatio = values.criticalDamage / 100;
  const baseCp = values.magicPower * masteryFactor * (1 + critRateRatio * critDamageRatio);

  // Temporary cooldown correction. Needs verification against actual MapleStory Lucid content.
  const cooldownMultiplier = 1 + values.cooldownReduction * 0.025;

  // Temporary level penalty placeholder. In MVP, level is validated but not applied.
  const levelPenalty = 1;
  const finalCp = baseCp * cooldownMultiplier * levelPenalty;

  return {
    baseCp,
    cooldownMultiplier,
    finalCp,
  };
}

function updateNotice(type, messages) {
  if (type === 'error') {
    noticeBox.innerHTML = `
      <strong>확인 필요</strong>
      <p>${messages.join('<br />')}</p>
    `;
    noticeBox.style.borderLeftColor = 'var(--warning)';
    return;
  }

  noticeBox.innerHTML = `
    <strong>계산 완료</strong>
    <p>현재 결과는 MVP 계산식 기준입니다. 공식 검증 후 레벨 페널티와 쿨감 보정값을 더 정밀하게 조정하면 됩니다.</p>
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
  Object.values(fields).forEach((input) => {
    input.value = '';
  });
  baseCpEl.textContent = '-';
  cooldownMultiplierEl.textContent = '-';
  finalCpEl.textContent = '-';
  previewBox.innerHTML = '<p>아직 업로드된 이미지가 없습니다.</p>';
  imageInput.value = '';
  noticeBox.innerHTML = `
    <strong>계산식 메모</strong>
    <p>현재 공식은 화면에서 보이는 수식을 바탕으로 만든 MVP용입니다. 실제 기준이 확정되면 레벨 페널티와 쿨감 보정값을 더 정확하게 조정하면 됩니다.</p>
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

imageInput.addEventListener('change', (event) => {
  previewImage(event.target.files[0]);
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('dragging');
  const file = event.dataTransfer.files[0];
  previewImage(file);
});

document.addEventListener('paste', (event) => {
  const items = Array.from(event.clipboardData?.items ?? []);
  const imageItem = items.find((item) => item.type.startsWith('image/'));
  if (!imageItem) return;

  const file = imageItem.getAsFile();
  previewImage(file);
});

Object.values(fields).forEach((input) => {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCalculate();
    }
  });
});
