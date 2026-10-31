# -*- coding: utf-8 -*-
"""가격 원장(data/auction-prices.json)의 git 이력을 걸어 내려가며 상품별 판매가 추이를 만든다.

  python scripts/build_price_history.py [--repo 저장소] [--path 원장 경로] [--out 출력 경로]

- 커밋마다 원장을 꺼내, 그 커밋에서 새로 조사된 행만 점으로 남긴다. 값과 조사 시각이 직전
  커밋과 같으면 점을 만들지 않는다. 같은 날 여러 번이면 그날 마지막 값 하나만 남긴다.
- 점: 날짜(KST), 매물 최저가, 최근 체결가, 그 커밋 시각에 계산기가 쓴 판매가.
  판매가는 price_audit.grade_row 의 calcAdoptedMeso 를 그대로 쓴다. 규칙을 따로 두지 않는다.
  매물 0건·비정상 호가·값 없는 날도 그 규칙에 맡기고 지우지 않는다.
- 캐릭터 정보(lastSearchRun.accounts 등)는 넣지 않는다. 점이 2개 미만인 상품은 뺀다.
- 결과가 300KB 를 넘으면 필드 이름을 한 글자로 줄인다.
- 출력은 이력만으로 정해진다(실행 시각을 쓰지 않는다). 다시 돌려도 같은 파일이 나온다.

이력을 끝까지 받아야 한다(actions/checkout 의 fetch-depth: 0 또는 git fetch --unshallow).
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import price_audit  # noqa: E402  grade_row·window_bound·KST 를 그대로 쓴다

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = 'maple-cash-value/data/auction-prices.json'
OUT = os.path.join(BASE, 'data', 'price-history.json')
SIZE_LIMIT = 300 * 1024
LONG_KEYS = ('date', 'listing', 'market', 'sale')
SHORT_KEYS = ('d', 'l', 'm', 's')


def git(repo, *args):
    return subprocess.run(['git', '-C', repo, *args], check=True, capture_output=True, text=True, encoding='utf-8').stdout


def commits(repo, path):
    """원장을 바꾼 커밋을 오래된 순서로 (sha, 커밋 시각)."""
    if git(repo, 'rev-parse', '--is-shallow-repository').strip() == 'true':
        sys.exit('이력이 잘려 있다. git fetch --unshallow 또는 fetch-depth: 0 으로 받은 뒤 돌린다.')
    out = git(repo, 'log', '--reverse', '--format=%H %cI', '--', path)
    return [(sha, datetime.fromisoformat(at)) for sha, at in (line.split(' ', 1) for line in out.splitlines() if line)]


def moment(value):
    m = price_audit.window_bound(value) if isinstance(value, str) else None
    return None if m is None or m is price_audit.INVALID else m


def signature(row):
    """이 값들이 직전 커밋과 같으면 새로 조사된 것이 아니다."""
    keys = ('listingLowestMeso', 'resultCount', 'status', 'updatedAt', 'collectedAt',
            'marketPriceMeso', 'marketPriceAt', 'marketHistoryMaxMeso', 'marketHistoryObservedMaxMeso',
            'marketHistoryMeso', 'marketHistoryCollectedAt', 'marketHistoryStatus')
    return tuple(row.get(k) for k in keys)


def survey_day(row, fallback):
    """조사한 날(KST). 매물·시세 시각 중 늦은 쪽, 없으면 커밋 시각."""
    seen = [m for m in (moment(row.get('updatedAt') or row.get('collectedAt')),
                        moment(row.get('marketPriceAt') or row.get('marketHistoryCollectedAt'))) if m]
    return (max(seen) if seen else fallback).astimezone(price_audit.KST).date().isoformat()


def build(repo, path):
    history = {}     # itemName -> {날짜: 점}
    previous = {}    # itemName -> signature
    last_at = None
    for sha, at in commits(repo, path):
        try:
            doc = json.loads(git(repo, 'show', '%s:%s' % (sha, path)))
        except (subprocess.CalledProcessError, json.JSONDecodeError):
            continue  # 지워졌거나 깨진 커밋은 건너뛴다
        # 그 커밋이 올라간 순간 계산기가 보던 값. 원장의 generatedAt 이 있으면 그 시각을 쓴다.
        now = moment(doc.get('generatedAt')) or at.astimezone(price_audit.KST)
        last_at = now
        for row in doc.get('prices') or []:
            name = row.get('itemName')
            if not name:
                continue
            sig = signature(row)
            if previous.get(name) == sig:
                continue
            previous[name] = sig
            info = price_audit.grade_row(row, now)
            point = (
                survey_day(row, now),
                info['listingMeso'] or None,
                info['marketMeso'] or None,
                info['calcAdoptedMeso'] or None,
            )
            history.setdefault(name, {})[point[0]] = point  # 같은 날이면 나중 값으로 덮는다
    items = {name: [list(p) for _, p in sorted(days.items())]
             for name, days in sorted(history.items()) if len(days) >= 2}
    return items, last_at


def render(items, last_at, keys):
    doc = {
        'version': 1,
        'generatedAt': last_at.isoformat() if last_at else None,
        'source': 'data/auction-prices.json git 이력',
        'note': '점마다 날짜(KST) · 매물 최저가 · 최근 체결가 · 그날 계산에 쓴 판매가. 값이 없으면 null.',
        'fields': list(keys),
        'items': {name: [dict(zip(keys, p)) for p in points] for name, points in items.items()},
    }
    return json.dumps(doc, ensure_ascii=False, separators=(',', ':')) + '\n'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', default=os.path.dirname(BASE))
    parser.add_argument('--path', default=LEDGER)
    parser.add_argument('--out', default=OUT)
    args = parser.parse_args()
    items, last_at = build(args.repo, args.path)
    text = render(items, last_at, LONG_KEYS)
    if len(text.encode('utf-8')) > SIZE_LIMIT:
        text = render(items, last_at, SHORT_KEYS)
    with open(args.out, 'w', encoding='utf-8') as f:
        f.write(text)
    points = sum(len(p) for p in items.values())
    print('-> %s  상품 %d개 · 점 %d개 · %.1fKB' % (args.out, len(items), points, len(text.encode('utf-8')) / 1024))


if __name__ == '__main__':
    main()
