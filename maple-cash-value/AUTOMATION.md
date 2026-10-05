# 가격 조사 한 회차 돌리는 순서

누가 돌리든(Claude · Codex · 사람) 이 순서 그대로다. 규칙의 이유는 `PRICE_VERIFICATION.md` 에 있고, 여기는 순서만 적는다.

사람이 해야 하는 것은 **로그인과 캐릭터 선택** 하나다. 나머지는 스크립트가 한다.

## 0. 시작 전

- 크롬에서 `https://auction.maplestory.nexon.com` 에 로그인돼 있고 캐릭터가 골라져 있어야 한다. 로그인 화면이 뜨면 멈추고 대표에게 알린다. 비밀번호를 대신 넣지 않는다.
- 검색 횟수는 **캐릭터마다 하루 100회**, 자정(KST)에 0 으로 돌아간다. 화면 오른쪽 위 `검색 횟수 n / 100` 이 유일한 확인법이다.
- 한 회차는 한 캐릭터로 끝까지 간다.

## 1. 새 공지 확인 (검색 횟수 안 씀)

원격의 `data/cashshop-notices.json` 은 매일 자동으로 갱신된다. 지난 회차 기록에 적힌 최신 공지보다 새 글이 있으면 판매 기간부터 확인한다. 끝난 상품에 검색을 쓰지 않기 위해서다.

## 2. 계획

```bash
python scripts/price_audit.py
python scripts/build_run_plan.py --budget 100 --accounts 1
python scripts/ingest_run.py queue > queue.json
```

`queue.json` 이 `[["이름","listing"|"market"], ...]` 이다. 시세를 앞에 몰아 탭 전환을 줄인다.

## 3. 수집

경매장 탭에서 `scripts/auction_collector.js` 전체를 실행한 뒤:

```js
__kr.clear();                 // 지난 회차 기록을 지운다
__kr.run(QUEUE);              // 기다리지 않는다. 한 건에 10~25초
__kr.status();                // 진행 확인
```

- `state` 가 `done` 이면 끝이다.
- 한도(100회)에 걸리면 `waiting_reset` 으로 바뀌어 30초마다 카운터를 보다가 자정에 되감기면 그 품목부터 스스로 이어 돈다. 탭을 닫지 않는다.
- `stopped:not_triggered` 는 한도가 남았는데 검색이 안 눌린 것이다(로그아웃·화면 변경). 원인을 고친 뒤 `__kr.run(QUEUE)` 를 다시 부르면 남은 것만 돈다.
- `stopped:unexpected_result` 는 결과 제목이 검색한 이름과 다르거나 분류 필터가 걸린 것이다. 그 검색은 값으로 쓰지 않고 `rejected` 로 남아 허비한 검색으로 세어진다. 화면에서 필터를 풀고 `__kr.run(QUEUE)` 를 다시 부른다.
- 자동완성에 정확일치가 없는 이름은 검색하지 않고 넘어간다(횟수 안 씀). 거래불가로 적지 않는다.

끝나면 결과를 꺼낸다.

```js
__kr.dump();                  // 화면 맨 위에 KRDUMP_START … KRDUMP_END 로 찍는다
```

페이지 글을 읽어 그 사이의 JSON 을 `dump.json` 으로 저장한다.

## 4. 병합과 검증

```bash
python scripts/ingest_run.py build dump.json --account 2 --character "스카니아 / <캐릭터>"
python scripts/merge_run.py data/collection-<날짜>-account2.json            # 미리 보기
python scripts/merge_run.py data/collection-<날짜>-account2.json --apply    # 기준본 이름을 찍어 준다
python scripts/price_audit.py
node scripts/crosscheck_adoption.js
```

- 수집기 밖에서 손으로 눌러 값 없이 횟수만 쓴 검색이 있었으면 `build` 에 `--lost "이름:listing:사유@2026-10-02"` 를 붙인다(날짜는 KST, 빼면 회차 첫날). 수집기가 버린 검색(`rejected`)은 알아서 세어진다.
- `ingest_run` 은 검사합·정렬·이름 일치·오름차순을 확인하고, 하나라도 어긋나면 파일을 만들지 않는다.
- 수집이 `done` 으로 끝나지 않았으면 회차는 **미완료**로 기록되고 5번에서 올라가지 않는다. 이어 돌려 `done` 을 만든 뒤 다시 꺼낸다.
- `crosscheck_adoption.js` 의 불일치가 전부 0 이어야 한다. 0 이 아니면 올리지 않는다.
- 감사 출력의 `상위 20위 안에서 등급 C 이하인 행` 을 본다. 순위 1~10위를 직접 열어 상식에 안 맞는 값이 없는지 본다.

## 5. 올리기

```bash
python scripts/publish_prices.py --baseline data/auction-prices.before-<날짜>.json --dry
python scripts/publish_prices.py --baseline data/auction-prices.before-<날짜>.json
```

`data/auction-prices.json` **한 파일만** 올린다(`AGENTS.md` 의 상시 승인 범위). 원격이 기준본과 다르면 스스로 멈춘다. 상품 목록·코드·문서는 대표 승인을 따로 받는다.

## 6. 기록

`verification/collection-<날짜>-account<N>.md` 에 횟수, 확보 건수, 매물 0건, 못 찾은 이름, 검증 결과, 커밋을 적는다. 수집 원본(`data/collection-*.json`)에는 캐릭터 이름이 들어 있어 공개 저장소에 올리지 않는다.

## 사람이 판단할 일이 생기는 경우

| 상황 | 할 일 |
|---|---|
| 로그인 화면 | 멈추고 알린다 |
| 새 캐시샵 공지 | 판매 기간·캐시가를 공지 원문에서 확인한 뒤 상품 추가는 승인받는다 |
| 순위 1~3위가 하루 만에 크게 바뀜 | 값이 맞는지 화면에서 다시 보고 보고에 먼저 적는다 |
| 자동완성에 없는 이름 | `unsearched` 로 남기고 일주일 뒤 다시 본다 |
