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
import json, math, os, re, sys
from datetime import date, datetime, time, timedelta, timezone

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRICES = os.path.join(BASE, 'data', 'auction-prices.json')
ITEMS = os.path.join(BASE, 'data', 'items.json')
COLLECTIONS_PATH = os.path.join(BASE, 'data', 'collections.json')
OUT = os.path.join(BASE, 'data', 'price-audit.json')

# --- 임계값 (PRICE_VERIFICATION.md 와 같이 움직여야 한다) ---
FRESH_DAYS = 3        # 이 안쪽이면 신선
STALE_DAYS = 14       # 이 바깥이면 낡음
THIN_LISTINGS = 2     # 이하이면 저매물 (단독 근거로 쓰지 않는다)
GAP_OK = 30           # 두 근거 괴리 허용 (%)
GAP_WARN = 60
SPIKE_UP = 2.0        # 직전 대비 이 배수 이상이면 급변
SPIKE_DOWN = 0.5      # 이 배수 이하도 급변 (하락도 대칭으로 본다)
MESO_PRECISION = 1000000  # app.js 와 같은 자. 비교 전에 같은 눈금으로 맞춘다
TOP_RANK_GUARD = 20   # 상위 몇 위까지를 게이트 대상으로 볼지

# 대역별 유지 목표. ROADMAP 2.1 — 예산이 모자란 게 아니라 잘못 쓰이고 있었다.
# (순위 상한, 목표 신선도(일), 확인할 축)
BANDS = [
    (20, 3, ('listing', 'market')),    # 1~20위   두 축 겹쳐
    (40, 7, ('listing', 'market')),    # 21~40위  두 축 겹쳐
    (80, 21, ('listing',)),            # 41~80위  매물만
]
# 81위 이하와 어떤 상품에도 안 들어가는 행은 기본 휴면이다. --all 로만 부른다.

# 휴지기 컬렉션(다음 회차 대기)의 상품도 가격을 아주 놓지는 않는다. 다음 회차가
# 열리는 날 100개 넘는 구성품이 한꺼번에 몇 달 묵은 값이 되면 첫날 순위가 틀린다.
# '휴지기 포함' 참고 순위 상위 RESTING_TOP 안을 떠받치는 행만, 매물만 느슨하게 본다.
RESTING_TOP = 40
RESTING_DAYS = 30


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


KST = timezone(timedelta(hours=9))


def parse_moment(value):
    """시각까지 살린다. app.js 는 시각으로 비교하므로 날짜만 보면 경계일이 갈라진다.

    JavaScript 의 `new Date()` 규칙을 그대로 따른다.
      - '2026-09-06'            -> UTC 자정   (KST 09:00)
      - '2026-09-06T00:00:00'   -> 로컬(KST) 자정
      - 오프셋이 붙은 값        -> 그대로
    날짜만 있는 값을 KST 자정으로 읽으면 14일 경계가 9시간 어긋난다.
    """
    if not value:
        return None
    text = str(value).strip()
    if len(text) == 10 and 'T' not in text:
        d = parse_day(text)
        return None if d is None else datetime.combine(d, time(0, 0), tzinfo=timezone.utc)
    try:
        m = datetime.fromisoformat(text.replace('Z', '+00:00'))
    except ValueError:
        d = parse_day(text)
        return None if d is None else datetime.combine(d, time(0, 0), tzinfo=timezone.utc)
    return m if m.tzinfo else m.replace(tzinfo=KST)


def moment_for(today):
    """기준일의 '지금'. 오늘이면 실제 현재 시각, 지난 날짜면 그날의 끝."""
    now = datetime.now(KST)
    if today == now.date():
        return now
    return datetime.combine(today, time(23, 59, 59), tzinfo=KST)


def age_days(value, now):
    """app.js isEvidenceStale 와 같이 시간 단위로 잰다.

    날짜 차이만 보면 14.5일 된 근거를 계산기는 빼고 감사는 살려 두어 등급이 갈라진다.
    """
    m = parse_moment(value)
    return None if m is None else (now - m).total_seconds() / 86400.0


def round_meso(value):
    """app.js roundMeso 와 같다. 반올림 전에 비교하면 같은 값을 다르게 본다.

    파이썬 `round` 는 은행가 반올림이라 12.5 를 12 로 내리지만 JavaScript 의
    `Math.round` 는 13 으로 올린다. 정확히 절반인 값에서 둘이 갈리므로
    `floor(x + 0.5)` 로 JS 쪽에 맞춘다. (카링 비단 모자 12.5억이 실제로 걸렸다.)
    """
    return int(math.floor(max(0, value or 0) / MESO_PRECISION + 0.5)) * MESO_PRECISION


def grade_row(row, now):
    """한 행의 신뢰 등급과 채택 근거를 정한다."""
    listing_raw = row.get('listingLowestMeso') or 0
    # app.js priceFor 와 글자 그대로 같은 순서여야 한다.
    market_raw = (row.get('marketPriceMeso') or row.get('marketHistoryMaxMeso')
                  or row.get('marketHistoryObservedMaxMeso')
                  or row.get('marketHistoryMeso') or 0)
    # 계산기는 반올림한 값으로 비교한다. 원값으로 비교하면 100.2억과 100.1억이
    # 계산기에서는 같은 값인데 감사에서는 다른 값이 되어 저매물 판정이 갈린다.
    listing = round_meso(listing_raw)
    market = round_meso(market_raw)
    basis = row.get('marketPriceBasis') or ('legacyMax' if market else '')
    market_basis = basis            # 아래에서 basis 가 채택 축 이름으로 덮인다
    l_age = age_days(row.get('updatedAt') or row.get('collectedAt'), now)
    m_age = age_days(row.get('marketPriceAt') or row.get('marketHistoryCollectedAt'), now)
    count = row.get('resultCount') or 0
    status = row.get('status') or ''

    info = {
        'itemName': row['itemName'],
        'listingMeso': listing_raw,
        'marketMeso': market_raw,
        'listingAgeDays': None if l_age is None else round(l_age, 1),
        'marketAgeDays': None if m_age is None else round(m_age, 1),
        'resultCount': count,
        'status': status,
        'marketBasis': basis,
        # 계산기가 실제로 쓰는 값. 아래에서 덮어쓴다.
        'calcAdoptedMeso': 0,
    }

    if status == 'uncaptured':
        info.update(grade='F', basis='none', reason='정확일치 미포착 · 값 미확인')
        return info
    if not listing and not market:
        info.update(grade='F', basis='none',
                    reason='매물·시세 근거 모두 없음' if status != 'no_listing' else '매물 0건 · 시세 없음')
        return info

    # app.js priceFor 의 pendingMarketHistory 와 같다. 시세 탭에 체결이 아예 없으면
    # 매물 호가가 신선해도 계산기는 값을 채택하지 않는다(팔린 적이 없는 호가다).
    if row.get('marketHistoryStatus') in ('no_sales', 'listing_unconfirmed') and not market:
        info.update(grade='F', basis='none', adoptedMeso=0,
                    reason='시세 탭 체결 없음 · 계산기가 값을 채택하지 않음')
        return info

    l_fresh = l_age is not None and l_age <= FRESH_DAYS
    l_stale = l_age is None or l_age > STALE_DAYS
    m_fresh = m_age is not None and m_age <= FRESH_DAYS
    m_stale = m_age is None or m_age > STALE_DAYS

    gap = None
    if listing and market:
        # 괴리율의 분모는 매물가다. app.js marketGapRate 와 문서 1절(매물 2.22억 ·
        # 시세 18.89억 = 751%)이 그렇게 쓴다. 큰 값을 분모로 쓰면 시세가 매물보다
        # 높을 때 괴리가 작게 나와 등급이 부풀려진다(1억·1.4억이 28.57% → A).
        gap = abs(listing - market) / listing * 100

    # 계산기(app.js priceFor)가 실제로 쓰는 값. 감사와 달리 legacyMax 도 후보에
    # 넣는다 — 과대평가지만 상한 역할을 한다(9절, 의도한 차이).
    # 저매물 판정과 근사 순위는 화면과 같아야 하므로 이 값을 쓴다.
    calc = [v for v in ((listing if listing and not l_stale else 0),
                        (market if market and not m_stale else 0)) if v]
    calc_adopted = min(calc) if calc else (market or listing)
    info['calcAdoptedMeso'] = calc_adopted

    # 채택 근거: 낡은 값은 후보에서 뺀 뒤, 남은 것 중 낮은 쪽
    candidates = []
    if listing and not l_stale:
        candidates.append(('listing', listing))
    if market and not m_stale and basis != 'legacyMax':
        candidates.append(('market', market))
    if not candidates:
        # app.js 와 같다: 후보가 없으면 시세를 먼저 쓰고, 없으면 매물을 쓴다.
        # (candidateMeso = marketHistoryMeso || listingMeso)
        basis, adopted = ('market', market) if market else ('listing', listing)
        thin = calc_adopted == listing and 0 < count <= THIN_LISTINGS
        info['thinOnly'] = thin
        # 저매물이 먼저다. 문서 5절은 저매물 단독 근거를 D 로 못박는다 —
        # 신선한 legacyMax 가 있다고 C 로 올라가면 순위 제외 사유와 등급이 어긋난다.
        if thin:
            info.update(grade='D', basis=basis, adoptedMeso=adopted, gapRate=gap,
                        reason='매물 %d건 단독 근거 · 이상치 위험' % count)
        elif market_basis == 'legacyMax' and not m_stale:
            # 날짜는 새것이어도 3개월 최고가는 교차검증이 아니다(9절). 낡음이 아니라 C.
            info.update(grade='C', basis=basis, adoptedMeso=adopted, gapRate=gap,
                        reason='시세가 legacyMax(3개월 최고가) · 체결 내역 재조회 필요')
        else:
            info.update(grade='D', basis=basis, adoptedMeso=adopted, gapRate=gap,
                        reason='근거가 모두 %d일 초과로 낡음' % STALE_DAYS)
        return info

    basis, adopted = min(candidates, key=lambda c: c[1])  # basis: 'listing' | 'market'

    # 저매물 단독 근거는 이상치 위험이 크다.
    # 쓸 수 없는 시세(낡음·legacyMax)가 있어도 교차검증이 아니므로 단독으로 본다.
    # app.js priceFor 와 같은 식. 교차검증으로 인정할 수 있는 시세만 방패가 된다.
    market_cross = bool(market) and not m_stale and market_basis != 'legacyMax'
    thin = (not market_cross and calc_adopted > 0 and calc_adopted == listing
            and 0 < count <= THIN_LISTINGS)
    info['thinOnly'] = thin

    if thin:
        info.update(grade='D', basis=basis, adoptedMeso=adopted, gapRate=gap,
                    reason='매물 %d건 단독 근거 · 이상치 위험' % count)
    elif (len(candidates) == 2 and l_fresh and m_fresh
          and gap is not None and gap <= GAP_OK):
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


SPIKE_UNVERIFIED = 1.5   # 시세 교차검증이 없으면 이 배수부터 본다 (문서 5절)


def detect_spike(row, market_cross=None):
    """직전 확인가 대비 급변을 잡는다. 문서 5절 세 갈래를 모두 본다.

    1. 2배 이상 상승 · 0.5배 이하 하락 — 매물 수와 무관
    2. 1.5배 이상 상승 + 시세 교차검증 없음 — 막을 것이 없으므로 낮은 배수부터

    `market_cross` 를 안 주면 행에서 직접 판단한다.
    """
    prev = row.get('previousListingLowestMeso') or row.get('lastKnownListingMeso')
    cur = row.get('listingLowestMeso') or 0
    if not prev or not cur:
        return None
    ratio = cur / prev
    if ratio >= SPIKE_UP:
        return {'direction': 'up', 'ratio': round(ratio, 2), 'rule': '%.1f배 이상' % SPIKE_UP}
    if ratio <= SPIKE_DOWN:
        return {'direction': 'down', 'ratio': round(ratio, 2), 'rule': '%.1f배 이하' % SPIKE_DOWN}
    if market_cross is None:
        market = (row.get('marketPriceMeso') or row.get('marketHistoryMaxMeso')
                  or row.get('marketHistoryObservedMaxMeso') or row.get('marketHistoryMeso') or 0)
        basis = row.get('marketPriceBasis') or ('legacyMax' if market else '')
        market_cross = bool(market) and basis != 'legacyMax'
    if ratio >= SPIKE_UNVERIFIED and not market_cross:
        return {'direction': 'up', 'ratio': round(ratio, 2),
                'rule': '%.1f배 이상 · 시세 교차검증 없음' % SPIKE_UNVERIFIED}
    return None


def nk(value):
    return ''.join((value or '').split())


def backing_keys(items, now):
    """지금 살 수 있는 상품을 떠받치는 원장 행 이름 -> 그 상품들.

    구성품이면 구성품 이름으로, 단독 상품이면 상품 이름 그대로 들어간다.
    여기에 없는 행은 어떤 판매 중 상품도 떠받치지 않으므로 갱신할 이유가 없다.
    """
    keys = {}
    for it in items:
        if it.get('referenceOnly') or not is_purchasable(it, now):
            continue
        comps = it.get('components') or []
        names = [c.get('name') for c in comps] if comps else [it['name']]
        for n in names:
            keys.setdefault(nk(n), []).append(it['name'])
    return keys


def band_for(rank):
    """순위로 대역을 고른다. 순위가 없으면 휴면."""
    if rank is None:
        return None
    for i, (cap, days, axes) in enumerate(BANDS):
        if rank <= cap:
            return {'index': i, 'label': '%d위 이내' % cap, 'targetDays': days, 'axes': axes}
    return None


def component_owner_map(items):
    """구성품 -> 그 구성품을 쓰는 상품 목록."""
    owners = {}
    for it in items:
        for c in (it.get('components') or []):
            name = c.get('name') if isinstance(c, dict) else c
            owners.setdefault(''.join((name or '').split()), []).append(it['name'])
    return owners


# 주기 판매 컬렉션. main 에서 data/collections.json 으로 채운다.
COLLECTIONS = {}

# app.js ISO_MOMENT 와 같은 식. 이 밖의 문자열은 받지 않는다(브라우저와 해석이 갈린다).
ISO_MOMENT = re.compile(
    r'^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])'
    r'(T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d(\.\d{1,3})?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)?)?$')
INVALID = object()      # 값은 있는데 못 읽음 (JS 의 NaN)
UNKNOWN = object()      # 판매 창 목록 자체를 해석할 수 없음 (JS 의 undefined)


def window_bound(value):
    """None = 값 없음(열린 끝), INVALID = 못 읽음, datetime = 경계. app.js windowBound 와 같다.

    날짜만 있으면 UTC 자정(JS 의 new Date('2026-09-06') 규칙), 오프셋 없는 시각은 로컬(KST).
    """
    if value is None or value == '':
        return None
    if not isinstance(value, str) or not ISO_MOMENT.match(value):
        return INVALID
    if int(value[:4]) < 1970:
        return INVALID          # app.js windowBound 와 같다. 판매 기간일 수 없는 연도
    try:
        if len(value) == 10:
            return datetime.combine(date.fromisoformat(value), time(0, 0), tzinfo=timezone.utc)
        m = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return INVALID
    return m if m.tzinfo else m.replace(tzinfo=KST)


def window_span(w, from_collection):
    """(start, end) 또는 None(해석 불가). app.js windowSpan 과 같은 규칙.

    상품 availability 에서 날짜가 하나도 없는 창은 type: 'always' 일 때만 열린 창이다.
    그 밖의 창과 컬렉션 회차는 시작·끝이 둘 다 있고 시작 <= 끝이어야 한다.
    """
    if not isinstance(w, dict):
        return None
    start, end = window_bound(w.get('startAt')), window_bound(w.get('endAt'))
    if start is INVALID or end is INVALID:
        return None
    if start is None and end is None:
        return (None, None) if (not from_collection and w.get('type') == 'always') else None
    if w.get('type') == 'always':
        return None                 # 상시라면서 날짜가 있으면 모순
    if start is None or end is None or start > end:
        return None
    return (start, end)


def sale_windows(item, collections=None):
    """list = 창 목록, None = 기간 정보 없음(상시판매), UNKNOWN = 해석 불가. app.js saleWindows."""
    cs = COLLECTIONS if collections is None else collections
    cid = item.get('collection')
    if cid is not None and cid != '':
        if not isinstance(cid, str):
            return UNKNOWN
        c = cs.get(cid)
        if not isinstance(c, dict) or not isinstance(c.get('runs'), list):
            return UNKNOWN
        return c['runs']
    # 값이 없을 때(None)만 기간 정보 없음 = 상시판매. false·0·'' 처럼 값은 있는데
    # 창이 아닌 것은 창 목록에 그대로 넣어 window_span 에서 해석 불가가 되게 한다.
    a = item.get('availability')
    return None if a is None else [a]


def sale_status(item, now, collections=None):
    """on · always · upcoming · resting · ended · unknown. app.js saleStatus 와 같은 규칙."""
    cs = COLLECTIONS if collections is None else collections
    if item.get('rankEligible') is False:
        return 'ended'
    windows = sale_windows(item, cs)
    if windows is UNKNOWN:
        return 'unknown'
    if windows is None:
        return 'always'
    cid = item.get('collection')
    from_collection = cid is not None and cid != ''
    bounds = []
    for w in windows:
        span = window_span(w, from_collection)
        if span is None:
            return 'unknown'
        bounds.append(span)
    upcoming = False
    for start, end in bounds:
        started = start is None or now >= start
        not_ended = end is None or now <= end
        if started and not_ended:
            return 'on'
        if start is not None and now < start:
            upcoming = True
    if upcoming:
        return 'upcoming'
    recurring = from_collection and cs[cid].get('recurring') is not False
    return 'resting' if recurring else 'ended'


def is_purchasable(item, now):
    """지금 살 수 있는가. 판매 중(on)이거나 기간 정보가 없는(always) 상품만."""
    return sale_status(item, now) in ('on', 'always')


def approx_ranking(items, by_key, settings, now, include_resting=False):
    """상품별 대략적인 '1억당 현금'을 계산해 순위를 매긴다.

    계산기 본식(마일리지·수수료)을 그대로 옮기지는 않는다. 어떤 행이 순위표
    위쪽을 떠받치고 있는지 가려내기 위한 근사이므로, 판매가와 현금가의 비만 본다.
    """
    discount = 1 - (settings.get('discountRate') or 0) / 100
    ranked = []
    for it in items:
        status = sale_status(it, now)
        if status not in ('on', 'always') and not (include_resting and status == 'resting'):
            continue
        comps = it.get('components') or []
        if comps:
            total, missing = 0, False
            for c in comps:
                g = by_key.get(''.join((c.get('name') or '').split()))
                v = (g or {}).get('calcAdoptedMeso') or 0
                if not v:
                    missing = True
                total += v * (c.get('quantity') or 1)
            value, feeds = total, [c.get('name') for c in comps]
        else:
            g = by_key.get(''.join(it['name'].split()))
            value = (g or {}).get('calcAdoptedMeso') or 0
            # 구성품 없는 단독 상품이 저매물 호가 하나로만 값이 잡히면 순위에서 뺀다.
            # app.js isThinListingRow 와 같은 규칙(문서 5절). 패키지는 평균되므로 뺀다.
            if (g or {}).get('thinOnly'):
                continue
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
    argv = sys.argv[1:]

    def opt(flag, default):
        return argv[argv.index(flag) + 1] if flag in argv else default

    # 원장 대신 다른 파일로 돌릴 수 있다. 합성 사례 회귀 검사(crosscheck)가 쓴다.
    prices_path = opt('--prices', PRICES)
    out_path = opt('--out', OUT)
    items_path = opt('--items', ITEMS)
    collections_path = opt('--collections', COLLECTIONS_PATH)
    valued = ('--prices', '--out', '--items', '--collections', '--now', '--sale-cases')
    days = [a for i, a in enumerate(argv) if not a.startswith('--')
            and (i == 0 or argv[i - 1] not in valued)]
    today = date.fromisoformat(days[0]) if days else date.today()
    now = moment_for(today)
    # 시각을 못박는다. 대조 스크립트가 계산기와 같은 순간으로 맞출 때 쓴다.
    if '--now' in argv:
        pinned = window_bound(opt('--now', ''))
        if pinned is None or pinned is INVALID:
            sys.exit('--now 는 ISO 시각이어야 한다')
        now = pinned

    global COLLECTIONS
    loaded = {}
    if os.path.exists(collections_path):
        loaded = json.load(open(collections_path, encoding='utf-8')).get('collections')
    COLLECTIONS = loaded if isinstance(loaded, dict) else {}

    # 판매 상태 사례만 평가하고 끝낸다. crosscheck_adoption.js 가 계산기와 맞춰 본다.
    if '--sale-cases' in argv:
        src = opt('--sale-cases', '')
        cases = json.load(sys.stdin) if src == '-' else json.load(open(src, encoding='utf-8'))
        out = []
        for c in cases:
            at = window_bound(c['now'])
            cs = c['collections'] if 'collections' in c else COLLECTIONS
            out.append({'name': c['name'], 'status': sale_status(c['item'], at, cs)})
        print(json.dumps(out, ensure_ascii=False))
        return

    # '-' 는 표준 입력. 대조 스크립트가 임시 파일 없이(읽기 전용 환경에서도) 넘긴다.
    doc = json.load(sys.stdin) if prices_path == '-' else json.load(open(prices_path, encoding='utf-8'))
    items_doc = json.load(open(items_path, encoding='utf-8'))
    items = items_doc['items']
    owners = component_owner_map(items)

    graded = [grade_row(r, now) for r in doc['prices']]
    by_key = {''.join(g['itemName'].split()): g for g in graded}
    for r in doc['prices']:
        g = by_key.get(''.join(r['itemName'].split()))
        for a in r.get('aliases') or []:
            by_key.setdefault(''.join(a.split()), g)

    settings = items_doc['settings']
    ranked = approx_ranking(items, by_key, settings, now)
    # 휴지기까지 넣은 참고 순위. 휴지기 상품을 떠받치는 행을 느슨하게 유지하는 데 쓴다.
    ranked_all = approx_ranking(items, by_key, settings, now, include_resting=True)
    status_by_name = {it['name']: sale_status(it, now) for it in items}
    resting_rank = {}
    for p in ranked_all:
        if status_by_name.get(p['name']) != 'resting' or p['rank'] > RESTING_TOP:
            continue
        for f in p['feeds']:
            k = nk(f)
            if k not in resting_rank or p['rank'] < resting_rank[k][0]:
                resting_rank[k] = (p['rank'], p['name'])

    # 각 행이 떠받치는 상품 중 가장 높은 순위
    best_rank = {}
    for p in ranked:
        for f in p['feeds']:
            k = ''.join((f or '').split())
            if k not in best_rank or p['rank'] < best_rank[k][0]:
                best_rank[k] = (p['rank'], p['name'])

    # 회차가 남긴 플래그와, 원장 값으로 직접 판정한 급변을 합친다.
    # 예전에는 detect_spike 가 정의만 돼 있고 호출되지 않아, 회차 러너가 놓친
    # 급변은 아무도 잡지 못했다(보스 성형 쿠폰 2.19배가 실제로 빠져 있었다).
    flags = {f['itemName']: f for f in (doc.get('lastSearchRun', {}).get('pendingHistoryItems') or [])}
    spikes = {}
    for r in doc['prices']:
        g = by_key.get(nk(r['itemName'])) or {}
        market_cross = bool(g.get('marketMeso')) and (g.get('marketBasis') != 'legacyMax')
        sp = detect_spike(r, market_cross)
        if sp:
            spikes[r['itemName']] = sp
            flags.setdefault(r['itemName'], {'itemName': r['itemName'], 'source': 'audit', **sp})

    # 우선순위: 대역별 목표 신선도를 넘긴 행 중에서, 순위표 위쪽부터.
    # 대역 밖(81위 이하·미사용)은 큐에 넣지 않는다 — 전체를 보려면 --all.
    order = {'F': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4}
    backs = backing_keys(items, now)
    show_all = '--all' in argv
    queue, dormant, notdue = [], 0, 0
    dormant_rows = []
    for g in graded:
        key = nk(g['itemName'])
        used_by = owners.get(key, [])
        rank, via = best_rank.get(key, (None, None))
        band = band_for(rank)
        backed = backs.get(key) or []

        # 신규·미조회: 판매 중인 상품을 떠받치는데 값이 아예 없는 행.
        # 값이 없으면 순위가 안 잡히고, 순위가 없으면 우선순위도 안 잡힌다.
        # 그 고리를 여기서 끊는다. 캐치! 티니핑 굿즈 컬렉션이 이 경우다.
        bootstrap = bool(backed) and not (g.get('calcAdoptedMeso') or 0)
        if bootstrap:
            band = {'index': 0, 'label': '신규·미조회', 'targetDays': 0,
                    'axes': ('listing', 'market')}

        resting_hit = None
        if band is None and key in resting_rank:
            # 지금 순위표에는 없지만 다음 회차에 돌아올 상품의 구성품이다.
            resting_hit = resting_rank[key]
            band = {'index': len(BANDS), 'label': '휴지기', 'targetDays': RESTING_DAYS,
                    'axes': ('listing',)}

        if band is None:
            dormant += 1
            # 영영 안 보면 값이 올라도 순위로 올라올 수가 없다. 가장 오래된 것만
            # 표본으로 남겨 두고, 회차마다 몇 건씩 섞는다(build_run_plan --sample).
            if backed:
                dormant_rows.append({'itemName': g['itemName'],
                                     'ageDays': g.get('listingAgeDays'),
                                     'topRank': rank, 'grade': g['grade']})
            if not show_all:
                continue
            band = {'index': len(BANDS), 'label': '휴면', 'targetDays': STALE_DAYS,
                    'axes': ('listing',)}

        # 축마다 따로 기한을 본다. 매물만 낡았으면 매물만 다시 본다.
        ages = {'listing': g.get('listingAgeDays'), 'market': g.get('marketAgeDays')}
        due, overdue = [], 0
        for axis in band['axes']:
            age = ages.get(axis)
            if age is None or age >= band['targetDays']:
                due.append(axis)
                if age is not None:
                    overdue = max(overdue, age - band['targetDays'])
        if not due:
            notdue += 1
            continue
        # 예전 큐는 등급으로 걸렀다. 지금은 대역 기한이 기준이므로 등급으로 또 거르면
        # 목표를 넘긴 A·B 행이 조용히 빠진다(상위 2위 구성품이 10일째인데 B 라서
        # 큐에 없던 것이 실제로 있었다). 기한 판정은 위에서 이미 끝났다.

        if rank is None:
            rank_score = 60 if bootstrap else 0   # 신규는 순위가 없어도 앞으로
        elif rank <= TOP_RANK_GUARD:
            rank_score = 100 - rank * 2          # 상위 20위는 압도적으로 우선
        elif rank <= 40:
            rank_score = 40 - (rank - 20)
        else:
            rank_score = max(0, 20 - (rank - 40) // 5)

        score = (rank_score + (5 - order[g['grade']]) * 6 + len(used_by) * 2
                 + min(30, overdue))
        if g['itemName'] in flags:
            score += 15
        queue.append({
            'itemName': g['itemName'],
            'grade': g['grade'],
            'reason': g['reason'],
            'topRank': rank,
            'topRankVia': via,
            'restingRank': resting_hit[0] if resting_hit else None,
            'restingRankVia': resting_hit[1] if resting_hit else None,
            'band': band['label'],
            'targetDays': band['targetDays'],
            'axes': due,
            'overdueDays': overdue,
            'bootstrap': bootstrap,
            'usedByCount': len(used_by),
            'usedBy': used_by[:5],
            'flagged': g['itemName'] in flags,
            'spike': spikes.get(g['itemName']),
            'score': score,
            'checkType': 'market' if g.get('listingMeso') else 'listing',
        })
    # 신규·미조회는 점수와 무관하게 맨 앞이다. 순위가 없어 점수가 낮게 나오는데,
    # 값이 없으면 계산기에서 '가격 없음'으로 남아 있게 된다. 몇 건 안 되므로 싸다.
    # 휴지기 대역은 지금 살 수 있는 상품을 다 본 뒤에 남는 예산으로만 돈다.
    queue.sort(key=lambda q: (not q['bootstrap'], q['band'] == '휴지기', -q['score'], q['itemName']))
    searches_needed = sum(len(q['axes']) for q in queue)

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
        'bands': [{'maxRank': c, 'targetDays': d, 'axes': list(a)} for c, d, a in BANDS]
                 + [{'label': '휴지기', 'restingTop': RESTING_TOP, 'targetDays': RESTING_DAYS, 'axes': ['listing']}],
        'queueSummary': {
            'queued': len(queue), 'searchesNeeded': searches_needed,
            'dormant': dormant, 'notDue': notdue,
            'dormantSampled': len(dormant_rows),
        },
        'gradeDistribution': dist,
        'spikes': [dict(itemName=k, **v) for k, v in sorted(spikes.items())],
        'approxRanking': ranked[:40],
        'restingRanking': [p for p in ranked_all if status_by_name.get(p['name']) == 'resting'][:RESTING_TOP],
        'itemStatus': [{'name': k, 'status': v} for k, v in status_by_name.items()],
        'saleStatusCount': {k: list(status_by_name.values()).count(k)
                            for k in sorted(set(status_by_name.values()))},
        'now': now.isoformat(timespec='seconds'),
        'rows': graded,
        'dormantRows': sorted(dormant_rows,
                              key=lambda r: -(r['ageDays'] or 999))[:60],
        'verificationQueue': queue,
        'note': '규칙 정본은 PRICE_VERIFICATION.md. 이 파일은 가격을 바꾸지 않는 감사 결과다.',
    }
    if out_path == '-':
        # 결과 JSON 은 표준 출력으로, 사람이 읽는 요약은 표준 오류로 보낸다.
        sys.stdout.write(json.dumps(out, ensure_ascii=False))
        sys.stdout.flush()
        sys.stdout = sys.stderr
    else:
        json.dump(out, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    print('기준일', today, '· 총', len(graded), '행')
    for g in ['A', 'B', 'C', 'D', 'F']:
        n = dist.get(g, 0)
        print('  등급 %s : %4d (%.0f%%)' % (g, n, n / len(graded) * 100))
    print()
    guard = [q for q in queue if q['topRank'] and q['topRank'] <= TOP_RANK_GUARD]
    print('상위 %d위 안에서 등급 C 이하인 행: %d' % (TOP_RANK_GUARD, len(guard)))
    print()
    print('대역별 유지 목표')
    for cap, days, axes in BANDS:
        n = len([q for q in queue if q['topRank'] and q['topRank'] <= cap
                 and not (q['band'] == '신규·미조회')])
        print('  ~%3d위  %2d일  %-16s 기한 지난 행 %d' % (cap, days, '+'.join(axes), n))
    boot = [q for q in queue if q['bootstrap']]
    if boot:
        print('  신규·미조회 %d행: %s' % (len(boot), ', '.join(q['itemName'] for q in boot[:6])))
    rest = [q for q in queue if q['band'] == '휴지기']
    print('  휴지기 참고 %d위 이내 %2d일  listing          기한 지난 행 %d' % (RESTING_TOP, RESTING_DAYS, len(rest)))
    print('  휴면(81위 이하·미사용) %d행 제외 · 기한 안 된 행 %d' % (dormant, notdue))
    print('  판매 상태: %s' % ' · '.join('%s %d' % (k, v) for k, v in out['saleStatusCount'].items()))
    print()
    print('검증 큐 %d행 · 필요 검색 %d회' % (len(queue), searches_needed))
    for q in queue[:25]:
        mark = '!' if q['flagged'] else ('*' if q['bootstrap'] else ' ')
        rank = ('%3d위' % q['topRank']) if q['topRank'] else '  -  '
        print('  %s%-24s %s %s %-7s %-26s %s'
              % (mark, q['itemName'][:24], q['grade'], rank, q['band'],
                 q['reason'][:26], '+'.join(q['axes'])))
    print()
    print('->', out_path)


if __name__ == '__main__':
    main()
