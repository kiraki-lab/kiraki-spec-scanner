# maple-cash-value

GitHub Pages용 메이플 캐시 효율 계산기입니다. 화면은 정적 파일로 제공하고, 기본 데이터는 JSON으로 갱신합니다. 브라우저에서 수동 계산, 가격 저장, 항목 수정도 할 수 있습니다.

## 모드

- 공개 모드: 비밀번호 없이 표의 가격 칸에서 바로 수정 가능. 수정 가격은 현재 브라우저에만 저장됩니다.
- 멤버십 모드: `0722` 입력. 공개 모드 기능과 가격 JSON 가져오기/내보내기 가능.
- 관리자 모드: `0322` 입력. 공개·멤버십 기능과 항목 수정, 항목 JSON 가져오기/내보내기 가능.

브라우저에서 저장한 값은 해당 브라우저의 `localStorage`에만 남습니다. 다른 사람에게 공유되거나 GitHub 저장소에 자동 반영되지는 않습니다. 공유 데이터로 반영하려면 내보낸 JSON을 저장소의 `data/items.json` 또는 `data/auction-prices.json`에 반영해야 합니다.

패키지 총액은 직접 수정하지 않고 거래 가능한 구성품 가격의 합으로 계산합니다. 가격 수정 후 행 위치는 유지하며 순위 숫자와 상승·하락 표시만 갱신합니다.

## 직접 입력하거나 확인할 항목

계산 항목별로 확인할 값:

- 아이템명: 캐시샵 이름과 경매장 검색명이 다르면 별칭도 확인
- 분류: 기본, 쿠폰, 랜덤, 패키지 등
- 캐시 가격: 캐시샵 실제 판매가
- 마일리지 타입: 사용 불가, 30%, 100%
- 기본 메소 가격: 실시간 가격이 없을 때 쓸 기준값
- 패키지 구성품: 경매장에서 거래되는 구성품만 `components`에 입력
- BONUS 구성품: 교환 불가 또는 효율 계산 제외 품목은 `bonusComponents` 또는 코드 내 보너스 목록으로 분리

가격 연동별로 확인할 값:

- 월드: 기본값은 스카니아
- 경매장 검색어: 실제 구매 탭에서 검색 가능한 이름
- 매물 최저가: 계산 기준 가격
- 상태: 가격 있음, 기본값, 매물 없음, 후보 없음, 미확인
- 수집 시각: 수동 저장 또는 자동 수집 시각

공지/API 쪽에서 확인할 값:

- GitHub Secret `NEXON_OPEN_API_KEY`
- 캐시샵 공지에서 추출된 판매 품목명
- 이미지 OCR로 추출된 세부품목 후보 중 검수 필요 항목

## 데이터 흐름

- `data/items.json`: 계산기 기본 항목과 패키지 구성품
- `data/auction-prices.json`: 경매장 웹 수집 또는 수동 가격 결과
- `data/cashshop-notices.json`: NEXON Open API 캐시샵 공지 목록
- 브라우저 로컬 저장: 모든 사용자의 가격 수정값과 관리자 모드의 항목 수정본

## NEXON Open API

GitHub 저장소 Secret에 `NEXON_OPEN_API_KEY`를 등록한 뒤 `npm run update:cashshop`을 실행하면 `data/cashshop-notices.json`이 갱신됩니다.

사용 endpoint:

- `GET /maplestory/v1/notice-cashshop`
- `GET /maplestory/v1/notice-cashshop/detail`

앱 화면에 `Data based on NEXON Open API` 표기를 유지해야 합니다.

## 경매장 웹 수집

경매장 수집은 로컬 Chrome 프로필 기반으로 실행하는 것을 권장합니다. 먼저 `auction-config.example.json`을 `auction-config.local.json`으로 복사한 뒤 실제 경매장 웹의 URL과 selector를 채웁니다.

```powershell
npm install
npx playwright install chromium
$env:PLAYWRIGHT_CHANNEL="chrome"
npm run update:auction
```

기본 대기 시간은 검색 1회당 4.5초에서 9초 사이입니다. 제한 문구나 비정상 응답을 감지하면 수집을 중단하도록 selector를 설정하세요.
