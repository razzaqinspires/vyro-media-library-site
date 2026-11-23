#!/usr/bin/env python3
"""Update root version metadata in package-lock.json without resolving dependencies."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
lock_path = root / "package-lock.json"
package_path = root / "package.json"
if not lock_path.exists():
    raise SystemExit("package-lock.json not found; run npm install once before packaging this release")
data = json.loads(lock_path.read_text(encoding="utf-8"))
version = json.loads(package_path.read_text(encoding="utf-8"))["version"]
data["version"] = version
if isinstance(data.get("packages"), dict) and isinstance(data["packages"].get(""), dict):
    data["packages"][""]["version"] = version
lock_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"package-lock root version updated to {version}")
