# -*- coding: utf-8 -*-
"""영상에 쓴 순위표의 근거를 날짜가 박힌 파일로 남긴다.

  python scripts/make_snapshot.py page.json [--label 영상제목]

page.json 은 계산기 화면에서 `JSON.stringify(kirakiSnapshot())` 로 뽑은 값이다.
화면의 숫자를 다시 계산하지 않고 그대로 받아, 그때의 데이터 파일 SHA 와 함께 묶는다.
  snapshots/<날짜>.json  — 원값 (순위·채택가·매물/체결·효율 두 가지·설정·크레딧 기준 품목)
  snapshots/<날짜>.md    — 사람이 읽는 표. 상품권 할인 0% 일 때 값도 같이 적는다.
"""
import argparse
import hashlib
import io
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
KST = timezone(timedelta(hours=9))
FILES = ['app.js', 'data/items.json', 'data/auction-prices.json', 'data/credit-shop.json', 'data/collections.json']
EVIDENCE = {'official': '공식 문구', 'ingame': '게임 내 확인', 'creditShop': '크레딧샵 명시', 'observed': '체결 기록', None: '-'}


def kst(iso):
    if not iso:
        return '-'
    return datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone(KST).strftime('%m-%d %H:%M')


def eok(meso):
    return '-' if not meso else '%.2f억' % (meso / 1e8)


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('page')
    parser.add_argument('--label', default='')
    args = parser.parse_args()

    snap = json.loads(io.open(args.page, encoding='utf-8').read())
    rows = snap['rows']
    if [r['rank'] for r in rows] != list(range(1, len(rows) + 1)):
        sys.exit('순위가 1부터 이어지지 않는다')
    if any(a['wonPerEok'] > b['wonPerEok'] for a, b in zip(rows, rows[1:])):
        sys.exit('순위와 효율 순서가 다르다')
    settings = snap['settings']
    discount = float(settings.get('discountRate') or 0)
    if settings.get('useMileage') or settings.get('includeResting'):
        sys.exit('남은 마일리지 사용·재판매 대기 포함을 끈 화면에서 뽑아야 한다')

    taken = datetime.fromisoformat(snap['takenAt'].replace('Z', '+00:00')).astimezone(KST)
    day = taken.date().isoformat()
    snap['label'] = args.label
    snap['files'] = {f: hashlib.sha256((BASE / f).read_bytes()).hexdigest() for f in FILES}
    for r in rows:
        # 할인 없이 넥슨캐시를 정가로 충전했을 때. 마일리지를 안 쓰므로 비용이 할인율에 비례한다.
        r['wonPerEokNoDiscount'] = round(r['wonPerEok'] / (1 - discount / 100), 1)

    out = BASE / 'snapshots'
    out.mkdir(exist_ok=True)
    (out / (day + '.json')).write_text(json.dumps(snap, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    credit = snap.get('credit') or {}
    lines = [
        '# %s 순위표 스냅숏%s' % (day, (' — ' + args.label) if args.label else ''),
        '',
        '- 뽑은 시각: %s KST · 가격 기준: %s KST' % (taken.strftime('%Y-%m-%d %H:%M'), kst(snap.get('auctionUpdatedAt'))),
        '- 전제: 상품권 할인 %g%% · 경매장 수수료 %g%% · 남은 마일리지 사용 안 함 · 크레딧 적립은 뺀 값이 기본' % (
            discount, float(settings.get('ahFeeRate') or 0)),
        '- 크레딧 포함 값은 넥슨캐시 5%% 적립분을 모아 크레딧샵의 %s(1점 약 %s메소)를 사서 판다고 가정한 추정치' % (
            credit.get('name') or '-', format(int(round((credit.get('rate') or 0) / 100) * 100), ',')),
        '- 파는 데 걸리는 시간과 물량은 숫자에 들어 있지 않다. `거래 적음` 은 3개월 체결이 200건 미만이거나 매물이 1~2건',
        '- 교환 근거가 `체결 기록` 인 상품은 넥슨캐시 구매분이 교환된다는 공식 품목별 문구가 없다',
        '',
        '| 순위 | 상품 | 캐시가 | 채택가 | 매물 최저(건수) | 최근 체결 | 차이 | 원/1억 | 할인 0%일 때 | 크레딧 포함 | 교환 근거 | 비고 |',
        '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ]
    for r in rows:
        count = '' if not r.get('listingCount') else '(%s)' % format(r['listingCount'], ',')
        notes = []
        if r.get('lowLiquidity'):
            notes.append('거래 적음')
        if r.get('components'):
            notes.append('묶음 상품')
        lines.append('| %d | %s | %s | %s | %s%s | %s | %s | %s | %s | %s | %s | %s |' % (
            r['rank'], r['name'], format(r['cashPrice'], ','), eok(r['adoptedMeso']), eok(r.get('listingMeso')), count,
            eok(r.get('marketMeso')), ('%g%%' % r['gapPercent']) if r.get('gapPercent') else '-',
            format(round(r['wonPerEok']), ','), format(round(r['wonPerEokNoDiscount']), ','),
            format(round(r['wonPerEokWithCredit']), ','), EVIDENCE.get(r.get('exchangeEvidence'), '-'), ' · '.join(notes) or '-'))
    lines += ['', '## 데이터 파일 (SHA-256)', ''] + ['- `%s` %s' % (f, h) for f, h in snap['files'].items()]
    (out / (day + '.md')).write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print('snapshots/%s.json · snapshots/%s.md · %d개 상품' % (day, day, len(rows)))


if __name__ == '__main__':
    main()
