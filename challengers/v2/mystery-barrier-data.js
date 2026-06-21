window.MYSTERY_BARRIER_DATA = {
  rarities: [
    { id: 'normal', name: '노멀', color: '#64748b' },
    { id: 'rare', name: '레어', color: '#1597d4' },
    { id: 'epic', name: '에픽', color: '#8b5bd6' },
    { id: 'unique', name: '유니크', color: '#f08a1a' },
    { id: 'legendary', name: '레전드리', color: '#329126' }
  ],
  stages: [
    { id: 1, name: '초소형 결계', condition: '골드 미만', minPoints: 0, probabilities: { normal: 67.490, rare: 30.450, epic: 2.030, unique: 0.023, legendary: 0.007 } },
    { id: 2, name: '소형 결계', condition: '골드 이상', minPoints: 15000, probabilities: { normal: 52.600, rare: 31.400, epic: 15.700, unique: 0.250, legendary: 0.050 } },
    { id: 3, name: '중형 결계', condition: '에메랄드 이상', minPoints: 30000, probabilities: { normal: 49.950, rare: 29.950, epic: 14.950, unique: 5.050, legendary: 0.100 } },
    { id: 4, name: '대형 결계', condition: '사파이어 이상', minPoints: 40000, probabilities: { normal: 0.000, rare: 29.950, epic: 62.880, unique: 6.650, legendary: 0.520 } },
    { id: 5, name: '초대형 결계', condition: '다이아몬드 이상', minPoints: 50000, probabilities: { normal: 0.000, rare: 0.000, epic: 91.850, unique: 7.100, legendary: 1.050 } }
  ]
};
