window.MYSTERY_BARRIER_DATA = {
  rarities: [
    { id: 'normal', name: '노멀', color: '#64748b' },
    { id: 'rare', name: '레어', color: '#1597d4' },
    { id: 'epic', name: '에픽', color: '#8b5bd6' },
    { id: 'unique', name: '유니크', color: '#f08a1a' },
    { id: 'legendary', name: '레전드리', color: '#329126' }
  ],
  stages: [
    {
      id: 1,
      name: '초소형 결계',
      condition: '골드 미만',
      appliesTo: '브론즈·실버 구간',
      minPoints: 0,
      recommendation: {
        gradeId: 'rare',
        stretchGradeId: 'epic',
        note: '노멀 비중이 높기 때문에 처음에는 레어 이상을 현실적인 기준으로 보고, 에픽 이상은 좋은 결과로 생각하면 편합니다.'
      },
      probabilities: { normal: 67.490, rare: 30.450, epic: 2.030, unique: 0.023, legendary: 0.007 }
    },
    {
      id: 2,
      name: '소형 결계',
      condition: '골드 이상',
      appliesTo: '골드·플래티넘 구간',
      minPoints: 15000,
      recommendation: {
        gradeId: 'epic',
        stretchGradeId: 'unique',
        note: '에픽 이상이 16%로 올라갑니다. 레어에 만족하기보다 에픽 이상을 첫 목표로 잡아볼 만한 단계입니다.'
      },
      probabilities: { normal: 52.600, rare: 31.400, epic: 15.700, unique: 0.250, legendary: 0.050 }
    },
    {
      id: 3,
      name: '중형 결계',
      condition: '에메랄드 이상',
      appliesTo: '에메랄드 구간',
      minPoints: 30000,
      recommendation: {
        gradeId: 'epic',
        stretchGradeId: 'unique',
        note: '에픽 이상은 20.1%이고 유니크 이상도 5.15%입니다. 에픽을 기본 목표로, 유니크 이상은 상향 결과로 보면 좋습니다.'
      },
      probabilities: { normal: 49.950, rare: 29.950, epic: 14.950, unique: 5.050, legendary: 0.100 }
    },
    {
      id: 4,
      name: '대형 결계',
      condition: '사파이어 이상',
      appliesTo: '사파이어 구간',
      minPoints: 40000,
      recommendation: {
        gradeId: 'unique',
        label: '유니크 이상',
        stretchGradeId: 'legendary',
        note: '사파이어부터는 유니크 이상을 추천 기준으로 봅니다. 유니크 이상 확률은 7.17%이고, 레전드리는 0.52%입니다.'
      },
      probabilities: { normal: 0.000, rare: 29.950, epic: 62.880, unique: 6.650, legendary: 0.520 }
    },
    {
      id: 5,
      name: '초대형 결계',
      condition: '다이아몬드 이상',
      appliesTo: '다이아몬드·마스터·챌린저',
      minPoints: 50000,
      recommendation: {
        gradeId: 'unique',
        label: '유니크~레전드리',
        stretchGradeId: 'legendary',
        stretchLabel: '레전드리',
        note: '다이아몬드부터는 유니크~레전드리를 추천 범위로 봅니다. 유니크 이상 확률은 8.15%, 레전드리는 1.05%입니다.'
      },
      probabilities: { normal: 0.000, rare: 0.000, epic: 91.850, unique: 7.100, legendary: 1.050 }
    }
  ]
};
