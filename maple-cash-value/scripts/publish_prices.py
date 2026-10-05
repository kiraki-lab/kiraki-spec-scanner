# -*- coding: utf-8 -*-
"""가격 원장(data/auction-prices.json) 한 파일만 원격 main 에 올린다.

  python scripts/publish_prices.py --baseline data/auction-prices.before-2026-10-05.json [--dry]

AGENTS.md 의 상시 승인 범위가 이 파일 하나다. 다른 파일은 이 스크립트로 올리지 않는다.
- 원격이 조사 전 기준본과 다르면 멈춘다(그사이 다른 곳에서 올린 것을 덮지 않는다).
- 올린 뒤 원격 블롭과 lastSearchRun.date 가 로컬과 같은지 다시 읽어 확인한다.
"""
import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
LOCAL = BASE / 'data' / 'auction-prices.json'
ENDPOINT = 'repos/kiraki-lab/kiraki-spec-scanner/contents/maple-cash-value/data/auction-prices.json'


def gh(*args, body=None):
    cmd = ['gh', 'api', *args]
    tmp = None
    if body is not None:
        tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8')
        json.dump(body, tmp); tmp.close()
        cmd += ['--input', tmp.name]
    out = subprocess.run(cmd, capture_output=True)
    if tmp:
        os.unlink(tmp.name)
    if out.returncode:
        sys.exit('gh 실패: ' + out.stderr.decode('utf-8', 'replace'))
    return json.loads(out.stdout.decode('utf-8'))


def blob_sha(data):
    return hashlib.sha1(b'blob %d\0' % len(data) + data).hexdigest()


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', required=True, type=Path)
    parser.add_argument('--dry', action='store_true')
    args = parser.parse_args()

    local_bytes = LOCAL.read_bytes()
    local = json.loads(local_bytes.decode('utf-8'))
    run = local['lastSearchRun']
    if not run.get('accountComplete'):
        sys.exit('끝나지 않은 조사다(accountComplete=false). 올리지 않는다.')
    names = [''.join(r['itemName'].split()) for r in local['prices']]
    if len(names) != len(set(names)):
        sys.exit('원장에 같은 품목이 두 번 있다.')

    remote = gh(ENDPOINT)
    remote_doc = json.loads(base64.b64decode(remote['content']).decode('utf-8'))
    baseline = json.loads(args.baseline.read_text(encoding='utf-8'))
    if remote['sha'] == blob_sha(local_bytes):
        print('원격이 이미 로컬과 같다. 올릴 것이 없다.')
        return
    if remote_doc != baseline:
        sys.exit('원격이 조사 전 기준본과 다르다. 덮지 않는다.')

    captured = run.get('capturedSearches', run['totalSearches'])
    message = 'Update auction prices for %s (%d searches)' % (run['date'], captured)
    print('%s · 원격 %s → 로컬 %s' % (message, remote['sha'][:10], blob_sha(local_bytes)[:10]))
    if args.dry:
        return
    done = gh(ENDPOINT, '--method', 'PUT', body=dict(message=message, branch='main', sha=remote['sha'],
                                                      content=base64.b64encode(local_bytes).decode()))
    after = gh(ENDPOINT)
    after_doc = json.loads(base64.b64decode(after['content']).decode('utf-8'))
    if after['sha'] != blob_sha(local_bytes) or after_doc['lastSearchRun']['date'] != run['date']:
        sys.exit('올린 뒤 원격이 로컬과 다르다: %s' % after['sha'])
    print('커밋 %s · 원격 블롭 = 로컬 · lastSearchRun.date %s' % (done['commit']['sha'], run['date']))


if __name__ == '__main__':
    main()
