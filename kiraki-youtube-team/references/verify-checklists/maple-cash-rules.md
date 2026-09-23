# 과금계산기 규칙·코드 정합 체크리스트

대상: `maple-cash-value/PRICE_VERIFICATION.md` 와 그 규칙을 구현하는
`maple-cash-value/app.js`, `maple-cash-value/scripts/price_audit.py`,
`maple-cash-value/scripts/apply_market_basis.py`, 판매 회차 데이터
`maple-cash-value/data/collections.json`, 회차 추가 도구
`maple-cash-value/scripts/add_collection_run.py`, 대조 도구
`maple-cash-value/scripts/crosscheck_adoption.js` 와 사례 `scripts/adoption-cases.json`.

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
| 대역 유지 목표 | 20위/3일, 40위/7일, 80위/21일 | (미사용) | `BANDS` |
| 휴면 표본 | 회차당 5건 | (미사용) | `build_run_plan.py --sample` |
| 휴지기 대역 | 참고 40위 · 30일 · 매물만 | (미사용) | `RESTING_TOP` / `RESTING_DAYS` |
| 판매 창 하한 | 1970 년 | `windowBound` | `window_bound` |

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
3. **근거 없음** — 채택가가 0 인 행(매물도 시세도 없음)을 순위에서 빼는가.
   `calculateEfficiency` 가 메소 값 0 일 때 `Infinity` 를 돌려주는가. 마일리지
   적립만으로 유한한 효율이 나오면 finding.
4. 세 경우 모두 목록에서 지우지 않고 순위 자리에 사유를 표시하는가.
5. `price_audit.py` 의 `approx_ranking` 도 같은 규칙으로 판매 종료 상품, 값 0 인
   행, 저매물 단독 상품을 **순위에서** 제외하는가(`is_purchasable`,
   `if not value`, `thinOnly`). 계산기와 감사가 다르게 판단하면 finding.
6. **검증 큐는 반대다.** 판매 중인 상품을 떠받치는데 값이 0 인 행은 큐에서
   빼지 말고 `bootstrap` 으로 맨 앞에 두어야 한다. 값이 없으면 순위가 안 잡히고
   순위가 없으면 우선순위도 안 잡히기 때문이다. 큐에서 빠져 있으면 finding.

### 3-1. 판매 상태 (문서 10절 컬렉션 모델)

1. `app.js` `saleStatus` 와 `price_audit.py` `sale_status` 가 같은 입력에 같은 여섯 값
   (`on`·`always`·`upcoming`·`resting`·`ended`·`unknown`) 을 내는가. 창 해석(`windowBound`
   ↔ `window_bound`), 컬렉션 조회(`saleWindows` ↔ `sale_windows`), 참거짓 판단이 갈라지는
   입력을 찾으면 finding. 브라우저(V8)와 파이썬의 날짜 해석 차이를 특히 본다
2. 판매 창을 읽을 수 없는 경우(없는 컬렉션, 모양이 틀린 회차, 형식 밖 시각)가 **열린 창으로
   새지 않고** `unknown` 이 되는가. 새는 입력이 있으면 finding
3. 순위에 올리는 것은 `on`·`always` 뿐인가. `휴지기 포함` 보기를 켰을 때만 `resting` 이
   참고 순위에 들어가고, 요약의 「최고 효율」에는 들어가지 않는가
4. `collections.json` 의 회차가 문서 10절 표·공지 번호와 맞는가. 각 회차에 `notice` 가 있는가
5. `items.json` 에서 `collection` 을 가진 상품이 `availability` 를 함께 갖고 있지 않은가
   (두 근거가 있으면 어느 쪽이 이기는지 헷갈린다. 컬렉션이 이긴다)
6. `add_collection_run.py` 가 공지 번호 없는 회차·겹치는 회차를 거부하고, 기본이
   미리보기이며 `--apply` 에서만 파일을 바꾸는가. 시각 해석을 감사와 같은 함수로 하는가
7. 감사의 `휴지기` 대역이 지금 살 수 있는 상품의 대역보다 **뒤에** 정렬되는가

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

## 6. 두 구현이 같은 값을 쓰는가 — 기계로 센다

`node scripts/crosscheck_adoption.js <기준일>` 이 `app.js` 의 `priceFor` 를 떼어
원장 전 행에 돌리고 `price-audit.json` 의 `adoptedMeso`·`thinOnly` 와 대조한다.
불일치가 있으면 종료 코드 1 이다.

- 불일치 0 이 아니면 어느 쪽이 틀렸는지 단정하지 말고 **두 값과 행 이름**을 적는다
- 이 스크립트가 0 을 돌려주는 것은 채택 규칙이 같다는 뜻일 뿐, 규칙이 옳다는 뜻은 아니다
- 원장 전 행에 더해 `scripts/adoption-cases.json` 의 **합성 사례**도 함께 돈다.
  코덱스가 잡은 결함 중 둘은 원장에 없는 조합이었다. 전수 대조만으로는 못 본다
- 새로 발견한 갈라짐은 사례로 남긴다. 사례를 안 늘리면 같은 자리가 다시 갈라진다
- 2026-09-20 기준 원장 564행 + 합성 8사례 전부 일치

`adoptedMeso` 와 `calcAdoptedMeso` 를 혼동하지 않는다. 계산기와 맞춰야 하는 것은
`calcAdoptedMeso` 이고, `adoptedMeso` 는 등급 판정용이다(문서 9절).

## 7. 문서가 사실과 맞는가

문서 9절 「이행 상태」의 행 수(`recentSale` / `legacyMax` / 없음)가
현재 `auction-prices.json` 과 맞는가. 회차를 돌릴 때마다 바뀌므로 오래된 숫자가
남아 있으면 low finding 으로 적는다.

## 8. 이 파일들에는 적용하지 않는 것

`generic.md` 의 공통 체크리스트는 **사람이 읽는 산출물 문서**를 전제로 한다.
여기서 다루는 것은 실행되는 코드와 규칙 문서이므로 다음은 finding 이 아니다.

- 과제 ID·레인·소유자·검토자·「사실/해석/제안」 구분 같은 계약 필드가 없는 것
- 외부 행동 횟수·미확인 항목 필드가 파일 안에 없는 것
  (이 저장소의 외부 행동 기록은 `verification/` 의 판정 파일과 원장에 남는다)
- 음성·영상 관련 미확인 항목 (해당 없음)

## 9. 하지 말아야 할 것

- 규칙 자체가 옳은지(예: 최고가 대신 최근 체결가를 쓰는 것이 맞는지)는 판정하지
  않는다. 그것은 대표가 정한 것이다. **문서와 코드가 같은 말을 하는지**만 본다.
- 코드 스타일·성능은 대상이 아니다.
