#!/usr/bin/env python3
"""Validate the published VYRO MEDIA asset manifest and referenced local files."""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "public" / "data" / "library.json"
REQUIRED_FIELDS = ("id", "title", "category", "type", "preview", "download", "format", "license")
ALLOWED_TYPES = {"photo", "video", "logo", "design", "document", "image"}


def resolve_local_asset(value: str, *, field: str, asset_id: str) -> Path | None:
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        # Remote assets are not bundled or counted as local library files.
        return None
    path = PurePosixPath(parsed.path)
    if path.is_absolute():
        relative = Path(*path.parts[1:])
    else:
        relative = Path(*path.parts)
    if not path.parts or any(part in {"..", "."} for part in path.parts):
        raise ValueError(f"{asset_id}: {field} path is not a safe local path: {value}")
    candidate = (ROOT / "public" / relative).resolve()
    public_root = (ROOT / "public").resolve()
    if public_root not in candidate.parents and candidate != public_root:
        raise ValueError(f"{asset_id}: {field} escapes public directory: {value}")
    if not candidate.is_file():
        raise ValueError(f"{asset_id}: {field} file does not exist: {candidate.relative_to(ROOT)}")
    return candidate


def main() -> int:
    if not MANIFEST.is_file():
        print(f"ERROR: manifest not found: {MANIFEST}", file=sys.stderr)
        return 1
    try:
        payload = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: invalid library manifest: {exc}", file=sys.stderr)
        return 1

    assets = payload.get("assets") if isinstance(payload, dict) else None
    if not isinstance(assets, list):
        print("ERROR: library.json must contain an 'assets' array", file=sys.stderr)
        return 1

    seen: set[str] = set()
    category_counts: Counter[str] = Counter()
    checked_files = 0
    errors: list[str] = []
    for index, asset in enumerate(assets):
        if not isinstance(asset, dict):
            errors.append(f"assets[{index}] must be an object")
            continue
        asset_id = str(asset.get("id", f"assets[{index}]"))
        missing = [field for field in REQUIRED_FIELDS if not str(asset.get(field, "")).strip()]
        if missing:
            errors.append(f"{asset_id}: missing required fields: {', '.join(missing)}")
            continue
        if asset_id in seen:
            errors.append(f"duplicate asset id: {asset_id}")
        seen.add(asset_id)
        if asset["type"] not in ALLOWED_TYPES:
            errors.append(f"{asset_id}: unsupported type {asset['type']!r}")
        category_counts[str(asset["category"])] += 1
        for field in ("preview", "download"):
            try:
                resolved = resolve_local_asset(str(asset[field]), field=field, asset_id=asset_id)
                checked_files += int(resolved is not None)
            except ValueError as exc:
                errors.append(str(exc))

    if not assets:
        errors.append("library contains no assets")
    if category_counts["Template Foto"] < 3:
        errors.append("Template Foto must include at least 3 real assets")
    if category_counts["Template Video"] < 3:
        errors.append("Template Video must include at least 3 real assets")
    if category_counts["Copyright & Logo"] < 3:
        errors.append("Copyright & Logo must include at least 3 real assets")

    if errors:
        print("VYRO MEDIA LIBRARY VALIDATION FAILED", file=sys.stderr)
        for error in errors:
            print(f" - {error}", file=sys.stderr)
        return 1

    print("VYRO MEDIA LIBRARY VALIDATION OK")
    print(f"Assets: {len(assets)} | local file references checked: {checked_files}")
    print("Categories:")
    for name, count in sorted(category_counts.items()):
        print(f" - {name}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
