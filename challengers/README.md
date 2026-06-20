# 챌린저스 구간 빌드 계산기

레벨 미션과 보스 미션 포인트를 합산하고, 구간별 권장 빌드와 캐릭터별 개인 진행도를 관리하는 정적 웹 계산기입니다.

## 현재 포함 기능

- Lv.260~290 레벨 미션 누적 포인트 계산
- 보스 미션을 지급 포인트별 난이도 그룹으로 표시
- 상위 난이도 체크 시 같은 보스의 하위 미션 자동 포함
- 브론즈~사파이어 권장 프리셋 초안
- Lv.276 + 3,000점 이하 보스 전체 = 사파이어 40,500점 기준 프리셋
- 현재 진행도와 권장 빌드를 분리 표시
- 목표 티어까지 최고 난이도 구간을 우선 낮추는 안정형 추천
- 여러 캐릭터 진행도 브라우저 자동 저장
- JSON 백업 내보내기·불러오기
- 모바일 반응형 UI

## 배포 위치

이 계산기는 기존 `kiraki-lab/kiraki-spec-scanner` 저장소의 `challengers/` 폴더에 추가됩니다.

- 작업 브랜치: `feature/challengers-calculator`
- PR 머지 후 예상 주소: `https://kiraki-lab.github.io/kiraki-spec-scanner/challengers/`

현재 메인 계산기에는 영향을 주지 않도록 별도 경로로 구성했습니다.

## 파일 구조

- `index.html`: 화면 구조
- `styles.css`: 디자인 및 반응형 레이아웃
- `data.js`: 레벨·보스·티어·프리셋 데이터
- `app.js`: 계산, 추천, 진행도 저장 로직
- `tests/data.test.js`: 핵심 점수와 프리셋 합계 검증

## 프리셋 추가 방법

`data.js`의 `presets` 배열에 아래 형태로 항목을 추가합니다.

```js
{
  id: 'unique-id',
  name: '프리셋 이름',
  tierId: 'silver',
  level: 264,
  includeAtOrBelow: 500,
  extraBossIds: ['lucid-normal', 'will-normal'],
  status: 'draft', // 기준 확정은 reference
  summary: '화면에 표시할 짧은 구성',
  note: '교체 가능 보스나 설계 이유'
}
```

같은 포인트 슬롯을 바꿀 때는 `extraBossIds`의 보스 ID만 교체하면 됩니다.

## 저장 방식

진행도는 브라우저 `localStorage`에 저장됩니다. 서버 계정이나 개인정보를 사용하지 않습니다. 브라우저 데이터 삭제 및 기기 변경에 대비해 JSON 백업 기능을 제공합니다.

## 데이터 검증

`challengers/` 폴더에서 아래 명령을 실행합니다.

```bash
node --check data.js
node --check app.js
node tests/data.test.js
```

현재 테스트는 보스 미션 36개, Lv.276 레벨 점수 11,200점, 3,000점 이하 보스 합계 29,300점, 사파이어 기준 빌드 총 40,500점과 각 초안 프리셋 합계를 검증합니다.

## 데이터 범위

현재 버전은 제공된 표의 **챌린저스 포인트**만 반영합니다. 코인, 마스터·챌린저 별도 격파 조건, 보스 아이콘은 데이터가 확정되는 순서대로 추가할 예정입니다.
