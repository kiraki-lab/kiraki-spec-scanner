# -*- coding: utf-8 -*-
"""주기 판매 컬렉션에 새 회차를 붙인다.

직업·보스 패키지는 3개월 팔고 3개월 쉬는 컬렉션으로 나온다. 다음 회차가 캐시샵
공지에 뜨면 상품 100여 개를 하나씩 고치지 말고 이 스크립트로 회차만 추가한다.
상품은 items.json 에서 "collection": <id> 로 컬렉션을 가리키므로 그대로 따라온다.

기본은 미리보기다. 확인한 뒤 --apply 를 붙여야 파일이 바뀐다.

사용:
    python scripts/add_collection_run.py --list
    python scripts/add_collection_run.py illust-adventurer \\
        --start 2026-12-17T10:00 --end 2027-03-17T23:59 --notice 660 \\
        --title "전 직업 일러스트 컬렉션 : 모험가"            # 미리보기
    python scripts/add_collection_run.py ... --apply                # 실제 반영

전 직업 일러스트 컬렉션은 공지가 그룹별로 다섯 개 나오므로 다섯 번 돌린다.

시각은 KST 로 적는다. 오프셋을 안 붙이면 +09:00 을 붙인다.
"""
import io, json, os, sys
from datetime import datetime

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from price_audit import window_bound, window_span, INVALID  # noqa: E402  같은 해석 규칙을 쓴다

COLLECTIONS = os.path.join(BASE, 'data', 'collections.json')
ITEMS = os.path.join(BASE, 'data', 'items.json')
NOTICE_URL = 'https://maplestory.nexon.com/News/CashShop/Sale/%d'


def kst(value):
    """'2026-12-17T10:00' 처럼 적으면 초와 +09:00 을 붙인다. 판정은 price_audit 규칙으로."""
    v = value.strip()
    if len(v) == 16:
        v += ':00'
    if len(v) == 19:
        v += '+09:00'
    b = window_bound(v)
    if b is None or b is INVALID:
        sys.exit('시각을 읽을 수 없다: %s  (예: 2026-12-17T10:00)' % value)
    return v, b


def opt(argv, flag, default=None):
    return argv[argv.index(flag) + 1] if flag in argv else default


def main():
    argv = sys.argv[1:]
    doc = json.load(io.open(COLLECTIONS, encoding='utf-8'))
    cs = doc['collections']
    items = json.load(io.open(ITEMS, encoding='utf-8'))['items']
    members = {}
    for it in items:
        if it.get('collection'):
            members.setdefault(it['collection'], []).append(it['name'])

    if '--list' in argv or not argv:
        print('%-28s %4s  %s' % ('컬렉션', '상품', '마지막 회차'))
        for cid, c in cs.items():
            last = (c.get('runs') or [{}])[-1]
            print('%-28s %4d  %s ~ %s  (공지 %s)' % (
                cid, len(members.get(cid, [])), (last.get('startAt') or '')[:16],
                (last.get('endAt') or '')[:16], last.get('notice')))
        return

    cid = argv[0]
    if cid not in cs:
        sys.exit('없는 컬렉션: %s  (--list 로 확인)' % cid)
    start, sb = kst(opt(argv, '--start', ''))
    end, eb = kst(opt(argv, '--end', ''))
    if not sb < eb:
        sys.exit('시작이 끝보다 앞이어야 한다')
    notice = opt(argv, '--notice')
    if not (notice and notice.isdigit()):
        sys.exit('--notice 에 캐시샵 공지 번호를 적는다 (근거 없이 회차를 만들지 않는다)')
    notice = int(notice)

    runs = cs[cid].setdefault('runs', [])
    if not isinstance(runs, list):
        sys.exit('%s 의 runs 가 목록이 아니다. collections.json 을 먼저 고친다' % cid)
    # 공지 번호 중복은 회차를 읽을 수 있든 없든 먼저 본다.
    for r in runs:
        if isinstance(r, dict) and r.get('notice') == notice:
            sys.exit('같은 공지 번호의 회차가 이미 있다: %d' % notice)
    # 못 읽는 회차가 하나라도 있으면 겹침을 판단할 수 없으므로 손대지 않는다.
    for r in runs:
        span = window_span(r, True)
        if span is None:
            sys.exit('기존 회차를 읽을 수 없다: %r  collections.json 을 먼저 고친다' % (r,))
        rs, re_ = span
        if sb <= re_ and rs <= eb:
            sys.exit('기존 회차와 겹친다: %s ~ %s (공지 %s)' % (r['startAt'], r['endAt'], r.get('notice')))

    new = {'startAt': start, 'endAt': end, 'notice': notice,
           'title': opt(argv, '--title', cs[cid].get('name')),
           'sourceUrl': NOTICE_URL % notice}
    print('컬렉션 %s (%s)' % (cid, cs[cid].get('name')))
    print('  + 회차 %s ~ %s  공지 %d' % (start, end, notice))
    print('  이 회차로 판매 상태가 바뀌는 상품 %d개' % len(members.get(cid, [])))
    if '--apply' not in argv:
        print('\n미리보기다. 맞으면 --apply 를 붙여 다시 실행한다.')
        return
    runs.append(new)
    runs.sort(key=lambda r: r.get('startAt') or '')
    doc['updatedAt'] = datetime.now().astimezone().isoformat(timespec='seconds')
    io.open(COLLECTIONS, 'w', encoding='utf-8', newline='\n').write(
        json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    print('\n반영했다 -> %s' % COLLECTIONS)
    print('다음: python scripts/price_audit.py && node scripts/crosscheck_adoption.js')


if __name__ == '__main__':
    main()
