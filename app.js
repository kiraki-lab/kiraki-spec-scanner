const fields = {
  lucidLevel: document.getElementById('lucidLevel'),
  mastery: document.getElementById('mastery'),
  magicPower: document.getElementById('magicPower'),
  criticalRate: document.getElementById('criticalRate'),
  criticalDamage: document.getElementById('criticalDamage'),
  cooldownReduction: document.getElementById('cooldownReduction'),
};

const selectedBossNameEl = document.getElementById('selectedBossName');
const requiredCpEl = document.getElementById('requiredCp');
const finalCpEl = document.getElementById('finalCp');
const powerRatioEl = document.getElementById('powerRatio');
const noticeBox = document.getElementById('noticeBox');
const calculateButton = document.getElementById('calculateButton');
const resetButton = document.getElementById('resetButton');
const imageInput = document.getElementById('imageInput');
const previewBox = document.getElementById('previewBox');
const dropZone = document.getElementById('dropZone');
const ocrButton = document.getElementById('ocrButton');
const clearOcrButton = document.getElementById('clearOcrButton');
const ocrStatus = document.getElementById('ocrStatus');
const ocrRawText = document.getElementById('ocrRawText');

let currentImageFile = null;

const bosses = {
  chaosZakum: { name: '카오스 자쿰', requiredLevel: 10, minPower: 9000 },
  chaosVellum: { name: '카오스 벨룸', requiredLevel: 30, minPower: 80800 },
  hardLucid: { name: '하드 루시드', requiredLevel: 60, minPower: 355000 },
  normalHelena: { name: '🧚 노멀 헬레나', requiredLevel: 75, minPower: 576000 },
};

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

const fieldRules = {
  lucidLevel: { min: 1, max: 100, integer: true },
  mastery: { min: 0, max: 100, integer: false },
  magicPower: { min: 0, max: 999999999, integer: false },
  criticalRate: { min: 0, max: 1000, integer: false },
  criticalDamage: { min: 0, max: 1000, integer: false },
  cooldownReduction: { min: 0, max: 9, integer: true },
};

const fieldLabels = {
  lucidLevel: '루시드 레벨',
  mastery: '숙련도',
  magicPower: '마력',
  criticalRate: '크리티컬 확률',
  criticalDamage: '크리티컬 데미지',
  cooldownReduction: '재사용 대기시간 감소',
};

const lucidDreamRois = {
  lucidLevel: [
    { x: 0.110, y: 0.830, w: 0.220, h: 0.115, scale: 4 },
  ],
  magicPower: [
    { x: 0.390, y: 0.487, w: 0.116, h: 0.060, scale: 6 },
  ],
  mastery: [
    { x: 0.622, y: 0.451, w: 0.100, h: 0.060, scale: 6 },
  ],
  criticalRate: [
    { x: 0.622, y: 0.487, w: 0.105, h: 0.060, scale: 6 },
  ],
  criticalDamage: [
    { x: 0.862, y: 0.451, w: 0.105, h: 0.060, scale: 6 },
  ],
  cooldownReduction: [
    { x: 0.878, y: 0.487, w: 0.090, h: 0.062, scale: 8 },
    { x: 0.897, y: 0.487, w: 0.070, h: 0.062, scale: 10 },
    { x: 0.865, y: 0.480, w: 0.105, h: 0.075, scale: 8 },
  ],
};

function readNumber(id) {
  const raw = fields[id].value;
  if (raw === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function getSelectedBoss() {
  const checked = document.querySelector('input[name="bossKey"]:checked');
  return bosses[checked?.value] ?? bosses.chaosZakum;
}

function formatNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: digits }).format(value);
}

function formatRatio(value) {
  if (!Number.isFinite(value)) return '-';
  if (value >= 10) return `${formatNumber(value, 1)}배`;
  return `${formatNumber(value, 2)}배`;
}

function getCooldownMultiplier(cooldownReduction) {
  const cooldownIndex = Math.max(0, Math.min(9, Math.trunc(cooldownReduction)));
  return cooldownDamageBySeconds[cooldownIndex] / cooldownReferenceDamage;
}

function getLevelPenaltyMultiplier(lucidLevel, bossRequiredLevel) {
  const levelGap = Math.max(0, bossRequiredLevel - lucidLevel);
  const cycle = Math.floor(levelGap / 4);
  const remainder = levelGap % 4;
  const remainderPenaltyPattern = [0, 2, 5, 7];
  const penaltyPercent = cycle * 10 + remainderPenaltyPattern[remainder];
  return Math.max(0, (100 - penaltyPercent) / 100);
}

function validateFieldValue(fieldId, value) {
  const rule = fieldRules[fieldId];
  if (!rule || !Number.isFinite(value)) return false;
  if (value < rule.min || value > rule.max) return false;
  if (rule.integer && !Number.isInteger(value)) return false;
  return true;
}

function validateInputs(values) {
  const errors = [];
  if (!validateFieldValue('lucidLevel', values.lucidLevel)) errors.push('루시드 레벨은 1~100 사이로 입력해 주세요.');
  if (!validateFieldValue('mastery', values.mastery)) errors.push('숙련도는 0~100% 사이로 입력해 주세요.');
  if (!validateFieldValue('magicPower', values.magicPower)) errors.push('마력은 0 이상의 숫자로 입력해 주세요.');
  if (!validateFieldValue('criticalRate', values.criticalRate)) errors.push('크리티컬 확률은 0 이상의 숫자로 입력해 주세요.');
  if (!validateFieldValue('criticalDamage', values.criticalDamage)) errors.push('크리티컬 데미지는 0 이상의 숫자로 입력해 주세요.');
  if (!validateFieldValue('cooldownReduction', values.cooldownReduction)) errors.push('재사용 대기시간 감소는 0~9 사이의 정수로 입력해 주세요.');
  return errors;
}

function calculateCp(values, boss) {
  const masteryFactor = 45 + values.mastery * 0.075;
  const critRateRatio = values.criticalRate / 100;
  const critDamageRatio = values.criticalDamage / 100;
  const criticalFactor = 1 + critRateRatio * (critDamageRatio - 1);
  const baseCp = values.magicPower * masteryFactor * criticalFactor;
  const levelPenaltyMultiplier = getLevelPenaltyMultiplier(values.lucidLevel, boss.requiredLevel);
  const cooldownMultiplier = getCooldownMultiplier(values.cooldownReduction);
  const finalCp = baseCp * levelPenaltyMultiplier * cooldownMultiplier;
  const powerRatio = finalCp / boss.minPower;
  return { baseCp, levelPenaltyMultiplier, cooldownMultiplier, finalCp, powerRatio };
}

function updateNotice(type, messages, result, values, boss) {
  if (type === 'error') {
    noticeBox.innerHTML = `<strong>확인 필요</strong><p>${messages.join('<br />')}</p>`;
    noticeBox.style.borderLeftColor = 'var(--warning)';
    return;
  }

  const levelGap = Math.max(0, boss.requiredLevel - values.lucidLevel);
  const penaltyPercent = Math.round((1 - result.levelPenaltyMultiplier) * 100);
  const status = result.powerRatio >= 1 ? '최소 전투력 이상입니다.' : '최소 전투력보다 부족합니다.';
  noticeBox.innerHTML = `
    <strong>계산 완료</strong>
    <p>${boss.name} 기준 최소 전투력은 ${formatNumber(boss.minPower)}입니다. 루시드 레벨은 보스 요구 레벨보다 ${levelGap}레벨 부족으로 계산했고, 레벨 페널티는 -${penaltyPercent}%입니다. 쿨감 보정 ${formatNumber(result.cooldownMultiplier, 3)}배를 적용한 최종 CP는 ${formatNumber(result.finalCp)}이며, 최소 전투력 대비 ${formatRatio(result.powerRatio)}입니다. ${status}</p>
  `;
  noticeBox.style.borderLeftColor = result.powerRatio >= 1 ? 'var(--mint)' : 'var(--warning)';
}

function normalizeOcrText(text) {
  return String(text)
    .replace(/[，]/g, ',')
    .replace(/[％]/g, '%')
    .replace(/[：]/g, ':')
    .replace(/[|]/g, '1')
    .replace(/[Oo]/g, '0');
}

function parseNumberToken(token) {
  if (!token) return null;
  const normalized = normalizeOcrText(token);
  const match = normalized.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0].replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}

function extractNumbers(text) {
  return (normalizeOcrText(text).match(/\d[\d,]*(?:\.\d+)?/g) ?? [])
    .map(parseNumberToken)
    .filter((value) => value !== null);
}

function parseOcrValue(text, fieldId) {
  const normalized = normalizeOcrText(text).replace(/\s+/g, ' ').trim();

  if (fieldId === 'magicPower') {
    const compactValue = parseNumberToken(normalized.replace(/\s/g, ''));
    if (validateFieldValue(fieldId, compactValue)) return compactValue;
  }

  const numbers = extractNumbers(normalized);

  if (fieldId === 'lucidLevel') {
    const lvMatch = normalized.match(/(?:LV|Lv|lv|레벨|렙)\s*\.?\s*(\d{1,3})/);
    const lvValue = parseNumberToken(lvMatch?.[1]);
    if (validateFieldValue(fieldId, lvValue)) return lvValue;
  }

  if (fieldId === 'cooldownReduction') {
    return numbers
      .map((value) => Math.trunc(value))
      .find((value) => validateFieldValue(fieldId, value)) ?? null;
  }

  return numbers.find((value) => validateFieldValue(fieldId, value)) ?? null;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractCandidateAfterKeyword(text, keywords, options = {}) {
  const windowSize = options.windowSize ?? 70;
  const allowDecimal = options.allowDecimal ?? true;
  const escaped = keywords.map(escapeRegExp).join('|');
  const numberPattern = allowDecimal ? '([0-9][0-9,]*(?:\\.[0-9]+)?)' : '([0-9][0-9,]*)';
  const regex = new RegExp(`(?:${escaped})[\\s\\S]{0,${windowSize}}?${numberPattern}`, 'i');
  const match = normalizeOcrText(text).match(regex);
  return match ? parseNumberToken(match[1]) : null;
}

function inferFieldsFromFullText(rawText) {
  const text = normalizeOcrText(rawText);
  const inferred = {
    lucidLevel: extractCandidateAfterKeyword(text, ['루시드 레벨', 'Lucid Level', 'Lucid Lv', 'LV', 'Lv', '루시드렙'], { allowDecimal: false }),
    mastery: extractCandidateAfterKeyword(text, ['숙련도', 'Mastery'], { allowDecimal: true }),
    magicPower: extractCandidateAfterKeyword(text, ['마력', 'Magic Power', 'MATK', 'M.ATK'], { allowDecimal: false }),
    criticalRate: extractCandidateAfterKeyword(text, ['크리티컬 확률', '크확', 'Critical Rate', 'Crit Rate'], { allowDecimal: true }),
    criticalDamage: extractCandidateAfterKeyword(text, ['크리티컬 데미지', '크뎀', 'Critical Damage', 'Crit Damage'], { allowDecimal: true }),
    cooldownReduction: extractCandidateAfterKeyword(text, ['재사용 대기시간 감소', '재사용', '쿨감', 'Cooldown Reduction', 'Cooldown'], { allowDecimal: false, windowSize: 90 }),
  };

  Object.keys(inferred).forEach((fieldId) => {
    if (!validateFieldValue(fieldId, inferred[fieldId])) inferred[fieldId] = null;
  });
  return inferred;
}

function setOcrStatus(message, type = 'normal') {
  ocrStatus.textContent = message;
  ocrStatus.classList.remove('warning', 'error');
  if (type !== 'normal') ocrStatus.classList.add(type);
}

function markField(fieldId, status) {
  fields[fieldId].classList.remove('ocr-filled', 'ocr-review');
  if (status) fields[fieldId].classList.add(status);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러오지 못했습니다.'));
    };
    image.src = url;
  });
}

function createPreprocessedCropDataUrl(image, roi) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sx = Math.max(0, Math.round(roi.x * sourceWidth));
  const sy = Math.max(0, Math.round(roi.y * sourceHeight));
  const sw = Math.max(1, Math.round(roi.w * sourceWidth));
  const sh = Math.max(1, Math.round(roi.h * sourceHeight));
  const scale = roi.scale ?? 4;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const brightness = Math.max(r, g, b);
    const contrast = brightness - Math.min(r, g, b);
    const isTextLike = gray > 155 && contrast < 145;
    const value = isTextLike ? 0 : 255;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

async function createOcrWorker(language = 'eng', logger) {
  const worker = await Tesseract.createWorker(language, 1, { logger });
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789.,%LVlv ',
    preserve_interword_spaces: '1',
  });
  return worker;
}

async function recognizeRoiWithWorker(worker, image, fieldId, roi) {
  const dataUrl = createPreprocessedCropDataUrl(image, roi);
  const { data } = await worker.recognize(dataUrl);
  const raw = data.text || '';
  const value = parseOcrValue(raw, fieldId);
  return { raw, value: validateFieldValue(fieldId, value) ? value : null };
}

async function runFixedRegionOcr(image) {
  const results = {};
  const rawParts = [];
  const roiEntries = Object.entries(lucidDreamRois);
  const worker = await createOcrWorker('eng', (message) => {
    if (message.status === 'recognizing text') {
      setOcrStatus(`루시드 드림 화면 전용 OCR 중... ${Math.round((message.progress || 0) * 100)}%`);
    } else if (message.status) {
      setOcrStatus(`OCR 처리 중: ${message.status}`);
    }
  });

  try {
    for (let i = 0; i < roiEntries.length; i += 1) {
      const [fieldId, roiList] = roiEntries[i];
      setOcrStatus(`고정 영역 OCR 중... ${i + 1}/${roiEntries.length} (${fieldLabels[fieldId]})`);

      let selectedRaw = '';
      let selectedValue = null;
      for (const roi of roiList) {
        const { raw, value } = await recognizeRoiWithWorker(worker, image, fieldId, roi);
        selectedRaw += `${raw.trim() || '(인식 없음)'}\n`;
        if (validateFieldValue(fieldId, value)) {
          selectedValue = value;
          break;
        }
      }

      results[fieldId] = selectedValue;
      rawParts.push(`[${fieldLabels[fieldId]}]\n${selectedRaw.trim() || '(인식 없음)'}`);
    }
  } finally {
    await worker.terminate();
  }
  return { results, rawText: rawParts.join('\n\n') };
}

async function runFullTextOcrFallback(missingFieldIds) {
  if (missingFieldIds.length === 0) return { results: {}, rawText: '' };
  setOcrStatus('일부 값이 비어 있어 전체 OCR로 한 번 더 확인 중입니다...');
  const { data } = await Tesseract.recognize(currentImageFile, 'kor+eng', {
    logger: (message) => {
      if (message.status === 'recognizing text') setOcrStatus(`전체 OCR 재확인 중... ${Math.round((message.progress || 0) * 100)}%`);
    },
  });
  const inferred = inferFieldsFromFullText(data.text || '');
  const results = {};
  missingFieldIds.forEach((fieldId) => {
    if (validateFieldValue(fieldId, inferred[fieldId])) results[fieldId] = inferred[fieldId];
  });
  return { results, rawText: data.text || '' };
}

function applyOcrValues(inferred) {
  let filledCount = 0;
  const missing = [];
  const ocrTargets = ['lucidLevel', 'mastery', 'magicPower', 'criticalRate', 'criticalDamage', 'cooldownReduction'];

  ocrTargets.forEach((fieldId) => {
    const value = inferred[fieldId];
    if (validateFieldValue(fieldId, value)) {
      fields[fieldId].value = value;
      markField(fieldId, 'ocr-filled');
      filledCount += 1;
    } else {
      markField(fieldId, 'ocr-review');
      missing.push(fieldLabels[fieldId]);
    }
  });

  if (filledCount === 0) {
    setOcrStatus('값을 자동 인식하지 못했어요. OCR 원문을 보고 입력값을 수동으로 넣어주세요.', 'error');
    return;
  }

  if (missing.length > 0) {
    setOcrStatus(`${filledCount}개 값을 자동 입력했습니다. 확인 필요: ${missing.join(', ')}`, 'warning');
    return;
  }
  setOcrStatus('모든 값을 자동 입력했습니다. 그래도 한 번만 검수한 뒤 계산해 주세요.');
}

async function runOcr() {
  if (!currentImageFile) {
    setOcrStatus('먼저 스펙 캡처 이미지를 업로드하거나 붙여넣어 주세요.', 'warning');
    return;
  }
  if (!window.Tesseract) {
    setOcrStatus('OCR 라이브러리를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.', 'error');
    return;
  }

  ocrButton.disabled = true;
  clearOcrResult(false);
  setOcrStatus('루시드 드림 화면 전용 OCR을 준비 중입니다...');

  try {
    const image = await loadImageFromFile(currentImageFile);
    const fixedResult = await runFixedRegionOcr(image);
    const inferred = { ...fixedResult.results };
    const missingAfterFixed = ['lucidLevel', 'mastery', 'magicPower', 'criticalRate', 'criticalDamage', 'cooldownReduction']
      .filter((fieldId) => !validateFieldValue(fieldId, inferred[fieldId]));

    let fallbackRawText = '';
    if (missingAfterFixed.length > 0) {
      const fallbackResult = await runFullTextOcrFallback(missingAfterFixed);
      Object.assign(inferred, fallbackResult.results);
      fallbackRawText = fallbackResult.rawText;
    }

    ocrRawText.textContent = [fixedResult.rawText, fallbackRawText ? `[전체 OCR 원문]\n${fallbackRawText}` : '']
      .filter(Boolean)
      .join('\n\n---\n\n') || '인식된 텍스트가 없습니다.';
    applyOcrValues(inferred);
  } catch (error) {
    console.error(error);
    setOcrStatus('OCR 처리 중 오류가 발생했어요. 이미지가 너무 작거나 브라우저가 OCR 파일을 막았을 수 있습니다.', 'error');
  } finally {
    ocrButton.disabled = false;
  }
}

function clearOcrResult(updateMessage = true) {
  ocrRawText.textContent = '아직 인식된 텍스트가 없습니다.';
  Object.keys(fields).forEach((fieldId) => markField(fieldId, null));
  if (updateMessage) setOcrStatus('OCR 결과를 지웠습니다. 이미지는 유지됩니다.');
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
  const boss = getSelectedBoss();

  const errors = validateInputs(values);
  if (errors.length > 0) {
    selectedBossNameEl.textContent = '-';
    requiredCpEl.textContent = '-';
    finalCpEl.textContent = '-';
    powerRatioEl.textContent = '-';
    updateNotice('error', errors);
    return;
  }

  const result = calculateCp(values, boss);
  selectedBossNameEl.textContent = boss.name;
  requiredCpEl.textContent = formatNumber(boss.minPower);
  finalCpEl.textContent = formatNumber(result.finalCp);
  powerRatioEl.textContent = formatRatio(result.powerRatio);
  updateNotice('success', [], result, values, boss);
}

function resetForm() {
  Object.values(fields).forEach((input) => { input.value = ''; });
  document.querySelector('input[name="bossKey"][value="chaosZakum"]').checked = true;
  selectedBossNameEl.textContent = '-';
  requiredCpEl.textContent = '-';
  finalCpEl.textContent = '-';
  powerRatioEl.textContent = '-';
  previewBox.innerHTML = '<p>아직 업로드된 이미지가 없습니다.</p>';
  imageInput.value = '';
  currentImageFile = null;
  clearOcrResult(false);
  setOcrStatus('이미지를 올린 뒤 OCR 버튼을 눌러주세요.');
  noticeBox.innerHTML = `
    <strong>계산식 메모</strong>
    <p>기본 CP는 기존 계산기 공식을 따르고, 보스 요구 레벨에 따른 레벨 페널티와 쿨감 보정 배율을 적용한 뒤 최소 전투력 대비 배율을 계산합니다.</p>
  `;
  noticeBox.style.borderLeftColor = 'var(--pink)';
}

function previewImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  currentImageFile = file;
  const reader = new FileReader();
  reader.onload = (event) => {
    previewBox.innerHTML = `<img src="${event.target.result}" alt="업로드한 스펙 캡처 미리보기" />`;
  };
  reader.readAsDataURL(file);
  setOcrStatus('이미지를 불러왔습니다. 루시드 드림 전체 화면이면 전용 OCR로 값을 읽습니다. 보스는 오른쪽에서 선택해 주세요.');
}

calculateButton.addEventListener('click', handleCalculate);
resetButton.addEventListener('click', resetForm);
ocrButton.addEventListener('click', runOcr);
clearOcrButton.addEventListener('click', () => clearOcrResult(true));

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

document.querySelectorAll('input[name="bossKey"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    if (finalCpEl.textContent !== '-') handleCalculate();
  });
});
