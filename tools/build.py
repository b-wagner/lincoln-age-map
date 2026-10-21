#!/usr/bin/env python3
"""Rebuild the static site using Python's standard library (Python 3.10+)."""
from pathlib import Path
import base64
import gzip
import json
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'source/data.json').read_text(encoding='utf-8'))
payload = base64.b64encode(gzip.compress(
    json.dumps(data, separators=(',', ':')).encode('utf-8'), mtime=0
)).decode('ascii')
template = (ROOT / 'source/map.template.html').read_text(encoding='utf-8')
if template.count('PAYLOAD_PLACEHOLDER') != 1:
    raise ValueError('Expected exactly one data placeholder in the source template')
fragment = template.replace('PAYLOAD_PLACEHOLDER', payload)
with tempfile.TemporaryDirectory(prefix='lincoln-map-build-') as temporary:
    source = Path(temporary) / 'lincoln-building-ages.html'
    source.write_text(fragment, encoding='utf-8')
    subprocess.run([
        sys.executable, str(ROOT / 'tools/renderer/scripts/render.py'),
        str(source), str(ROOT / 'index.html'), '--force',
        '--title', 'Lincoln, Nebraska — Building Ages',
    ], check=True)
print(f'Ready: {ROOT / "index.html"}')
