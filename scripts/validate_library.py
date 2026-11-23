import json, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'public/data/library.json').read_text(encoding='utf-8'))
ids=set(); missing=[]
for a in data['assets']:
    if a['id'] in ids: raise SystemExit(f"duplicate id: {a['id']}")
    ids.add(a['id'])
    for key in ('preview','download'):
        p=root/'public'/a[key].lstrip('/')
        if not p.exists(): missing.append((a['id'],key,str(p)))
if missing:
    print('Missing assets:',missing); raise SystemExit(1)
photos=[a for a in data['assets'] if a['category']=='Template Foto']
videos=[a for a in data['assets'] if a['category']=='Template Video']
assert len(photos)==3, len(photos)
assert len(videos)==3, len(videos)
print(f"OK: {len(data['assets'])} assets, 3 photo templates, 3 video templates; no missing preview/download paths")
