# -*- coding: utf-8 -*-
"""회차 기록으로 '값이 며칠 만에 얼마나 변하는가'를 잰다.

대역별 목표 신선도(3/7/21일)는 예산에서 역산한 값이지 측정값이 아니었다.
과거 회차의 같은 품목 관측을 시간 간격으로 묶어 실제 변화폭을 본다.

가격을 바꾸지 않는다. `data/collection-*.json` 만 읽는다.

사용: python scripts/measure_drift.py
"""
import glob, io, json, os
from datetime import datetime, timezone, timedelta
from statistics import median

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KST = timezone(timedelta(hours=9))
BUCKETS = [(0, 1.5, '1일'), (1.5, 3.5, '2~3일'), (3.5, 7.5, '4~7일'),
           (7.5, 14.5, '8~14일'), (14.5, 30.5, '15~30일'), (30.5, 999, '31일+')]


def moment(v):
    if not v:
        return None
    t = str(v).strip()
    try:
        m = datetime.fromisoformat(t.replace('Z', '+00:00'))
    except ValueError:
        return None
    return m if m.tzinfo else m.replace(tzinfo=KST)


def main():
    obs = {}
    files = sorted(glob.glob(os.path.join(BASE, 'data', 'collection-*.json')))
    for f in files:
        try:
            d = json.load(io.open(f, encoding='utf-8'))
        except ValueError:
            continue
        for r in (d.get('results') or []):
            if r.get('status') != 'ok':
                continue
            price = r.get('listingLowestMeso') or 0
            at = moment(r.get('collectedAt'))
            if price > 0 and at:
                obs.setdefault(r['itemName'], []).append((at, price))

    pairs = []
    for name, rows in obs.items():
        rows.sort()
        for (t0, p0), (t1, p1) in zip(rows, rows[1:]):
            gap = (t1 - t0).total_seconds() / 86400.0
            if gap < 0.2:
                continue                      # 같은 회차 안의 중복 관측
            pairs.append((gap, abs(p1 / p0 - 1) * 100, name))

    print('회차 파일 %d개 · 품목 %d종 · 연속 관측쌍 %d개'
          % (len(files), len(obs), len(pairs)))
    print()
    print('%-8s %6s %8s %8s %8s %8s' % ('간격', '쌍', '중앙값', '평균', '상위25%', '10%초과'))
    for lo, hi, label in BUCKETS:
        sel = [c for g, c, _ in pairs if lo <= g < hi]
        if not sel:
            continue
        sel.sort()
        p75 = sel[int(len(sel) * .75)] if len(sel) > 3 else sel[-1]
        over = len([x for x in sel if x > 10]) / len(sel) * 100
        print('%-8s %6d %7.1f%% %7.1f%% %7.1f%% %7.0f%%'
              % (label, len(sel), median(sel), sum(sel) / len(sel), p75, over))
    print()
    big = sorted([(c, g, n) for g, c, n in pairs if c >= 50], reverse=True)[:8]
    if big:
        print('가장 크게 움직인 쌍')
        for c, g, n in big:
            print('  %+7.0f%%  %4.1f일  %s' % (c, g, n))


if __name__ == '__main__':
    main()
