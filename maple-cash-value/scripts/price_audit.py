# -*- coding: utf-8 -*-
"""가격 신뢰 등급과 검증 우선순위를 계산한다.

`data/auction-prices.json` 을 읽어 각 행에 신선도·교차검증 상태를 매기고,
다음 회차에서 어떤 품목을 먼저 검증해야 하는지 큐를 만들어
`data/price-audit.json` 으로 저장한다. 원본 가격은 건드리지 않는다.

규칙 정본은 `PRICE_VERIFICATION.md`.

사용:
    python scripts/price_audit.py            # 오늘 기준으로 감사
    python scripts/price_audit.py 2026-08-23 # 기준일 지정
"""
import json, os, sys
from datetime import date, datetime, timezone

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRICES = os.path.join(BASE, 'data', 'auction-prices.json')
ITEMS = os.path.join(BASE, 'data', 'items.json')
OUT = os.path.join(BASE, 'data', 'price-audit.json')

# --- 임계값 (PRICE_VERIFICATION.md 와 같이 움직여야 한다) ---
FRESH_DAYS = 3        # 이 안쪽이면 신선
STALE_DAYS = 14       # 이 바깥이면 낡음
THIN_LISTINGS = 2     # 이하이면 저매물 (단독 근거로 쓰지 않는다)
GAP_OK = 30           # 두 근거 괴리 허용 (%)
GAP_WARN = 60
SPIKE_UP = 2.0        # 직전 대비 이 배수 이상이면 급변
SPIKE_DOWN = 0.5      # 이 배수 이하도 급변 (하락도 대칭으로 본다)
TOP_RANK_GUARD = 20   # 상위 몇 위까지를 게이트 대상으로 볼지


def parse_day(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00')).date()
    except ValueError:
        try:
            return datetime.strptime(str(value)[:10], '%Y-%m-%d').date()
        except ValueError:
            return None


def age_days(value, today):
    d = parse_day(value)
    return None if d is None else (today - d).days


def grade_row(row, today):
    """한 행의 신뢰 등급과 채택 근거를 정한다."""
    listing = row.get('listingLowestMeso') or 0
    market = (row.get('marketPriceMeso') or row.get('marketHistoryMaxMeso')
              or row.get('marketHistoryObservedMaxMeso') or 0)
    basis = row.get('marketPriceBasis') or ('legacyMax' if market else '')
    l_age = age_days(row.get('updatedAt') or row.get('collectedAt'), today)
    m_age = age_days(row.get('marketPriceAt') or row.get('marketHistoryCollectedAt'), today)
    count = row.get('resultCount') or 0
    status = row.get('status') or ''

    info = {
        'itemName': row['itemName'],
        'listingMeso': listing,
        'marketMeso': market,
        'listingAgeDays': l_age,
        'marketAgeDays': m_age,
        'resultCount': count,
        'status': status,
        'marketBasis': basis,
    }

    if status == 'uncaptured':
        info.update(grade='F', basis='none', reason='정확일치 미포착 · 값 미확인')
        return info
    if not listing and not market:
        info.update(grade='F', basis='none',
                    reason='매물·시세 근거 모두 없음' if status != 'no_listing' else '매물 0건 · 시세 없음')
        return info

    l_fresh = l_age is not None and l_age <= FRESH_DAYS
    l_stale = l_age is None or l_age > STALE_DAYS
    m_fresh = m_age is not None and m_age <= FRESH_DAYS
    m_stale = m_age is None or m_age > STALE_DAYS

    gap = None
    if listing and market:
        gap = abs(listing - market) / max(listing, market) * 100

    # 채택 근거: 낡은 값은 후보에서 뺀 뒤, 남은 것 중 낮은 쪽
    candidates = []
    if listing and not l_stale:
        candidates.append(('listing', listing))
    if market and not m_stale and basis != 'legacyMax':
        candidates.append(('market', market))
    if not candidates:
        basis, adopted = ('listing', listing) if listing else ('market', market)
        info.update(grade='D', basis=basis, adoptedMeso=adopted, gapRate=gap,
                    reason='근거가 모두 %d일 초과로 낡음' % STALE_DAYS)
        return info

    basis, adopted = min(candidates, key=lambda c: c[1])  # basis: 'listing' | 'market'

    # 저매물 단독 근거는 이상치 위험이 크다
    thin = basis == 'listing' and 0 < count <= THIN_LISTINGS and not market

    if thin:
        info.update(grade='D', basis=basis, adoptedMeso=adopted, gapRate=gap,
                    reason='매물 %d건 단독 근거 · 이상치 위험' % count)
    elif l_fresh and m_fresh and gap is not None and gap <= GAP_OK:
        info.update(grade='A', basis=basis, adoptedMeso=adopted, gapRate=gap,
                    reason='매물·시세 모두 최신이고 괴리 %d%% 이내' % GAP_OK)
    elif len(candidates) == 2 and gap is not None and gap <= GAP_WARN:
        info.update(grade='B', basis=basis, adoptedMeso=adopted, gapRate=gap,
                    reason='두 근거가 유효 · 괴리 %d%% 이내' % GAP_WARN)
    elif len(candidates) == 2:
        info.update(grade='C', basis=basis, adoptedMeso=adopted, gapRate=gap,
                    reason='두 근거의 괴리가 %d%% 초과' % GAP_WARN)
    elif market and row.get('marketPriceBasis') == 'legacyMax':
        info.update(grade='C', basis=basis, adoptedMeso=adopted, gapRate=gap,
                    reason='시세가 legacyMax(3개월 최고가) · 체결 내역 재조회 필요')
    else:
        info.update(grade='C', basis=basis, adoptedMeso=adopted, gapRate=gap,
                    reason='교차검증 없음 · %s 단독' % ('매물' if basis == 'listing' else '시세'))
    return info


def detect_spike(row):
    """직전 확인가 대비 급변을 잡는다. 상승·하락 모두 본다."""
    prev = row.get('previousListingLowestMeso') or row.get('lastKnownListingMeso')
    cur = row.get('listingLowestMeso') or 0
    if not prev or not cur:
        return None
    ratio = cur / prev
    if ratio >= SPIKE_UP:
        return {'direction': 'up', 'ratio': round(ratio, 2)}
    if ratio <= SPIKE_DOWN:
        return {'direction': 'down', 'ratio': round(ratio, 2)}
    return None


def component_owner_map(items):
    """구성품 -> 그 구성품을 쓰는 상품 목록."""
    owners = {}
    for it in items:
        for c in (it.get('components') or []):
            name = c.get('name') if isinstance(c, dict) else c
            owners.setdefault(''.join((name or '').split()), []).append(it['name'])
    return owners


def approx_ranking(items, by_key, settings):
    """상품별 대략적인 '1억당 현금'을 계산해 순위를 매긴다.

    계산기 본식(마일리지·수수료)을 그대로 옮기지는 않는다. 어떤 행이 순위표
    위쪽을 떠받치고 있는지 가려내기 위한 근사이므로, 판매가와 현금가의 비만 본다.
    """
    discount = 1 - (settings.get('discountRate') or 0) / 100
    ranked = []
    for it in items:
        comps = it.get('components') or []
        if comps:
            total, missing = 0, False
            for c in comps:
                g = by_key.get(''.join((c.get('name') or '').split()))
                v = (g or {}).get('adoptedMeso') or 0
                if not v:
                    missing = True
                total += v * (c.get('quantity') or 1)
            value, feeds = total, [c.get('name') for c in comps]
        else:
            g = by_key.get(''.join(it['name'].split()))
            value = (g or {}).get('adoptedMeso') or 0
            missing = not value
            feeds = [it['name']]
        if not value:
            continue
        cash = (it.get('cashPrice') or 0) * discount
        ranked.append({'name': it['name'], 'wonPerEok': cash / (value / 1e8),
                       'feeds': feeds, 'incomplete': missing})
    ranked.sort(key=lambda r: r['wonPerEok'])
    for i, r in enumerate(ranked, 1):
        r['rank'] = i
    return ranked


def main():
    today = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date.today()
    doc = json.load(open(PRICES, encoding='utf-8'))
    items = json.load(open(ITEMS, encoding='utf-8'))['items']
    owners = component_owner_map(items)

    graded = [grade_row(r, today) for r in doc['prices']]
    by_key = {''.join(g['itemName'].split()): g for g in graded}
    for r in doc['prices']:
        g = by_key.get(''.join(r['itemName'].split()))
        for a in r.get('aliases') or []:
            by_key.setdefault(''.join(a.split()), g)

    settings = json.load(open(ITEMS, encoding='utf-8'))['settings']
    ranked = approx_ranking(items, by_key, settings)

    # 각 행이 떠받치는 상품 중 가장 높은 순위
    best_rank = {}
    for p in ranked:
        for f in p['feeds']:
            k = ''.join((f or '').split())
            if k not in best_rank or p['rank'] < best_rank[k][0]:
                best_rank[k] = (p['rank'], p['name'])

    flags = {f['itemName']: f for f in (doc.get('lastSearchRun', {}).get('pendingHistoryItems') or [])}

    # 우선순위: 순위표 위쪽을 떠받치는 낮은 등급부터. 급변 플래그는 가산.
    order = {'F': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4}
    queue = []
    for g in graded:
        if g['grade'] in ('A', 'B'):
            continue
        key = ''.join(g['itemName'].split())
        used_by = owners.get(key, [])
        rank, via = best_rank.get(key, (None, None))

        if rank is None:
            rank_score = 0
        elif rank <= TOP_RANK_GUARD:
            rank_score = 100 - rank * 2          # 상위 20위는 압도적으로 우선
        elif rank <= 40:
            rank_score = 40 - (rank - 20)
        else:
            rank_score = max(0, 20 - (rank - 40) // 5)

        score = rank_score + (5 - order[g['grade']]) * 6 + len(used_by) * 2
        if g['itemName'] in flags:
            score += 15
        queue.append({
            'itemName': g['itemName'],
            'grade': g['grade'],
            'reason': g['reason'],
            'topRank': rank,
            'topRankVia': via,
            'usedByCount': len(used_by),
            'usedBy': used_by[:5],
            'flagged': g['itemName'] in flags,
            'score': score,
            'checkType': 'market' if g.get('listingMeso') else 'listing',
        })
    queue.sort(key=lambda q: (-q['score'], q['itemName']))

    dist = {}
    for g in graded:
        dist[g['grade']] = dist.get(g['grade'], 0) + 1

    out = {
        'generatedAt': datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z'),
        'baseDate': today.isoformat(),
        'thresholds': {
            'freshDays': FRESH_DAYS, 'staleDays': STALE_DAYS,
            'thinListings': THIN_LISTINGS, 'gapOk': GAP_OK, 'gapWarn': GAP_WARN,
            'spikeUp': SPIKE_UP, 'spikeDown': SPIKE_DOWN,
        },
        'gradeDistribution': dist,
        'approxRanking': ranked[:40],
        'rows': graded,
        'verificationQueue': queue,
        'note': '규칙 정본은 PRICE_VERIFICATION.md. 이 파일은 가격을 바꾸지 않는 감사 결과다.',
    }
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    print('기준일', today, '· 총', len(graded), '행')
    for g in ['A', 'B', 'C', 'D', 'F']:
        n = dist.get(g, 0)
        print('  등급 %s : %4d (%.0f%%)' % (g, n, n / len(graded) * 100))
    print()
    guard = [q for q in queue if q['topRank'] and q['topRank'] <= TOP_RANK_GUARD]
    print('상위 %d위 안에서 등급 C 이하인 행: %d' % (TOP_RANK_GUARD, len(guard)))
    print()
    print('검증 큐 상위 25 (총 %d):' % len(queue))
    for q in queue[:25]:
        mark = '!' if q['flagged'] else ' '
        rank = ('%3d위' % q['topRank']) if q['topRank'] else '  -  '
        print('  %s%-24s %s %s  %-30s %s'
              % (mark, q['itemName'][:24], q['grade'], rank, q['reason'][:30], q['checkType']))
    print()
    print('->', OUT)


if __name__ == '__main__':
    main()
