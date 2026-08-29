# 과금계산기 규칙·코드 정합 체크리스트

대상: `maple-cash-value/PRICE_VERIFICATION.md` 와 그 규칙을 구현하는
`maple-cash-value/app.js`, `maple-cash-value/scripts/price_audit.py`,
`maple-cash-value/scripts/apply_market_basis.py`.

문서가 규칙의 정본이다. **문서와 코드가 갈라지면 어느 쪽이 틀렸는지는 단정하지 말고,
갈라졌다는 사실과 두 값을 함께** 적는다. 세 파일을 한 사람이 번갈아 고쳐 왔으므로
조용히 어긋나는 것이 이 검증의 주된 표적이다.

## 1. 임계값이 세 곳에서 같은가

문서 3·5절의 숫자와 코드의 상수를 대조한다.

| 항목 | 문서 | app.js | price_audit.py |
|---|---|---|---|
| 낡음 기준(일) | 14 | `EVIDENCE_STALE_DAYS` | `STALE_DAYS` |
| 신선 기준(일) | 3 | (미사용) | `FRESH_DAYS` |
| 저매물 건수 | 2 | `THIN_LISTING_COUNT` | `THIN_LISTINGS` |
| 괴리 허용(%) | 30 / 60 | (미사용) | `GAP_OK` / `GAP_WARN` |
| 급변 배수 | 2.0 / 0.5 | (미사용) | `SPIKE_UP` / `SPIKE_DOWN` |
| 상위권 게이트 | 20위 | (미사용) | `TOP_RANK_GUARD` |

하나라도 다르면 finding. 코드에만 있고 문서에 없는 임계값이 새로 생겼으면
그것도 finding(문서 미갱신).

## 2. 채택 규칙이 문서 4절대로인가 (`app.js` `priceFor`)

1. 매물가와 시세를 각각 **낡았는지 먼저 판정해 후보에서 빼고**, 남은 후보 중
   낮은 쪽을 쓰는가.
2. 후보가 하나도 없으면 있는 값을 그대로 쓰되 그 사실을 표시하는가(`evidenceStale`).
3. 시세는 `marketPriceMeso` 를 먼저 보고, 없을 때만 `marketHistoryMaxMeso` 로
   물러나는가(9절).
4. 신선도 판정에 `marketPriceAt` 을 쓰는가. `marketHistoryCollectedAt` 만 보고
   있으면 새 기준으로 옮긴 행의 나이를 잘못 재는 것이므로 finding.

## 3. 순위 제외 규칙 (문서 5·10절)

1. **판매 종료** — `availability.endAt` 이 지났거나 `startAt` 이 아직이거나
   `rankEligible: false` 인 상품에 순위를 매기지 않는가.
2. **저매물 단독 근거** — 쓸 수 있는 시세가 없고 매물이 `THIN_LISTING_COUNT`
   이하인 **단독 상품**(구성품 없는 상품)을 순위에서 빼는가. 패키지는 빼지 않고
   뱃지만 다는가.
3. 두 경우 모두 목록에서 지우지 않고 순위 자리에 사유를 표시하는가.
4. `price_audit.py` 도 같은 규칙으로 판매 종료 상품을 순위·검증 큐에서
   제외하는가(`is_purchasable`). 계산기와 감사가 다르게 판단하면 finding.

## 4. 등급 판정 (문서 3절)

`grade_row` 가 문서의 A~F 정의와 같은가. 특히

- A 는 두 근거가 **모두** `FRESH_DAYS` 이내이고 괴리가 `GAP_OK` 이내일 때만.
- `legacyMax` 는 교차검증으로 인정하지 않는가(9절). 인정하면 등급이 부풀려진다.
- 저매물 판정이 "쓸 수 있는 후보가 매물 하나뿐"일 때 걸리는가. 못 쓰는 시세가
  있다는 이유로 빠져나가면 finding.

## 5. 시세 채택 계산 (`apply_market_basis.py`, 문서 9절)

1. `marketPriceMeso` 가 **최근 체결가와 최근 3건 중앙값 중 높은 쪽**인가.
2. 체결 내역이 없는 행을 `legacyMax` 로 표시하고, 그 값이 3개월 최고가임을
   `marketPriceFrom` 에 남기는가.
3. 체결 내역이 생긴 행이 `legacyMax` 로 남아 있지 않은가.

## 6. 문서가 사실과 맞는가

문서 9절 「이행 상태」의 행 수(`recentSale` / `legacyMax` / 없음)가
현재 `auction-prices.json` 과 맞는가. 회차를 돌릴 때마다 바뀌므로 오래된 숫자가
남아 있으면 low finding 으로 적는다.

## 7. 하지 말아야 할 것

- 규칙 자체가 옳은지(예: 최고가 대신 최근 체결가를 쓰는 것이 맞는지)는 판정하지
  않는다. 그것은 대표가 정한 것이다. **문서와 코드가 같은 말을 하는지**만 본다.
- 코드 스타일·성능은 대상이 아니다.
