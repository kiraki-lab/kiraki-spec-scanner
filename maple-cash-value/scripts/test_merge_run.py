"""Small regression tests for observed zero-sales and partial-run safety."""
import copy
import unittest
from merge_run import merge, normalize


class MergeTests(unittest.TestCase):
    def test_zero_sales_preserves_prior_evidence_and_partial_state(self):
        original = {'prices': [dict(itemName='A', listingLowestMeso=100,
            marketPriceMeso=90, marketPriceAt='2026-09-01', marketPriceBasis='recentSale'),
            dict(itemName='untouched', listingLowestMeso=700)]}
        before = copy.deepcopy(original)
        run = dict(date='2026-09-28', searchAccount=1, accountCharacter='test',
            usedSearches=2, results=[
                dict(itemName='A', type='listing', searchIndex=1, resultCount=0, listingLowestMeso=0),
                dict(itemName='A', type='market', searchIndex=2, resultCount=0, marketRecentSales=[])])
        result = merge(original, run, normalize(run))
        row = result['prices'][0]
        self.assertEqual(row['lastKnownListingMeso'], 100)
        self.assertEqual(row['marketPriceMeso'], 90)
        self.assertEqual(row['marketHistoryStatus'], 'no_sales')
        self.assertEqual(result['prices'][1], original['prices'][1])
        self.assertEqual(original, before)
        self.assertFalse(result['lastSearchRun']['accountComplete'])
        self.assertFalse(result['lastSearchRun']['dailyPriorityComplete'])

    def test_new_group_and_explicit_completion(self):
        run = dict(date='2026-09-28', searchAccount=1, accountCharacter='test',
            usedSearches=1, accountComplete=True, dailyPriorityComplete=True,
            results=[dict(itemName='component', type='listing', searchIndex=1,
                resultCount=3, listingLowestMeso=10, queueGroup='packageDeferred')])
        result = merge({'prices': []}, run, normalize(run))
        self.assertEqual(result['prices'][0]['queueGroup'], 'packageDeferred')
        self.assertTrue(result['lastSearchRun']['accountComplete'])

    def test_lost_searches_and_midnight_segments(self):
        run = dict(date='2026-10-03', searchAccount=2, accountCharacter='test', usedSearches=2,
            screenSearches=3, lostSearches=[dict(itemName='A', axis='listing', reason='filter')],
            segments=[dict(kstDate='2026-10-02', searches=1), dict(kstDate='2026-10-03', searches=1)],
            results=[dict(itemName='A', type='listing', searchIndex=1, resultCount=2, listingLowestMeso=5),
                     dict(itemName='B', type='listing', searchIndex=2, resultCount=1, listingLowestMeso=7)])
        last = merge({'prices': []}, run, normalize(run))['lastSearchRun']
        self.assertEqual(last['totalSearches'], 3)
        self.assertEqual(last['capturedSearches'], 2)
        self.assertEqual(len(last['lostSearches']), 1)
        self.assertTrue(last['crossedMidnight'])
        self.assertEqual(sum(s['searches'] for s in last['segments']), 2)

    def test_zero_sales_does_not_verify_spike(self):
        # 매물이 2배 올랐는데 같은 회차 시세 조회가 0건. 교차검증된 것이 없다(코덱스 1005 v11).
        original = {'prices': [dict(itemName='A', listingLowestMeso=100)],
                    'lastSearchRun': {'pendingHistoryItems': [dict(itemName='B', reason='old')]}}
        run = dict(date='2026-10-05', searchAccount=1, accountCharacter='test', usedSearches=4, results=[
            dict(itemName='A', type='listing', searchIndex=1, resultCount=5, listingLowestMeso=200),
            dict(itemName='A', type='market', searchIndex=2, resultCount=0, marketRecentSales=[]),
            dict(itemName='B', type='market', searchIndex=3, resultCount=0, marketRecentSales=[]),
            dict(itemName='C', type='market', searchIndex=4, resultCount=1,
                 marketRecentSales=[dict(priceMeso=5, date='2026-10-05')])])
        last = merge(original, run, normalize(run))['lastSearchRun']
        self.assertEqual(last['priceChangeFlags'][0]['status'], 'pending_history')
        self.assertEqual(sorted(p['itemName'] for p in last['pendingHistoryItems']), ['A', 'B'])
        self.assertEqual(last['marketHistorySearches'], 3)

    def test_defaults_without_lost_or_segments(self):
        run = dict(date='2026-10-05', searchAccount=1, accountCharacter='test', usedSearches=1,
            results=[dict(itemName='A', type='listing', searchIndex=1, resultCount=2, listingLowestMeso=5)])
        last = merge({'prices': []}, run, normalize(run))['lastSearchRun']
        self.assertEqual(last['totalSearches'], 1)
        self.assertEqual(last['lostSearches'], [])
        self.assertFalse(last['crossedMidnight'])


if __name__ == '__main__':
    unittest.main()
