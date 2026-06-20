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
    { id: 'bloodyqueen-chaos', boss: '블러디 퀸', difficulty: '카오스', points: 200, series: 'bloodyqueen', rank: 1 },

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

  const presets = [
    {
      id: 'bronze-stable-v01',
      name: '브론즈 안정형',
      tierId: 'bronze',
      level: 260,
      includeAtOrBelow: 400,
      extraBossIds: [],
      status: 'draft',
      summary: 'Lv.260 + 400점 이하 보스 미션 전체',
      note: '첫 참여용 초안. 최고 보스 난이도 점수를 400점으로 제한합니다.'
    },
    {
      id: 'silver-stable-v01',
      name: '실버 안정형',
      tierId: 'silver',
      level: 264,
      includeAtOrBelow: 500,
      extraBossIds: ['lucid-normal', 'will-normal'],
      status: 'draft',
      summary: 'Lv.264 + 500점 이하 전체 + 1,000점 보스 2종',
      note: '1,000점 보스 2종은 같은 점수의 다른 보스로 교체할 수 있습니다.'
    },
    {
      id: 'gold-stable-v01',
      name: '골드 안정형',
      tierId: 'gold',
      level: 266,
      includeAtOrBelow: 1000,
      extraBossIds: ['lotus-hard'],
      status: 'draft',
      summary: 'Lv.266 + 1,000점 이하 전체 + 1,500점 보스 1종',
      note: '1,500점 슬롯은 하드 스우와 하드 데미안 중 교체 가능합니다.'
    },
    {
      id: 'platinum-stable-v01',
      name: '플래티넘 안정형',
      tierId: 'platinum',
      level: 270,
      includeAtOrBelow: 1500,
      extraBossIds: ['lucid-hard'],
      status: 'draft',
      summary: 'Lv.270 + 1,500점 이하 전체 + 2,000점 보스 1종',
      note: '2,000점 슬롯은 같은 점수 보스로 교체할 수 있습니다.'
    },
    {
      id: 'emerald-stable-v01',
      name: '에메랄드 안정형',
      tierId: 'emerald',
      level: 274,
      includeAtOrBelow: 2000,
      extraBossIds: ['will-hard', 'guardian-angel-slime-chaos'],
      status: 'draft',
      summary: 'Lv.274 + 2,000점 이하 전체 + 2,500점 보스 2종',
      note: '2,500점 보스 3종 가운데 가능한 2종으로 교체할 수 있습니다.'
    },
    {
      id: 'sapphire-reference-v01',
      name: '사파이어 기준 빌드',
      tierId: 'sapphire',
      level: 276,
      includeAtOrBelow: 3000,
      extraBossIds: [],
      status: 'reference',
      summary: 'Lv.276 + 3,000점 이하 보스 미션 전체',
      note: '사용자가 제공한 기준 빌드입니다. 레벨 11,200점 + 보스 29,300점 = 총 40,500점.'
    }
  ];

  window.CHALLENGERS_DATA = {
    version: '0.1.0',
    levelMissions,
    bossMissions,
    tiers,
    presets
  };
})();
