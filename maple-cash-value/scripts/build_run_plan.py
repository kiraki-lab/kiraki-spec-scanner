# -*- coding: utf-8 -*-
"""감사 결과를 그날 돌릴 회차 계획으로 자른다.

`price_audit.py` 가 만든 검증 큐는 '무엇을 봐야 하는가'까지만 말한다.
경매장 검색은 캐릭터당 하루 100회이므로, 그중 어디까지 오늘 할 수 있는지를
정해 주는 것이 이 스크립트다. 가격을 바꾸지 않는다.

회차마다 손으로 큐를 조립하다 스크래치패드가 지워지면 처음부터 다시 만들어야
했다(08-30, 09-20에 실제로 겪음). ROADMAP 2.3.

사용:
    python scripts/build_run_plan.py                     # 오늘, 100회 한 계정
    python scripts/build_run_plan.py 2026-09-21 --budget 100 --accounts 2
    python scripts/build_run_plan.py --tsv               # 러너에 붙여 넣을 목록만
"""
import json, os, sys
from datetime import date, datetime

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT = os.path.join(BASE, 'data', 'price-audit.json')
CHECKS = os.path.join(BASE, 'data', 'check-queue.json')

AXIS_LABEL = {'listing': '매물', 'market': '시세'}


def parse_args(argv):
    opts = {'date': None, 'budget': 100, 'accounts': 1, 'tsv': False, 'sample': 5}
    rest = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == '--budget':
            i += 1; opts['budget'] = int(argv[i])
        elif a == '--accounts':
            i += 1; opts['accounts'] = int(argv[i])
        elif a == '--sample':
            i += 1; opts['sample'] = int(argv[i])
        elif a == '--tsv':
            opts['tsv'] = True
        else:
            rest.append(a)
        i += 1
    if rest:
        opts['date'] = rest[0]
    return opts


def main():
    o = parse_args(sys.argv[1:])
    audit = json.load(open(AUDIT, encoding='utf-8'))
    base = o['date'] or audit.get('baseDate') or date.today().isoformat()
    if audit.get('baseDate') != base:
        print('※ 감사 기준일(%s)과 계획 기준일(%s)이 다르다. price_audit.py 를 먼저 돌려라.'
              % (audit.get('baseDate'), base), file=sys.stderr)

    queue = audit.get('verificationQueue') or []
    total = o['budget'] * o['accounts']

    # 계산기에 아직 없는 품목의 거래 가능 여부 확인. 감사 큐보다 먼저 본다 —
    # 거래되는 품목이 빠져 있으면 순위표 자체가 틀린 것이고, 한 번 확인하면 끝난다.
    checks = []
    if os.path.exists(CHECKS):
        checks = [c for c in json.load(open(CHECKS, encoding='utf-8'))['items']
                  if c.get('status') == 'pending']

    # 큐 순서 그대로 걷는다. 한 품목의 두 축은 붙여 둔다 — 같은 화면에서
    # 매물 탭과 시세 탭을 이어 보는 것이 탭 전환보다 싸다.
    dormant_pool = audit.get('dormantRows') or []
    reserve = min(o['sample'], len(dormant_pool))   # 휴면 표본 자리를 먼저 뗀다
    rotation_cap = max(0, total - reserve)

    plan, used = [], 0
    for c in checks:
        if used >= total:
            break
        used += 1
        plan.append({
            'searchIndex': used,
            'account': (used - 1) // o['budget'] + 1,
            'itemName': c['name'],
            'axis': c.get('axis', 'listing'),
            'grade': '-',
            'topRank': None,
            'band': '거래 확인',
            'reason': c.get('reason', '거래 가능 여부 미확인'),
            'bootstrap': False,
            'newItem': True,
        })

    for q in queue:
        axes = q.get('axes') or ['listing']
        if used + len(axes) > rotation_cap:
            continue                      # 다음 품목이 더 작으면 들어갈 수 있다
        for axis in axes:
            used += 1
            plan.append({
                'searchIndex': used,
                'account': (used - 1) // o['budget'] + 1,
                'itemName': q['itemName'],
                'axis': axis,
                'grade': q['grade'],
                'topRank': q.get('topRank'),
                'band': q.get('band'),
                'reason': q['reason'],
                'bootstrap': q.get('bootstrap', False),
                'newItem': False,
            })

    # 81위 이하도 가장 오래된 것부터 몇 건씩은 본다. 영영 안 보면 값이 올라도
    # 순위로 올라올 수가 없어서, 낮은 순위가 스스로를 가두게 된다.
    sampled = 0
    for d in dormant_pool:
        if sampled >= o['sample'] or used >= total:
            break
        used += 1; sampled += 1
        plan.append({
            'searchIndex': used,
            'account': (used - 1) // o['budget'] + 1,
            'itemName': d['itemName'], 'axis': 'listing',
            'grade': d.get('grade', '-'), 'topRank': d.get('topRank'),
            'band': '휴면 표본',
            'reason': '%s일째 · 81위 이하 표본' % d.get('ageDays'),
            'bootstrap': False, 'newItem': False,
        })

    left = [q for q in queue if not any(p['itemName'] == q['itemName'] for p in plan)]
    out = {
        'generatedAt': datetime.now().isoformat(timespec='seconds'),
        'baseDate': base,
        'budgetPerAccount': o['budget'], 'accounts': o['accounts'],
        'plannedSearches': used, 'queueSize': len(queue),
        'tradabilityChecks': len(checks), 'dormantSamples': sampled,
        'carriedOver': len(left),
        'daysToDrain': round(len(queue) and
                             (audit.get('queueSummary', {}).get('searchesNeeded', used) / total), 1),
        'searches': plan,
        'note': '가격을 바꾸지 않는 계획 파일이다. 회차 결과는 collection-<날짜>.json 에 쓴다.',
    }
    path = os.path.join(BASE, 'data', 'run-plan-%s.json' % base)
    json.dump(out, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    if o['tsv']:
        for p in plan:
            print('%d\t%s\t%s' % (p['searchIndex'], p['itemName'], p['axis']))
        return

    print('기준일 %s · 예산 %d회 x %d계정 = %d회' % (base, o['budget'], o['accounts'], total))
    print('큐 %d행 · 이번 회차 %d회 배정 · 다음으로 넘길 품목 %d개'
          % (len(queue), used, len(left)))
    print('큐를 다 비우는 데 %.1f 회차' % out['daysToDrain'])
    print()
    for acct in range(1, o['accounts'] + 1):
        rows = [p for p in plan if p['account'] == acct]
        if not rows:
            continue
        print('[계정 %d] %d회' % (acct, len(rows)))
        for p in rows[:60]:
            mark = '+' if p.get('newItem') else ('*' if p['bootstrap'] else ' ')
            rank = ('%3d위' % p['topRank']) if p['topRank'] else '  -  '
            print('  %3d %s%-26s %s %s %-8s %s'
                  % (p['searchIndex'], mark, p['itemName'][:26], p['grade'], rank,
                     p['band'], AXIS_LABEL[p['axis']]))
        if len(rows) > 60:
            print('  ... %d회 더' % (len(rows) - 60))
        print()
    print('->', path)


if __name__ == '__main__':
    main()
