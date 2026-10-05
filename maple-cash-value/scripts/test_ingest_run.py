"""수집 결과 → 회차 파일 변환 검사."""
import unittest
from ingest_run import build, checksum
from merge_run import merge, normalize

L = lambda name, count, prices, at, game=None: [name, 'l', 'searched', count, 'PRICE_PER_ITEM_ASC', at, 0, 1,
                                                [[p, 1, 1] for p in prices], game]
M = lambda name, count, sales, at: [name, 'm', 'searched', count, 'TRADE_DATE_DESC', at, 0, 1, sales, None]


def dump(results, state='done'):
    return dict(character='t', state=state, checksum=checksum(results), results=results)


class IngestTests(unittest.TestCase):
    def test_midnight_lost_and_unsearched(self):
        results = [
            M('A', 500, [[30, '2026-10-02'], [20, '2026-10-02'], [25, '2026-10-01']], '2026-10-02T14:58:00.000Z'),
            L('A', 4, [10, 11, 12], '2026-10-02T15:00:01.000Z'),
            L('슈트(여)', 0, [], '2026-10-02T15:01:00.000Z', '슈트 (여)'),
            ['없는 것', 'l', 'no_autocomplete', None, None, '2026-09-30T15:30:00.000Z', 5, None, [], None],
        ]
        run = build(dump(results), 2, 'test', ['A:listing:필터'])
        self.assertEqual(run['date'], '2026-10-03')
        self.assertEqual([s['searches'] for s in run['segments']], [2, 2])   # 허비 1회는 첫날 몫
        self.assertEqual(sum(s['searches'] for s in run['segments']), run['screenSearches'])
        self.assertEqual((run['usedSearches'], run['screenSearches']), (3, 4))
        self.assertEqual(run['results'][1]['listingLowestMeso'], 0)
        self.assertEqual(run['results'][1]['gameName'], '슈트 (여)')
        self.assertEqual(run['unsearched'][0]['status'], 'unresolved')
        # 확인일은 변환한 날이 아니라 수집기가 본 날(KST)이다(코덱스 1005 v8)
        self.assertEqual((run['unsearched'][0]['checkedAt'], run['unsearched'][0]['nextCheckAt']), ('2026-10-01', '2026-10-08'))
        last = merge({'prices': []}, run, normalize(run))['lastSearchRun']
        self.assertEqual((last['totalSearches'], last['capturedSearches']), (4, 3))
        self.assertTrue(last['crossedMidnight'])
        self.assertEqual(last['noListingCount'], 1)
        self.assertTrue(last['accountComplete'])

    def test_stopped_run_is_not_complete(self):
        good = [L('A', 2, [10, 11], '2026-10-05T01:00:00.000Z')]
        for state in ('stopped:unexpected_result', 'stopped:not_triggered', 'stopped:error', 'stopped:cancelled'):
            run = build(dump(good, state=state), 1, 'test')
            self.assertFalse(run['accountComplete'], state)
            self.assertFalse(run['dailyPriorityComplete'], state)
            last = merge({'prices': []}, run, normalize(run))['lastSearchRun']
            self.assertFalse(last['accountComplete'], state)
        for state in ('running', 'waiting_reset', None, ''):
            with self.assertRaises(SystemExit, msg=state):
                build(dump(good, state=state), 1, 'test')

    def test_rejected_search_is_lost_not_evidence(self):
        # 분류 필터가 걸려 0건으로 나온 검색. 수집기가 rejected 로 남긴다(코덱스 1005 v2).
        results = [L('A', 2, [10, 11], '2026-10-05T01:00:00.000Z'),
                   ['쿠폰', 'l', 'rejected', 0, 'PRICE_PER_ITEM_ASC', '2026-10-05T01:01:00.000Z', 1, 2, [], None]]
        run = build(dump(results, state='stopped:unexpected_result'), 1, 'test')
        self.assertEqual([r['itemName'] for r in run['results']], ['A'])
        self.assertEqual((run['usedSearches'], run['screenSearches']), (1, 2))
        self.assertEqual(run['lostSearches'][0]['itemName'], '쿠폰')
        self.assertFalse(run['accountComplete'])
        original = {'prices': [dict(itemName='쿠폰', listingLowestMeso=500, status='ok')]}
        merged = merge(original, run, normalize(run))
        self.assertEqual(merged['prices'][0], original['prices'][0])

    def test_rejected_before_midnight_keeps_both_dates(self):
        # 자정 전에 버린 검색 하나, 자정 뒤에 얻은 값 하나. 두 날짜에 걸친 회차다(코덱스 1005 v4).
        results = [['쿠폰', 'l', 'rejected', 0, 'PRICE_PER_ITEM_ASC', '2026-10-02T14:59:00.000Z', 99, 100, [], None],
                   L('A', 2, [10, 11], '2026-10-02T15:00:30.000Z')]
        run = build(dump(results), 1, 'test', ['B:market:직접 눌렀다@2026-10-02'])
        self.assertEqual(run['date'], '2026-10-03')
        self.assertEqual([(s['kstDate'], s['searches']) for s in run['segments']], [('2026-10-02', 2), ('2026-10-03', 1)])
        self.assertEqual([l['kstDate'] for l in run['lostSearches']], ['2026-10-02', '2026-10-02'])
        last = merge({'prices': []}, run, normalize(run))['lastSearchRun']
        self.assertTrue(last['crossedMidnight'])
        self.assertEqual((last['totalSearches'], last['capturedSearches']), (3, 1))

    def test_zero_results_with_other_sort(self):
        # 체결 0건이면 시세 탭 정렬이 처음 그대로다. 그래도 '체결 없음'으로 병합돼야 한다(코덱스 1005 v10).
        results = [['A', 'm', 'searched', 0, 'PRICE_PER_ITEM_ASC', '2026-10-05T01:00:00.000Z', 0, 1, [], None],
                   ['A', 'l', 'searched', 0, None, '2026-10-05T01:01:00.000Z', 1, 2, [], None]]
        run = build(dump(results), 1, 'test')
        original = {'prices': [dict(itemName='A', listingLowestMeso=100, marketPriceMeso=90,
                                    marketPriceAt='2026-09-01', marketPriceBasis='recentSale')]}
        row = merge(original, run, normalize(run))['prices'][0]
        self.assertEqual((row['marketHistoryStatus'], row['marketPriceMeso'], row['status']), ('no_sales', 90, 'no_listing'))

    def test_rejects_bad_input(self):
        good = [L('A', 2, [10, 11], '2026-10-05T01:00:00.000Z')]
        tampered = dump(good); tampered['results'][0][8][0][0] = 9
        cases = {
            '검사합': tampered,
            '정렬': dump([[*good[0][:4], 'PRICE_ASC', *good[0][5:]]]),
            '오름차순 아님': dump([L('A', 2, [11, 10], '2026-10-05T01:00:00.000Z')]),
            '이름 다른 행': dump([['A', 'l', 'searched', 1, 'PRICE_PER_ITEM_ASC', '2026-10-05T01:00:00.000Z', 0, 1, [[10, 1, 0]], None]]),
            '건수와 행': dump([L('A', 0, [10], '2026-10-05T01:00:00.000Z')]),
            '중복': dump(good + [L('A', 2, [10, 11], '2026-10-05T01:01:00.000Z')]),
            '체결 날짜 순서': dump([M('A', 3, [[1, '2026-10-01'], [1, '2026-10-02']], '2026-10-05T01:00:00.000Z')]),
            '빈 결과': dump([]),
        }
        for label, bad in cases.items():
            with self.assertRaises(SystemExit, msg=label):
                build(bad, 1, 'test')


if __name__ == '__main__':
    unittest.main()
