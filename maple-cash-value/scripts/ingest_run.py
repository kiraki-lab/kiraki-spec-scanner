# -*- coding: utf-8 -*-
"""수집기(auction_collector.js)가 찍어 낸 결과를 회차 파일로 바꾼다.

  python scripts/ingest_run.py queue [--date 2026-10-05]
      그날 계획(data/run-plan-<날짜>.json)을 수집기에 넣을 [[이름, 축], ...] 로 찍는다.

  python scripts/ingest_run.py build <dump.json> --account 2 --character "스카니아 / 헤성"
      [--lost "프리스타일 쿠폰:listing:필터가 걸린 채 검색"] [--note "..."]
      data/collection-<날짜>-account<N>.json 을 만든다. 그 뒤는 merge_run.py 가 받는다.

dump.json 은 __kr.dump() 가 화면에 찍은 KRDUMP_START…KRDUMP_END 사이의 JSON 이다.
옮겨 적다 값이 바뀌지 않았는지 수집기가 같이 찍은 검사합으로 확인한다.
"""
import argparse
import io
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
DATA = BASE / 'data'
KST = timezone(timedelta(hours=9))
SORT = {'l': 'PRICE_PER_ITEM_ASC', 'm': 'TRADE_DATE_DESC'}
MOD = 1000000007


def checksum(results):
    total = 0
    for r in results:
        total = (total * 31 + (r[3] or 0)) % MOD
        for row in r[8]:
            total = (total * 31 + row[0]) % MOD
    return str(total)


def kst_date(iso):
    return datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone(KST).date().isoformat()


def cmd_queue(args):
    day = args.date or datetime.now(KST).date().isoformat()
    plan = json.loads((DATA / ('run-plan-%s.json' % day)).read_text(encoding='utf-8'))
    queue = [[s['itemName'], s['axis']] for s in plan['searches']]
    # 시세 탭과 구매 탭을 오가는 횟수를 줄인다. 같은 날이면 순서는 등급에 영향이 없다.
    queue.sort(key=lambda q: q[1] != 'market')
    sys.stdout.write(json.dumps(queue, ensure_ascii=False) + '\n')
    sys.stderr.write('%s · %d회 (시세 %d · 매물 %d)\n' % (
        day, len(queue), sum(q[1] == 'market' for q in queue), sum(q[1] == 'listing' for q in queue)))


def build(dump, account, character, lost=(), note=None):
    results = dump['results']
    if checksum(results) != str(dump['checksum']):
        raise SystemExit('검사합이 다르다. 옮겨 적다 값이 바뀌었다: %s != %s' % (checksum(results), dump['checksum']))
    state = dump.get('state')
    if state != 'done' and not str(state).startswith('stopped'):
        raise SystemExit('수집이 아직 도는 중이다: %s' % state)
    # 큐를 끝까지 돈 회차만 완료다. 중간에 멈춘 회차는 확보한 값은 살리되 미완료로 적는다.
    # 미완료 회차는 publish_prices.py 가 올리지 않는다(AGENTS.md: 정상 완료된 조사만).
    complete = state == 'done'

    listings, markets, unsearched, auto_lost, days = [], [], [], [], {}
    seen = set()
    index = 0
    for name, axis, status, count, sort, at, _before, _after, rows, game_name in results:
        key = (''.join(name.split()), axis)
        if status == 'no_autocomplete':
            # 확인한 날은 수집기가 본 시각이다. 변환을 늦게 돌려도 재확인일이 밀리지 않게 한다.
            day = datetime.fromisoformat(kst_date(at)).date() if at else datetime.now(KST).date()
            unsearched.append(dict(itemName=name, axis='market' if axis == 'm' else 'listing', status='unresolved',
                                   reason='정확일치 자동완성 없음; 거래불가 판정 아님',
                                   checkedAt=day.isoformat(), nextCheckAt=(day + timedelta(days=7)).isoformat()))
            continue
        if status == 'rejected':           # 횟수는 썼지만 결과를 믿을 수 없어 수집기가 버린 검색
            lost_row = dict(itemName=name, axis='market' if axis == 'm' else 'listing',
                            reason='결과 제목 불일치 또는 분류 필터 — 값 미기록')
            if at:                         # 날짜별 횟수에는 넣는다. 자정 전에 허비했으면 그날 몫이다
                lost_row['kstDate'] = kst_date(at)
                days[kst_date(at)] = days.get(kst_date(at), 0) + 1
            auto_lost.append(lost_row)
            continue
        if status != 'searched':
            continue                       # 값이 없는 검색. 횟수를 썼으면 --lost 로 적는다
        if key in seen:
            raise SystemExit('같은 품목·같은 축이 두 번 있다: %s %s' % (name, axis))
        seen.add(key)
        if count is None or (count > 0) != bool(rows):
            raise SystemExit('건수와 행이 안 맞는다: %s %s' % (name, axis))
        # 0건이면 수집기가 정렬을 바꾸지 않는다(바꿀 목록이 없다). 읽을 행이 있을 때만 정렬을 따진다.
        if count > 0 and sort != SORT[axis]:
            raise SystemExit('정렬이 다르다: %s %s %s' % (name, axis, sort))
        index += 1
        days[kst_date(at)] = days.get(kst_date(at), 0) + 1
        if axis == 'l':
            prices = [r[0] for r in rows]
            if any(r[2] != 1 for r in rows) or prices != sorted(prices) or any(p <= 0 for p in prices):
                raise SystemExit('매물 행이 이상하다: %s %s' % (name, rows))
            row = dict(itemName=name, type='listing', searchIndex=index, resultCount=count,
                       listingLowestMeso=prices[0] if prices else 0, collectedAt=at)
            if game_name:
                row['gameName'] = game_name
            listings.append(row)
        else:
            dates = [r[1] for r in rows]
            if dates != sorted(dates, reverse=True) or any(r[0] <= 0 for r in rows):
                raise SystemExit('체결 행이 이상하다: %s %s' % (name, rows))
            markets.append(dict(itemName=name, searchIndex=index, resultCount=count, collectedAt=at,
                                sales=[dict(price=p, date=d) for p, d in rows[:3]]))
    if not index:
        raise SystemExit('기록할 검색이 없다')

    lost_rows = list(auto_lost)
    captured_days = sorted(kst_date(r['collectedAt']) for r in listings + markets)
    for spec in lost:
        # "이름:축:사유" 또는 "이름:축:사유@2026-10-02". 날짜를 안 적으면 회차 첫날 몫으로 센다.
        spec, _, day = spec.partition('@')
        name, axis, reason = (spec.split(':', 2) + ['', ''])[:3]
        day = day or min(days)
        days[day] = days.get(day, 0) + 1
        lost_rows.append(dict(itemName=name, axis=axis or 'listing', reason=reason or '값 미기록', kstDate=day))
    # 날짜별 횟수는 화면 카운터 기준이다(값을 얻은 검색 + 허비한 검색).
    segments = [dict(kstDate=d, searches=n) for d, n in sorted(days.items())]
    run_date = captured_days[-1]
    return dict(
        date=run_date, searchAccount=account, accountCharacter=character, world='스카니아',
        usedSearches=index, screenSearches=index + len(lost_rows), accountComplete=complete,
        dailyPriorityComplete=complete, collectorState=state,
        segments=segments, lostSearches=lost_rows, unsearched=unsearched,
        note=note or '매물 %d · 시세 %d. 정확일치 자동완성 → Enter(전체 분류). 구매·판매 실행 없음.' % (len(listings), len(markets)),
        results=listings, marketHistory=markets)


def cmd_build(args):
    dump = json.loads(io.open(args.dump, encoding='utf-8').read())
    run = build(dump, args.account, args.character, args.lost or (), args.note)
    # 같은 날 같은 캐릭터로 한 번 더 돌리면 --part b 처럼 붙여 앞 회차 파일을 덮지 않는다.
    part = ('-' + args.part) if args.part else ''
    out = DATA / ('collection-%s-account%d%s.json' % (run['date'], args.account, part))
    if out.exists() and not args.force:
        raise SystemExit('이미 있다: %s (덮으려면 --force)' % out.name)
    out.write_text(json.dumps(run, ensure_ascii=False, indent=2), encoding='utf-8')
    print('%s · 매물 %d · 시세 %d · 못 찾음 %d · 허비 %d · %s' % (
        out.name, len(run['results']), len(run['marketHistory']), len(run['unsearched']),
        len(run['lostSearches']), ' + '.join('%s %d회' % (s['kstDate'], s['searches']) for s in run['segments'])))


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest='cmd', required=True)
    q = sub.add_parser('queue'); q.add_argument('--date'); q.set_defaults(fn=cmd_queue)
    b = sub.add_parser('build'); b.add_argument('dump')
    b.add_argument('--account', type=int, required=True); b.add_argument('--character', required=True)
    b.add_argument('--lost', action='append'); b.add_argument('--note'); b.add_argument('--force', action='store_true')
    b.add_argument('--part', default='')
    b.set_defaults(fn=cmd_build)
    args = parser.parse_args()
    args.fn(args)


if __name__ == '__main__':
    main()
