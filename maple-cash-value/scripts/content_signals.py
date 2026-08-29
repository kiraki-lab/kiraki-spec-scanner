# -*- coding: utf-8 -*-
"""회차 데이터에서 '오늘 영상거리가 있는가'를 뽑는다.

매일 갱신하는 값은 속보성이다. 주 1회면 놓치는 것이 타이밍뿐이므로,
매일 돌리는 것을 정당화하려면 그날 잡히는 신호를 실제로 써야 한다.

신호 세 가지:
  1. 판매 종료 임박  — 남은 날짜가 짧고 순위표에 있는 상품
  2. 급등·급락       — 체결 내역으로 본 2주 이상 변화
  3. 신규 판매 개시   — 최근에 시작된 상품

가격을 바꾸지 않는다. 읽기만 한다.

사용: python scripts/content_signals.py [기준일]
"""
import json, os, sys
from datetime import date, datetime, timedelta

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, 'data')
OUT = os.path.join(DATA, 'content-signals.json')

ENDING_SOON_DAYS = 14      # 종료까지 이 안쪽이면 신호
NEW_WITHIN_DAYS = 7        # 이 안에 시작했으면 신규
MOVE_PCT = 50              # 체결 기준 이만큼 움직였으면 신호
MOVE_MIN_SAMPLES = 4
MOVE_MIN_SPAN_DAYS = 10    # 이보다 짧은 구간의 변화는 노이즈로 본다


def nk(s):
    return ''.join((s or '').split())


def parse_day(v):
    if not v:
        return None
    try:
        return datetime.fromisoformat(str(v).replace('Z', '+00:00')).date()
    except ValueError:
        try:
            return datetime.strptime(str(v)[:10], '%Y-%m-%d').date()
        except ValueError:
            return None


def latest_collection():
    best = None
    for fn in sorted(os.listdir(DATA)):
        if fn.startswith('collection-') and fn.endswith('.json'):
            best = fn
    return json.load(open(os.path.join(DATA, best), encoding='utf-8')), best


def main():
    today = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date.today()
    items = json.load(open(os.path.join(DATA, 'items.json'), encoding='utf-8'))['items']
    audit_path = os.path.join(DATA, 'price-audit.json')
    audit = json.load(open(audit_path, encoding='utf-8')) if os.path.exists(audit_path) else {}
    rank = {p['name']: p['rank'] for p in (audit.get('approxRanking') or [])}
    coll, coll_name = latest_collection()

    # --- 1. 판매 종료 임박 / 신규 ---
    ending, new_items = [], []
    for it in items:
        a = it.get('availability') or {}
        end, start = parse_day(a.get('endAt')), parse_day(a.get('startAt'))
        if end and 0 <= (end - today).days <= ENDING_SOON_DAYS:
            ending.append({'name': it['name'], 'endAt': end.isoformat(),
                           'daysLeft': (end - today).days,
                           'cashPrice': it.get('cashPrice'),
                           'rank': rank.get(it['name'])})
        if start and 0 <= (today - start).days <= NEW_WITHIN_DAYS:
            new_items.append({'name': it['name'], 'startAt': start.isoformat(),
                              'daysSince': (today - start).days,
                              'cashPrice': it.get('cashPrice'),
                              'rank': rank.get(it['name'])})
    ending.sort(key=lambda x: x['daysLeft'])

    # --- 2. 체결 기준 급등·급락 ---
    # 구성품 -> 그 구성품을 쓰는 상품
    owners = {}
    for it in items:
        for c in (it.get('components') or []):
            owners.setdefault(nk(c.get('name')), []).append(it['name'])

    moves = []
    for m in (coll.get('marketHistory') or []):
        s = [x for x in (m.get('sales') or []) if x.get('price')]
        if len(s) < MOVE_MIN_SAMPLES:
            continue
        d_new, d_old = parse_day(s[0]['date']), parse_day(s[-1]['date'])
        if not d_new or not d_old or (d_new - d_old).days < MOVE_MIN_SPAN_DAYS:
            continue
        pct = (s[0]['price'] / s[-1]['price'] - 1) * 100
        if abs(pct) < MOVE_PCT:
            continue
        used = owners.get(nk(m['itemName']), [])
        moves.append({
            'itemName': m['itemName'], 'changePct': round(pct),
            'fromDate': s[-1]['date'], 'fromMeso': s[-1]['price'],
            'toDate': s[0]['date'], 'toMeso': s[0]['price'],
            'spanDays': (d_new - d_old).days,
            'usedBy': used[:3],
            'bestRank': min([rank[u] for u in used if u in rank], default=None),
        })
    moves.sort(key=lambda x: -abs(x['changePct']))

    out = {
        'generatedAt': datetime.now().isoformat(timespec='seconds'),
        'baseDate': today.isoformat(),
        'source': coll_name,
        'thresholds': {'endingSoonDays': ENDING_SOON_DAYS, 'newWithinDays': NEW_WITHIN_DAYS,
                       'movePct': MOVE_PCT, 'minSpanDays': MOVE_MIN_SPAN_DAYS},
        'endingSoon': ending, 'newlyListed': new_items, 'bigMoves': moves,
        'hasStory': bool(ending or new_items or moves),
    }
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    print('기준일 %s · 출처 %s' % (today, coll_name))
    print()
    print('[판매 종료 임박 %d]' % len(ending))
    for e in ending:
        print('  D-%-3d %-28s %s원  %s'
              % (e['daysLeft'], e['name'][:28], format(e['cashPrice'] or 0, ','),
                 ('%d위' % e['rank']) if e['rank'] else '순위 밖'))
    print()
    print('[신규 판매 %d]' % len(new_items))
    for n in new_items:
        print('  +%-2d일 %-28s %s원' % (n['daysSince'], n['name'][:28],
                                      format(n['cashPrice'] or 0, ',')))
    print()
    print('[급등·급락 %d]  (체결 기준 %d일 이상 구간, %d%% 이상)'
          % (len(moves), MOVE_MIN_SPAN_DAYS, MOVE_PCT))
    for m in moves[:12]:
        used = m['usedBy'][0] if m['usedBy'] else '단독'
        print('  %+5d%%  %-22s %s→%s  %s'
              % (m['changePct'], m['itemName'][:22], m['fromDate'][5:], m['toDate'][5:], used))
    print()
    print('->', OUT)


if __name__ == '__main__':
    main()
