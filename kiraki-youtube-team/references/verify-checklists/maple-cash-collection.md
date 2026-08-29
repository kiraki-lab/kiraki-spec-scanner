# 과금계산기 회차 산출물 체크리스트

대상: `maple-cash-value/data/collection-<날짜>.json` 과 그것이 반영된
`maple-cash-value/data/auction-prices.json`.

규칙 정본은 `maple-cash-value/PRICE_VERIFICATION.md`. 판정이 규칙과 어긋나면
문서를 근거로 지적한다. 경매장에 접속해 값을 다시 확인할 수는 없으므로,
**파일 안에서 서로 맞는지**만 본다.

## 1. 회차 자체가 앞뒤가 맞는가

1. `results` + `marketHistory` 개수의 합이 `capturedSearches` 및 `usedSearches`
   와 맞는가. (`results` 만으로 비교하지 않는다 — 한 회차는 매물 조회와 시세
   조회 두 종류로 나뉘고 둘 다 검색 횟수를 쓴다.)
2. `searchIndex` 가 1부터 증가하는가. **중간에 1 로 되감기는 것은 정상이다** —
   자정을 넘겨 이어 돌린 회차이며, 그때는 `crossedMidnight: true` 와
   `segments` 의 날짜별 회수가 함께 있어야 한다. 되감김이 있는데 그 표시가
   없으면 finding.
3. `segments` 의 회수 합이 `usedSearches` 와 맞는가.
4. `collectedAt` 이 모두 같은 회차 시간대 안에 있는가(수 시간 이상 벌어진 값이
   섞여 있으면 finding).

## 2. 각 결과 행의 상태와 값이 일치하는가

| status | 만족해야 할 것 |
|---|---|
| `ok` | `listingLowestMeso > 0`, `resultCount > 0`, `quantity` 있음 |
| `no_listing` | `resultCount == 0` 이고 `listingLowestMeso == 0` |
| `uncaptured` | `resultCount > 0` 인데 값이 없음. **`pagesScanned` 가 기록돼 있어야 한다** |

`resultCount > 0` 인데 `status` 가 `no_listing` 이면 finding (매물이 있는데
없다고 기록한 것). 반대도 마찬가지.

## 3. 원장 반영이 회차와 어긋나지 않는가 — 가장 중요

`collection` 의 각 행을 `auction-prices.json` 의 같은 `itemName` 행과 대조한다.

1. `status: ok` 행 → 원장의 `listingLowestMeso`·`collectedAt`·`updatedAt` 이
   회차 값과 같은가.
2. `status: no_listing` 행 → 원장이 `listingLowestMeso: 0` 이면서
   **직전 확인가를 `lastKnownListingMeso` 로 보존**했는가. 직전 값이 있었는데
   보존 없이 사라졌으면 finding.
3. `status: uncaptured` 행 → **원장의 가격이 덮어써지지 않았는가.**
   `updatedAt` 이 이번 회차 시각으로 바뀌었으면 finding. 미포착은 값을 모르는
   것이지 값이 없어진 것이 아니다.
4. 회차에 없는 품목의 `updatedAt` 이 이번 회차 시각으로 바뀌어 있으면 finding.

## 4. 급변을 빠뜨리지 않았는가

`pendingHistoryItems` 는 규칙(5절)대로 **매물 수와 무관하게** 직전 대비
2배 이상 또는 0.5배 이하, 또는 1.5배 이상이면서 시세 교차검증이 없는 행을
담아야 한다.

- 회차 행 중 `lastKnownListingMeso` 나 원장의 직전 값과 비교해 위 조건에
  해당하는데 `pendingHistoryItems` 에 없는 품목이 있으면 finding.
- `pendingHistoryRule` 문자열이 실제 적용된 조건과 다르면 finding.

## 5. 시세 기록이 규칙대로인가

1. `marketHistory` 의 각 항목에 `sales` 배열과 `latestSaleDate` 가 있는가.
   `sales` 가 비어 있으면 `status: uncaptured` 로 표시돼 있는가.
2. 원장에서 그 품목의 `marketPriceMeso` 가 **최근 체결가와 최근 3건 중앙값 중
   높은 쪽**인가(9절). 다르면 계산이 틀렸거나 기준이 바뀐 것이므로 finding.
3. `marketPriceBasis` 가 `recentSale` 인 행에 `marketPriceAt` 이 있는가.

## 6. 이 파일에는 적용하지 않는 것

`generic.md` 의 공통 체크리스트는 **사람이 읽는 산출물 문서**를 전제로 한다.
여기서 다루는 것은 기계가 만든 데이터 파일이므로 다음은 finding 이 아니다.

- 과제 ID·레인·소유자·검토자·「사실/해석/제안」 구분 같은 계약 필드가 없는 것
- 외부 행동 횟수 필드가 없는 것 (이 파일들은 조회 결과이며 외부 행동을 하지 않는다)
- 음성·영상 관련 미확인 항목 (해당 없음)

## 7. 하지 말아야 할 것

- 값이 "비싸 보인다/싸 보인다"는 판단은 하지 않는다. 경매장을 볼 수 없으므로
  시세의 옳고 그름은 판정 대상이 아니다. **파일 사이의 모순만** 지적한다.
- 회차가 100회를 못 채운 것 자체는 finding 이 아니다. 한도·리셋·중단은 정상이다.
