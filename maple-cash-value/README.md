# maple-cash-value

GitHub Pages용 메이플 캐시 효율 계산기입니다. 화면은 정적 파일로 제공하고, 데이터는 JSON으로 갱신합니다.

## 데이터 흐름

- `data/items.json`: 계산기 기본 항목과 패키지 구성품
- `data/auction-prices.json`: 경매장 웹 수집 결과
- `data/cashshop-notices.json`: NEXON Open API 캐시샵 공지 목록

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
