# Changelog

## 3.0.0 — Prime Studio
- Added AI Visual panel wired to the separate AI Content Engine image API.
- Expanded demo project export/import/delete and 30-day stale draft cleanup.
- Added explicit browser-local demo mode notice and per-project asset selection.
- Added consistent demo-ID source validation, no-store headers, per-IP/per-route best-effort rate limiting, and payload limits to API proxies.
- Added a local asset manifest validator and Node API-guard tests; verified current catalog paths against the GitHub repository tree.
- Added cleanup of stale browser-local drafts across previous demo IDs; constrained project exports to keep JSON/base64 archives importable.
- Kept Publisher and Scheduler disconnected; the public site exposes only Intake, Content/Image, Voice, and Render services.
- Updated voice/render file access routes to be demo-ID scoped.
- Documented strict service boundaries; publisher and scheduler remain disconnected from the website.
- Added component map and demo privacy/asset permission documentation.

## 2.0.0
- Added initial Studio Demo, IndexedDB draft workspace, photo/video browser editing, and backend service proxies.
