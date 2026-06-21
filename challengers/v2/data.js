(function () {
  const levelMissions = [];
  for (let level = 260; level <= 290; level += 1) {
    let points = 0;
    if (level === 260) points = 3000;
    else if (level <= 269) points = 300;
    else if (level <= 274) points = 700;
    else if (level <= 279) points = 1000;
    else if (level <= 284) points = 1500;
    else if (level <= 289) points = 2000;
    else points = 5000;
    levelMissions.push({ level, points });
  }

  const bossMissions = [
    { id: 'zakum-chaos', boss: '자쿰', difficulty: '카오스', points: 100, series: 'zakum', rank: 1 },
    { id: 'pierre-chaos', boss: '피에르', difficulty: '카오스', points: 200, series: 'pierre', rank: 1 },
    { id: 'vonbon-chaos', boss: '반반', difficulty: '카오스', points: 200, series: 'vonbon', rank: 1 },
    { id: 'bloodyqueen-chaos', boss: '블러디 퀸', shortBoss: '블퀸', difficulty: '카오스', points: 200, series: 'bloodyqueen', rank: 1 },
    { id: 'magnus-hard', boss: '매그너스', difficulty: '하드', points: 250, series: 'magnus', rank: 1 },
    { id: 'vellum-chaos', boss: '벨룸', difficulty: '카오스', points: 250, series: 'vellum', rank: 1 },
    { id: 'papulatus-chaos', boss: '파풀라투스', difficulty: '카오스', points: 300, series: 'papulatus', rank: 1 },
    { id: 'lotus-normal', boss: '스우', difficulty: '노멀', points: 400, series: 'lotus', rank: 1 },
    { id: 'damien-normal', boss: '데미안', difficulty: '노멀', points: 400, series: 'damien', rank: 1 },
    { id: 'guardian-angel-slime-normal', boss: '가디언 엔젤 슬라임', shortBoss: '가엔슬', difficulty: '노멀', points: 500, series: 'guardian-angel-slime', rank: 1 },
    { id: 'lucid-easy', boss: '루시드', difficulty: '이지', points: 500, series: 'lucid', rank: 1 },
    { id: 'will-easy', boss: '윌', difficulty: '이지', points: 500, series: 'will', rank: 1 },
    { id: 'kai-normal', boss: '카이', difficulty: '노멀', points: 1000, series: 'kai', rank: 1 },
    { id: 'lucid-normal', boss: '루시드', difficulty: '노멀', points: 1000, series: 'lucid', rank: 2 },
    { id: 'will-normal', boss: '윌', difficulty: '노멀', points: 1000, series: 'will', rank: 2 },
    { id: 'dusk-normal', boss: '더스크', difficulty: '노멀', points: 1000, series: 'dusk', rank: 1 },
    { id: 'gloom-normal', boss: '듄켈', difficulty: '노멀', points: 1000, series: 'gloom', rank: 1 },
    { id: 'lotus-hard', boss: '스우', difficulty: '하드', points: 1500, series: 'lotus', rank: 2 },
    { id: 'damien-hard', boss: '데미안', difficulty: '하드', points: 1500, series: 'damien', rank: 2 },
    { id: 'lucid-hard', boss: '루시드', difficulty: '하드', points: 2000, series: 'lucid', rank: 3 },
    { id: 'verus-hilla-normal', boss: '진 힐라', difficulty: '노멀', points: 2000, series: 'verus-hilla', rank: 1 },
    { id: 'will-hard', boss: '윌', difficulty: '하드', points: 2500, series: 'will', rank: 3 },
    { id: 'guardian-angel-slime-chaos', boss: '가디언 엔젤 슬라임', shortBoss: '가엔슬', difficulty: '카오스', points: 2500, series: 'guardian-angel-slime', rank: 2 },
    { id: 'dusk-chaos', boss: '더스크', difficulty: '카오스', points: 2500, series: 'dusk', rank: 2 },
    { id: 'verus-hilla-hard', boss: '진 힐라', difficulty: '하드', points: 3000, series: 'verus-hilla', rank: 2 },
    { id: 'gloom-hard', boss: '듄켈', difficulty: '하드', points: 3000, series: 'gloom', rank: 2 },
    { id: 'mayrin-normal', boss: '메이린', difficulty: '노멀', points: 5000, series: 'mayrin', rank: 1 },
    { id: 'black-mage-hard', boss: '검은 마법사', difficulty: '하드', points: 6000, series: 'black-mage', rank: 1 },
    { id: 'seren-normal', boss: '선택받은 세렌', shortBoss: '세렌', difficulty: '노멀', points: 6000, series: 'seren', rank: 1 },
    { id: 'adversary-easy', boss: '최초의 대적자', shortBoss: '대적자', difficulty: '이지', points: 7000, series: 'adversary', rank: 1 },
    { id: 'kalos-easy', boss: '감시자 칼로스', shortBoss: '칼로스', difficulty: '이지', points: 7000, series: 'kalos', rank: 1 },
    { id: 'seren-hard', boss: '선택받은 세렌', shortBoss: '세렌', difficulty: '하드', points: 7000, series: 'seren', rank: 2 },
    { id: 'kaling-easy', boss: '카링', difficulty: '이지', points: 9000, series: 'kaling', rank: 1 },
    { id: 'adversary-normal', boss: '최초의 대적자', shortBoss: '대적자', difficulty: '노멀', points: 9000, series: 'adversary', rank: 2 },
    { id: 'kalos-normal', boss: '감시자 칼로스', shortBoss: '칼로스', difficulty: '노멀', points: 9000, series: 'kalos', rank: 2 },
    { id: 'mayrin-hard', boss: '메이린', difficulty: '하드', points: 9000, series: 'mayrin', rank: 2 }
  ];

  const tiers = [
    { id: 'bronze', name: '브론즈', threshold: 5000 },
    { id: 'silver', name: '실버', threshold: 10000 },
    { id: 'gold', name: '골드', threshold: 15000 },
    { id: 'platinum', name: '플래티넘', threshold: 20000 },
    { id: 'emerald', name: '에메랄드', threshold: 30000 },
    { id: 'sapphire', name: '사파이어', threshold: 40000 },
    { id: 'diamond', name: '다이아몬드', threshold: 50000 },
    { id: 'master', name: '마스터', threshold: 70000 },
    { id: 'challenger', name: '챌린저', threshold: 90000 }
  ];

  const buildTypes = [
    { id: 'hunting', name: '사냥 빌드', description: '레벨을 상대적으로 더 올려 보스 부담을 줄이는 빌드' },
    { id: 'boss', name: '보스 빌드', description: '레벨을 낮게 잡고 보스 미션 비중을 높이는 빌드' }
  ];

  const idsAtOrBelow = (points, excludedIds = []) => {
    const excluded = new Set(excludedIds);
    return bossMissions
      .filter((boss) => boss.points <= points && !excluded.has(boss.id))
      .map((boss) => boss.id);
  };

  const idsAtOrBelowExceptSeries = (points, excludedSeries = []) => {
    const excluded = new Set(excludedSeries);
    return bossMissions
      .filter((boss) => boss.points <= points && !excluded.has(boss.series))
      .map((boss) => boss.id);
  };

  const fortyKBase = idsAtOrBelowExceptSeries(3000, ['will', 'verus-hilla']);
  const fiftyKBase = idsAtOrBelow(3000);

  const presets = [
    { id: 'bronze-stable-v01', name: '브론즈 보스 빌드', type: 'boss', tierId: 'bronze', level: 260, includeAtOrBelow: 400, extraBossIds: [], status: 'draft', summary: 'Lv.260 + 400점 이하 보스 미션 전체', note: '레벨을 최소로 두고 낮은 점수 보스로 브론즈를 맞추는 구성입니다.' },
    { id: 'silver-stable-v01', name: '실버 보스 빌드', type: 'boss', tierId: 'silver', level: 264, includeAtOrBelow: 500, extraBossIds: ['lucid-normal', 'will-normal'], status: 'draft', summary: 'Lv.264 + 500점 이하 전체 + 1,000점 보스 2종', note: '1,000점 보스 2종은 같은 점수의 다른 보스로 교체할 수 있습니다.' },
    { id: 'gold-stable-v01', name: '골드 보스 빌드', type: 'boss', tierId: 'gold', level: 266, includeAtOrBelow: 1000, extraBossIds: ['lotus-hard'], status: 'draft', summary: 'Lv.266 + 1,000점 이하 전체 + 1,500점 보스 1종', note: '1,500점 슬롯은 하드 스우와 하드 데미안 중 교체 가능합니다.' },
    { id: 'platinum-stable-v01', name: '플래티넘 보스 빌드', type: 'boss', tierId: 'platinum', level: 270, includeAtOrBelow: 1500, extraBossIds: ['lucid-hard'], status: 'draft', summary: 'Lv.270 + 1,500점 이하 전체 + 2,000점 보스 1종', note: '2,000점 슬롯은 같은 점수 보스로 교체할 수 있습니다.' },

    { id: 'emerald-stable-v01', name: '에메랄드 보스 빌드', type: 'boss', tierId: 'emerald', level: 274, includeAtOrBelow: 2000, extraBossIds: ['will-hard', 'guardian-angel-slime-chaos'], status: 'draft', summary: 'Lv.274 + 2,000점 이하 전체 + 2,500점 보스 2종', note: '2,500점 보스 3종 가운데 가능한 2종으로 교체할 수 있습니다.' },
    { id: 'emerald-video-30k-v01', name: '3만점 사냥 빌드 (제외: 진 힐라)', type: 'hunting', tierId: 'emerald', level: 280, bossIds: [...idsAtOrBelow(1000), 'lotus-hard', 'damien-hard', 'dusk-chaos'], status: 'reference', summary: 'Lv.280 + 포함: 하드 스우·하드 데미안·카오스 더스크 (제외: 노멀/하드 진 힐라)', note: '포함 보스는 하드 스우·하드 데미안·카오스 더스크입니다. 진 힐라는 노멀·하드 모두 제외하고, 나머지는 노멀 구간 위주로 채우는 30,000점 루트입니다.' },

    { id: 'sapphire-reference-v01', name: '사파이어 보스 빌드 (진 힐라 포함)', type: 'boss', tierId: 'sapphire', level: 276, includeAtOrBelow: 3000, extraBossIds: [], status: 'reference', summary: 'Lv.276 + 3,000점 이하 전체 (노멀/하드 진 힐라 포함)', note: '이 루트는 진 힐라를 제외하지 않는 전체 완료형입니다. 진 힐라를 빼고 가려면 Lv.280 하드 윌형 또는 Lv.282 노멀 윌형을 보세요.' },
    { id: 'sapphire-video-40k-no-hilla-v01', name: '4만점 Lv.280 하드 윌형 (제외: 진 힐라)', type: 'hunting', tierId: 'sapphire', level: 280, bossIds: [...fortyKBase, 'will-hard'], status: 'reference', summary: 'Lv.280 + 포함: 하드 윌 (제외: 노멀/하드 진 힐라)', note: '포함 보스는 하드 윌입니다. 진 힐라는 노멀·하드 모두 제외하고, 3,000점 이하 나머지 보스는 완료 기준입니다. 총 40,000점.' },
    { id: 'sapphire-video-40k-normal-will-hilla-v01', name: '4만점 Lv.281 노멀 윌·노멀 진 힐라형 (진 힐라 포함)', type: 'hunting', tierId: 'sapphire', level: 281, bossIds: [...fortyKBase, 'will-normal', 'verus-hilla-normal'], status: 'reference', summary: 'Lv.281 + 포함: 노멀 윌, 노멀 진 힐라 (하드 윌 제외)', note: '하드 윌은 제외하고 노멀 윌 + 노멀 진 힐라로 보완하는 루트입니다. 이 빌드는 진 힐라 제외가 아니라 노멀 진 힐라 포함입니다. 총 41,000점.' },
    { id: 'sapphire-video-40k-normal-will-no-hilla-v01', name: '4만점 Lv.282 노멀 윌형 (제외: 진 힐라)', type: 'hunting', tierId: 'sapphire', level: 282, bossIds: [...fortyKBase, 'will-normal'], status: 'reference', summary: 'Lv.282 + 포함: 노멀 윌 (제외: 노멀/하드 진 힐라)', note: '포함 보스는 노멀 윌입니다. 진 힐라는 노멀·하드 모두 제외하고, 3,000점 이하 나머지 보스는 완료 기준입니다. 총 40,500점.' },

    { id: 'diamond-video-50k-mayrin-v01', name: '5만점 노멀 메이린형', type: 'hunting', tierId: 'diamond', level: 280, bossIds: [...fiftyKBase, 'mayrin-normal'], status: 'reference', summary: 'Lv.280 + 3,000점 이하 전체 + 노멀 메이린', note: '마지막 보스 택1 구성. 총 50,000점.' },
    { id: 'diamond-video-50k-black-mage-v01', name: '5만점 하드 검은 마법사형', type: 'hunting', tierId: 'diamond', level: 280, bossIds: [...fiftyKBase, 'black-mage-hard'], status: 'reference', summary: 'Lv.280 + 3,000점 이하 전체 + 하드 검은 마법사', note: '마지막 보스 택1 구성. 총 51,000점.' },
    { id: 'diamond-video-50k-seren-v01', name: '5만점 노멀 세렌형', type: 'hunting', tierId: 'diamond', level: 280, bossIds: [...fiftyKBase, 'seren-normal'], status: 'reference', summary: 'Lv.280 + 3,000점 이하 전체 + 노멀 세렌', note: '마지막 보스 택1 구성. 총 51,000점.' },

    { id: 'master-video-adversary-v01', name: '마스터 이지 대적자형', type: 'boss', tierId: 'master', level: 280, bossIds: [...idsAtOrBelow(3000), 'mayrin-normal', 'black-mage-hard', 'adversary-easy', 'kalos-easy'], status: 'reference', summary: 'Lv.280 + 이지 대적자 + 7,000점 동점 슬롯 1종', note: '노멀 메이린·검은 마법사와 3,000점 이하 전체. 이지 칼로스는 하드 세렌으로 교체 가능. 총 70,000점.' },
    { id: 'master-video-kalos-v01', name: '마스터 Lv.281 사냥형', type: 'hunting', tierId: 'master', level: 281, bossIds: [...idsAtOrBelow(3000), 'mayrin-normal', 'black-mage-hard', 'seren-normal', 'kalos-easy'], status: 'reference', summary: 'Lv.281 + 검은 마법사 + 노멀 세렌 + 이지 칼로스 + 노멀 메이린', note: '3,000점 이하 미션 전체 포함. 총 70,500점.' },

    { id: 'challenger-video-hard-mayrin-v01', name: '슈퍼 챌린저 사냥 빌드', type: 'hunting', tierId: 'challenger', level: 284, bossIds: [...idsAtOrBelow(3000, ['kai-normal']), 'mayrin-hard', 'black-mage-hard', 'seren-normal', 'adversary-easy', 'kalos-easy'], status: 'reference', summary: 'Lv.284 + 하드 메이린 + 하드 검은 마법사', note: '노멀 세렌과 7,000점 슬롯 2종 포함. 1,000점 슬롯 1종 제외 기준으로 총 90,000점.' }
  ];

  window.CHALLENGERS_DATA = { version: '0.8.1', levelMissions, bossMissions, tiers, buildTypes, presets };
})();
