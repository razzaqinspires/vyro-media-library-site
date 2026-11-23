# VYRO MEDIA — Creative Library & Prime Studio

**Release:** 3.0.0 · **Instagram:** [@vyromedia.id](https://instagram.com/vyromedia.id)

VYRO MEDIA is an independent creative media brand. This repository contains the public library website, browser-based experimental Studio Demo, and thin server-side API proxies only. It does not vendor backend component source code or model weights.

## Prime 3.0 capabilities
- Template-first library with six initial photo/video templates and the existing VYRO brand-kit assets.
- Browser-only demo workspace with generated demo ID, IndexedDB drafts, project import/export/delete, temporary uploads, and per-project asset selection.
- Photo editor: brightness, contrast, saturation, text overlay, PNG export.
- Experimental browser video editor: local preview, trim range, text overlay, WebM export where supported.
- Script Intake → AI Content Engine for structured hooks, narration, storyboard, visual prompts, captions, and review flags.
- Optional AI Image Studio per scene, provided by the separate AI Content Engine image adapter.
- AI Voice Studio integration for WAV synthesis using a server-configured voice profile and explicit rights confirmation.
- Final MP4 rendering through the separate Video Render Engine after manual approval.
- The website is deliberately disconnected from Instagram Publisher and Publishing Scheduler.

## Architecture boundaries
See:
- `docs/PRIME_STUDIO_ARCHITECTURE.md`
- `docs/COMPONENT_SERVICE_MAP.md`
- `docs/DEMO_PRIVACY_AND_ASSETS.md`

The seven repositories remain independently versioned. The site fetches remote component APIs configured through server-side environment variables; it does not copy Python source into this repository.

## Demo mode and privacy
No Google login or production account is implemented. A random `VYRO-DEMO-...` ID is stored locally, and draft metadata and file blobs are saved in browser IndexedDB. Demo drafts are not synced across devices and may be lost if browser storage is cleared. A demo ID is not a secure identity. Do not put confidential client assets into the demo.

The website API proxy validates demo IDs and has a best-effort in-memory rate limiter. Production requires durable rate limiting, verified authentication, audited access control, private object storage, and enforceable retention/deletion policies.

## Run locally
Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

The Vite browser demo works without backend credentials. To run serverless API proxies locally, install Vercel CLI and run:

```bash
npm install -g vercel
npm run dev:vercel
```

Build and checks:

```bash
npm run check:catalog
npm run check:js
npm run build
```

## Server-side environment
Copy `.env.example` into the Vercel project environment and set service URLs and keys for Script Intake, AI Content Engine, AI Voice Studio, and Video Render Engine. All production service URLs must use HTTPS. Keep keys server-side; never use `VITE_` names for secrets.

AI Image Studio requires the separate AI Content Engine to have `IMAGE_API_KEY` and a supported image model configured. Voice Studio requires a private, server-configured voice profile with documented authorization. Final render uses server-side FFmpeg.

## Media limits in the demo
- Browser upload max: 100 MB per file (subject to browser quota).
- Website-to-render proxy max: 2.5 MiB per raw file in this demo UI; larger files remain in browser storage and are not forwarded by this version.
- AI visual generation is subject to provider account quotas and usage costs.
- AI voice requires explicit rights confirmation; generated audio must be listened to before render.
- MP4 render requires manual human approval. The website never triggers Instagram publishing.

## Deployment and security
Deploy this repository through Vercel or another static host that supports its API proxy functions. Do not expose backend service keys to client-side JavaScript. Review service TTL, rate limits, access boundaries, data retention, and consent workflows before allowing external customers to use it.

## Demo security model and request limits

- Demo IDs are random browser-local namespaces, not credentials or verified identity.
- API proxies apply best-effort per-IP/per-route throttling in-process. Serverless instances may not share rate-limit state; use an edge/WAF rate limiter before opening costly generation endpoints to unrestricted public traffic.
- Browser-to-render asset forwarding is capped at 2.5 MiB per raw file so its base64 JSON body remains below the 4 MiB proxy limit. Larger source footage stays in browser storage and is not forwarded by this demo version.
- Local video editing/export is browser-dependent WebM; the server render pipeline currently composes approved scene images and voice audio into MP4. It does not yet perform arbitrary multi-track video editing.
