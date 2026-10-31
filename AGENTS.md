# 작업 규칙

메이플스토리 유튜버 키라키의 사이트 작업이다. 보고와 사이트 문구는 한국어로 쓴다.

## 공통 규칙

- 새 브랜치에 커밋하고 PR 을 연다. main 에 직접 푸시하지 않고 PR 을 머지하지 않는다. 합치는 건 대표가 한다.
  - 예외: `maple-cash-value/scripts/publish_prices.py` 로 `maple-cash-value/data/auction-prices.json` 한 파일을 올리는 것과, GitHub Actions 봇이 공지 데이터를 갱신하는 것은 지금처럼 main 에 바로 올라간다.
  - 예외: 가격 원장이 올라오면 GitHub Actions 봇(`update-maple-price-history.yml`)이 `maple-cash-value/data/price-history.json` 한 파일을 다시 만들어 main 에 바로 올린다.
- 화면 문구는 메이플 유저가 쓰는 말로 쓴다. "괴리, 휴지기, 교차검증, 근거, 검수, 확인가" 같은 작업 용어를 쓰지 않는다. 출처 각주·확인일·가정 목록을 화면에 넣지 않는다.
- 설명은 한 문장으로 끝낸다.
- 프레임워크·빌드 도입 금지(저장소에 이미 있으면 그대로 쓴다). 사이트에 외부 CDN 을 새로 넣지 않는다.
- 안 돌린 검사는 안 돌렸다고 적는다. PR 설명에 바뀐 것, 돌린 검사와 결과, 못 한 것을 적는다.
