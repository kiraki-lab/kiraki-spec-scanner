"""Normalize UI collection checkpoints and merge only observed price evidence.

Usage: python scripts/merge_run.py data/collection-YYYY-MM-DD-account2.json
       Add --apply after inspecting the dry-run summary.
Date-only observations remain date-only (no invented precise timestamps).
"""
import argparse
import copy
import json
from pathlib import Path
from datetime import datetime, timezone
from apply_market_basis import adopt


def nk(value):
    return ''.join(value.split())


def normalize(run):
    rows = copy.deepcopy(run['results'])
    for history in run.get('marketHistory', []):
        rows.append(dict(itemName=history['itemName'], type='market',
                         searchIndex=history['searchIndex'], resultCount=history['resultCount'],
                         collectedAt=history['collectedAt'],
                         observationPrecision=history.get('observationPrecision'),
                         marketRecentSales=[dict(priceMeso=s['price'], date=s['date']) for s in history['sales']]))
    for row in run.get('listingCheckpoints', []):
        rows.append(dict(row, type='listing'))
    rows.extend(copy.deepcopy(run.get('additionalCheckpoints', [])))
    for key in ('pairCheckpoints', 'pairCheckpoints2', 'pairCheckpoints3', 'pairCheckpoints4'):
        for name, index, count, price, market_count, sales in run.get(key, []):
            rows.append(dict(itemName=name, type='listing', searchIndex=index,
                             resultCount=count, listingLowestMeso=price))
            rows.append(dict(itemName=name, type='market', searchIndex=index + 1,
                             resultCount=market_count,
                             marketRecentSales=[dict(priceMeso=p, date=d) for p, d in sales]))
    for name, index, count, sales in run.get('marketCheckpoints', []):
        rows.append(dict(itemName=name, type='market', searchIndex=index, resultCount=count,
                         marketRecentSales=[dict(priceMeso=p, date=d) for p, d in sales]))
    rows.sort(key=lambda row: row['searchIndex'])
    assert [r['searchIndex'] for r in rows] == list(range(1, run['usedSearches'] + 1))
    assert len({(nk(r['itemName']), r['type']) for r in rows}) == len(rows)
    for row in rows:
        row.setdefault('collectedAt', run['date'])
        if len(row['collectedAt']) == 10:
            row['observationPrecision'] = 'day'
            row['collectedAt'] += 'T00:00:00+09:00'
        row.update(searchAccount=run['searchAccount'], accountCharacter=run['accountCharacter'],
                   exactMatch=True, pagesScanned=1)
        if row['type'] == 'listing':
            assert (row['resultCount'] == 0) == (not row['listingLowestMeso'])
            row['status'] = 'ok' if row['resultCount'] else 'no_listing'
        else:
            sales = row['marketRecentSales']
            assert len(sales) == min(3, row['resultCount'])
            assert all(s['priceMeso'] > 0 for s in sales)
            assert [s['date'] for s in sales] == sorted([s['date'] for s in sales], reverse=True)
    return rows


def merge(original, run, rows):
    doc = copy.deepcopy(original)
    by_name = {nk(r['itemName']): r for r in doc['prices']}
    old_by_name = {nk(r['itemName']): r for r in original['prices']}
    markets = {nk(r['itemName']): r for r in rows if r['type'] == 'market'}
    pending = {nk(r['itemName']): r for r in original.get('lastSearchRun', {}).get('pendingHistoryItems', [])}
    price_changes = []
    for sample in rows:
        key = nk(sample['itemName'])
        row = by_name.get(key)
        if row is None:
            row = dict(itemName=sample['itemName'], query=sample['itemName'])
            if sample['itemName'] == '레프 일리움 윙':
                row.update(queueGroup='packageDeferred', aliases=[])
            doc['prices'].append(row)
            by_name[key] = row
        if sample.get('observationPrecision'):
            row['observationPrecision'] = sample['observationPrecision']
        if sample['type'] == 'listing':
            price = sample['listingLowestMeso'] or 0
            if not price and row.get('listingLowestMeso'):
                row.update(lastKnownListingMeso=row['listingLowestMeso'],
                           lastKnownListingText=row.get('listingLowestText'),
                           lastKnownListingAt=row.get('updatedAt') or row.get('collectedAt'))
            row.update(listingLowestMeso=price, listingLowestText=str(price) if price else None,
                       resultCount=sample['resultCount'], status=sample['status'],
                       collectedAt=sample['collectedAt'], updatedAt=sample['collectedAt'],
                       searchIndex=sample['searchIndex'], searchAccount=run['searchAccount'],
                       accountCharacter=run['accountCharacter'], filter='정확일치 · 개당 낮은 가격순')
            # Quantity/total were not captured; do not retain old lot metadata.
            row.pop('listingQuantity', None)
            row.pop('listingTotalMeso', None)
        else:
            sales = [dict(price=s['priceMeso'], date=s['date']) for s in sample['marketRecentSales']]
            value, latest, median = adopt(sales)
            row.update(marketPriceMeso=value, marketPriceBasis='recentSale', marketPriceAt=latest['date'],
                       marketPriceFrom=dict(latestMeso=latest['price'], latestDate=latest['date'],
                                            median3Meso=median, sampleCount=len(sales),
                                            observedMaxMeso=max(s['price'] for s in sales)),
                       marketHistoryStatus='verified', marketHistoryCollectedAt=sample['collectedAt'],
                       marketHistoryBasis='최근 체결가와 최근 3건 중앙값 중 높은 쪽',
                       marketHistorySaleCount=sample['resultCount'],
                       marketHistoryNote='최신 판매 시간순 · 개당 체결가 · 최근 3건 표본',
                       marketHistorySearchIndex=sample['searchIndex'])
            # Old three-month extrema are not extrema of today's last-three sample.
            for field in ('marketHistoryMaxMeso', 'marketHistoryMinMeso', 'marketHistoryObservedMaxMeso'):
                row.pop(field, None)
            pending.pop(key, None)
    for sample in rows:
        if sample['type'] != 'listing':
            continue
        key = nk(sample['itemName'])
        before = old_by_name.get(key, {}).get('listingLowestMeso') or 0
        after = sample['listingLowestMeso'] or 0
        if before and after:
            ratio = after / before
            if ratio >= 2 or ratio <= .5:
                price_changes.append(dict(itemName=sample['itemName'], previousMeso=before,
                                          newMeso=after, ratio=round(ratio, 4),
                                          sameRunMarketChecked=key in markets,
                                          status='cross_checked' if key in markets else 'pending_history'))
            if key not in markets and (ratio >= 1.5 or ratio <= .5):
                pending[key] = dict(itemName=sample['itemName'], previousMeso=before,
                                    newMeso=after, ratio=round(ratio, 4), resultCount=sample['resultCount'],
                                    reason='가격 급변 · 이번 회차 시세 미확인')
    now = datetime.now(timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    listing = [r for r in rows if r['type'] == 'listing']
    doc['generatedAt'] = now
    doc['lastSearchRun'] = dict(date=run['date'], searchLimit=100, totalSearches=len(rows),
        capturedSearches=len(rows), listingSearches=len(listing), marketHistorySearches=len(markets),
        okCount=sum(r['status'] == 'ok' for r in listing), noListingCount=sum(r['status'] == 'no_listing' for r in listing),
        uncapturedCount=0, lostSearches=[], accountComplete=True, dailyPriorityComplete=True,
        queueMode='daily_tradable_nonpackage_then_top_rank_two_axis', completedAt=now,
        pendingHistoryItems=list(pending.values()), priceChangeFlags=price_changes, unsearched=run.get('unsearched', []),
        accounts=[dict(searchAccount=run['searchAccount'], accountCharacter=run['accountCharacter'], screenSearches=len(rows))],
        segments=[dict(kstDate=run['date'], searches=len(rows))], crossedMidnight=False,
        note='비패키지 매물 우선 · 상위 구성품 양축 확인 · 날짜만 남은 관측은 일 단위로 기록. 전체 품목 검증 완료를 의미하지 않음.')
    touched = {nk(r['itemName']) for r in rows}
    assert all(by_name[k] == value for k, value in old_by_name.items() if k not in touched)
    return doc


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('collection', type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    run = json.loads(args.collection.read_text(encoding='utf-8'))
    rows = normalize(run)
    path = args.collection.parent / 'auction-prices.json'
    original = json.loads(path.read_text(encoding='utf-8'))
    doc = merge(original, run, rows)
    print(json.dumps(doc['lastSearchRun'], ensure_ascii=False, indent=2))
    if args.apply:
        backup = path.with_name('auction-prices.before-' + run['date'] + '.json')
        if backup.exists():
            raise RuntimeError('Backup exists: inspect before applying twice')
        backup.write_text(json.dumps(original, ensure_ascii=False, indent=2), encoding='utf-8')
        args.collection.with_suffix('.checkpoints.json').write_text(json.dumps(run, ensure_ascii=False, indent=2), encoding='utf-8')
        normalized = {k: v for k, v in run.items() if 'Checkpoint' not in k and k != 'results'}
        normalized.update(status='complete', results=[r for r in rows if r['type'] == 'listing'],
            marketHistory=[dict(itemName=r['itemName'], searchIndex=r['searchIndex'],
                                resultCount=r['resultCount'], collectedAt=r['collectedAt'],
                                sales=[dict(price=s['priceMeso'], date=s['date']) for s in r['marketRecentSales']])
                           for r in rows if r['type'] == 'market'])
        args.collection.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding='utf-8')
        path.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
