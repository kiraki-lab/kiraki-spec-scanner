# -*- coding: utf-8 -*-
"""build_price_history.py 검사. 임시 git 저장소에 원장 커밋을 몇 개 쌓고 결과를 맞춰 본다.

  python scripts/test_build_price_history.py
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_price_history as bph  # noqa: E402
import price_audit  # noqa: E402

PATH = 'data/auction-prices.json'


def row(name, listing, at, **extra):
    return {'itemName': name, 'query': name, 'listingLowestMeso': listing, 'resultCount': 5,
            'status': 'ok' if listing else 'no_listing', 'collectedAt': at, 'updatedAt': at, **extra}


class BuildPriceHistoryTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = self.tmp.name
        self.git('init', '-q')
        self.git('config', 'user.email', 'test@example.com')
        self.git('config', 'user.name', 'test')
        os.makedirs(os.path.join(self.repo, 'data'))

    def tearDown(self):
        self.tmp.cleanup()

    def git(self, *args, env=None):
        subprocess.run(['git', '-C', self.repo, *args], check=True, capture_output=True,
                       env={**os.environ, **(env or {})})

    def commit(self, generated_at, rows, **top):
        doc = {'version': 2, 'generatedAt': generated_at, 'prices': rows, **top}
        with open(os.path.join(self.repo, PATH), 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False)
        self.git('add', PATH)
        self.git('commit', '-q', '-m', generated_at, env={'GIT_COMMITTER_DATE': generated_at, 'GIT_AUTHOR_DATE': generated_at})

    def test_points(self):
        accounts = {'lastSearchRun': {'accounts': [{'accountCharacter': '스카니아 / 캐릭터'}]}}
        # 1일: A·B·C 조사
        self.commit('2026-07-10T12:00:00+09:00', [
            row('A', 200000000, '2026-07-10T11:00:00+09:00'),
            row('B', 100000000, '2026-07-10T11:00:00+09:00'),
            row('C', 50000000, '2026-07-10T11:00:00+09:00'),
        ], **accounts)
        # 같은 날 두 번째: A 만 다시 조사(값 바뀜). B·C 는 그대로 이어짐
        self.commit('2026-07-10T20:00:00+09:00', [
            row('A', 180000000, '2026-07-10T19:00:00+09:00'),
            row('B', 100000000, '2026-07-10T11:00:00+09:00'),
            row('C', 50000000, '2026-07-10T11:00:00+09:00'),
        ], **accounts)
        # 사흘 뒤: A 는 매물 0건, B 는 비정상 호가 9,999억(지우지 않는다), C 는 그대로
        self.commit('2026-07-13T12:00:00+09:00', [
            row('A', 0, '2026-07-13T11:00:00+09:00', marketPriceMeso=190000000,
                marketPriceAt='2026-07-13T11:00:00+09:00', marketPriceBasis='recentSale'),
            row('B', 999900000000, '2026-07-13T11:00:00+09:00'),
            row('C', 50000000, '2026-07-10T11:00:00+09:00'),
        ], **accounts)
        # 원장과 무관한 파일만 바뀐 커밋은 이력에 안 잡힌다
        with open(os.path.join(self.repo, 'other.txt'), 'w') as f:
            f.write('x')
        self.git('add', 'other.txt')
        self.git('commit', '-q', '-m', 'other')

        items, last_at = bph.build(self.repo, PATH)

        # C 는 처음 한 번만 조사됐으므로 점 1개 → 빠진다
        self.assertEqual(sorted(items), ['A', 'B'])
        # A: 10일은 그날 마지막 값 하나, 13일은 매물 0건이지만 체결가로 판매가가 나온다
        self.assertEqual([p[0] for p in items['A']], ['2026-07-10', '2026-07-13'])
        self.assertEqual(items['A'][0][1], 180000000)
        self.assertEqual(items['A'][1][1], None)
        self.assertEqual(items['A'][1][2], 190000000)
        # 판매가는 grade_row 의 calcAdoptedMeso 와 같다(그 커밋 시각 기준)
        at = price_audit.window_bound('2026-07-13T12:00:00+09:00')
        expect = price_audit.grade_row(row('A', 0, '2026-07-13T11:00:00+09:00', marketPriceMeso=190000000,
                                           marketPriceAt='2026-07-13T11:00:00+09:00', marketPriceBasis='recentSale'), at)
        self.assertEqual(items['A'][1][3], expect['calcAdoptedMeso'])
        # B: 비정상 호가도 그대로 남고, 판매가는 규칙이 정한 값이다
        self.assertEqual(items['B'][1][1], 999900000000)
        self.assertEqual(items['B'][1][3], price_audit.grade_row(row('B', 999900000000, '2026-07-13T11:00:00+09:00'), at)['calcAdoptedMeso'])
        self.assertEqual(last_at, at)

        # 파일에는 캐릭터 정보가 없고, 다시 만들어도 글자 하나 다르지 않다
        text = bph.render(items, last_at, bph.LONG_KEYS)
        self.assertNotIn('캐릭터', text)
        self.assertNotIn('account', text)
        self.assertEqual(text, bph.render(*bph.build(self.repo, PATH), bph.LONG_KEYS))
        short = json.loads(bph.render(items, last_at, bph.SHORT_KEYS))
        self.assertEqual(short['items']['A'][0], {'d': '2026-07-10', 'l': 180000000, 'm': None, 's': 180000000})

    def test_shallow_repo_stops(self):
        self.commit('2026-07-10T12:00:00+09:00', [row('A', 1, '2026-07-10T11:00:00+09:00')])
        self.commit('2026-07-11T12:00:00+09:00', [row('A', 2, '2026-07-11T11:00:00+09:00')])
        shallow = tempfile.mkdtemp()
        subprocess.run(['git', 'clone', '-q', '--depth', '1', 'file://' + self.repo, shallow], check=True, capture_output=True)
        with self.assertRaises(SystemExit):
            bph.build(shallow, PATH)


if __name__ == '__main__':
    unittest.main()
