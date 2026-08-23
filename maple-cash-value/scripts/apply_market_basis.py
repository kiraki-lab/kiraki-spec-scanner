# -*- coding: utf-8 -*-
"""체결 내역에서 채택용 시세(`marketPriceMeso`)를 계산해 넣는다.

기준: **최근 체결가와 최근 3건 중앙값 중 높은 쪽.**

- 최근 체결가 하나만 쓰면 단발 저가에 끌려간다.
- 최근 3건 중앙값만 쓰면 오르는 품목에서 뒤처진다. 빅풋 슈트가 8월에 3배 오르는
  동안 중앙값은 3.67억에 머물렀지만 실제 최근 체결과 매물은 5.19/5.20억이었다.
- 둘 중 높은 쪽을 쓰면 상승은 따라가고 단발 저가는 막힌다. 고가 이상치는
  채택 단계의 `min(시세, 매물)` 이 막아 준다.

체결 내역이 없는 행은 과거의 `marketHistoryMaxMeso` 를 legacyMax 로 표시해 둔다.
그 값은 최근 3개월 최고가라 판매가로는 과대평가이고, 검증 큐 위쪽으로 올라간다.

사용: python scripts/apply_market_basis.py
"""
import json, os, statistics

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(BASE, 'data')
PRICES = os.path.join(DATA, 'auction-prices.json')
MEDIAN_WINDOW = 3


def nk(s):
    return ''.join((s or '').split())


def load_sales():
    """컬렉션 파일에 쌓인 체결 내역을 품목별로 모은다. 최신 회차가 이긴다."""
    out = {}
    for fn in sorted(os.listdir(DATA)):
        if not (fn.startswith('collection-') and fn.endswith('.json')):
            continue
        doc = json.load(open(os.path.join(DATA, fn), encoding='utf-8'))
        for mh in (doc.get('marketHistory') or []):
            sales = [s for s in (mh.get('sales') or []) if s.get('price')]
            if not sales:
                continue
            out[nk(mh.get('itemName') or mh.get('name'))] = sales
    return out


def adopt(sales):
    latest = sales[0]
    med = int(statistics.median([s['price'] for s in sales[:MEDIAN_WINDOW]]))
    value = max(latest['price'], med)
    return value, latest, med


def main():
    doc = json.load(open(PRICES, encoding='utf-8'))
    sales_by = load_sales()
    moved, legacy, none = 0, 0, 0

    for row in doc['prices']:
        sales = sales_by.get(nk(row['itemName']))
        if sales:
            value, latest, med = adopt(sales)
            row['marketPriceMeso'] = value
            row['marketPriceBasis'] = 'recentSale'
            row['marketPriceAt'] = latest.get('date')
            row['marketPriceFrom'] = {
                'latestMeso': latest['price'],
                'latestDate': latest.get('date'),
                'median%dMeso' % MEDIAN_WINDOW: med,
                'sampleCount': len(sales),
                'observedMaxMeso': max(s['price'] for s in sales),
            }
            moved += 1
            continue

        legacy_max = row.get('marketHistoryMaxMeso') or row.get('marketHistoryObservedMaxMeso') or 0
        if legacy_max:
            row['marketPriceMeso'] = legacy_max
            row['marketPriceBasis'] = 'legacyMax'
            row['marketPriceAt'] = (row.get('marketHistoryCollectedAt') or '')[:10] or None
            row['marketPriceFrom'] = {'note': '최근 3개월 최고 체결가 · 체결 내역 미확보 · 과대평가 가능'}
            legacy += 1
        else:
            for k in ('marketPriceMeso', 'marketPriceBasis', 'marketPriceAt', 'marketPriceFrom'):
                row.pop(k, None)
            none += 1

    doc['marketPricePolicy'] = {
        'adoptedBasis': 'recentSale',
        'rule': '최근 체결가와 최근 %d건 중앙값 중 높은 쪽' % MEDIAN_WINDOW,
        'fallback': 'legacyMax · 체결 내역을 뜨는 대로 교체',
        'rationale': '3개월 최고 체결가는 파는 사람이 도달할 수 없는 값이라 판매가 추정에 맞지 않는다. '
                     '고가 이상치는 채택 단계의 min(시세, 매물)이 막는다.',
        'documentedIn': 'PRICE_VERIFICATION.md',
    }
    json.dump(doc, open(PRICES, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('recentSale %d · legacyMax %d · 시세 축 없음 %d' % (moved, legacy, none))


if __name__ == '__main__':
    main()
