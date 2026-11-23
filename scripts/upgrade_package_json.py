#!/usr/bin/env python3
"""Merge VYRO Prime website scripts/version into the existing package.json, preserving dependencies."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "package.json"
if not path.exists():
    raise SystemExit("package.json missing in existing website repository")
data = json.loads(path.read_text(encoding="utf-8"))
data["name"] = data.get("name") or "vyro-media-library-site"
data["version"] = "3.0.0"
data["private"] = True
data["type"] = "module"
scripts = data.setdefault("scripts", {})
scripts.update({
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview --host 0.0.0.0",
    "check:catalog": "python scripts/validate_library.py",
    "check:js": "node --check assets/js/app.js && node --check assets/js/studio-demo.js && node --check server/api-guard.js && node --check api/v1/intake.js && node --check api/v1/content.js && node --check api/v1/images.js && node --check api/v1/image-file.js && node --check api/v1/voice.js && node --check api/v1/voice-file.js && node --check api/v1/assets.js && node --check api/v1/render.js && node --check api/v1/render-file.js && node --test tests/api-guard.test.mjs",
    "dev:vercel": "vercel dev --listen 3000",
})
dev = data.setdefault("devDependencies", {})
dev["vite"] = "^8.3.8"
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Merged VYRO Prime scripts into package.json; all existing dependencies preserved.")
