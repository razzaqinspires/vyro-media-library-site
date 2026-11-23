# VYRO MEDIA — Creative Media Library & Prime Studio

**Version:** 2.0.0  
**Purpose:** public creative library and browser-based experimental project workspace.

## Included
- Template-first media library and official VYRO brand assets.
- Demo session ID, IndexedDB drafts, local media uploads, and project-level asset permissions.
- Photo editor: brightness, contrast, saturation, text overlay, PNG export.
- Video editor: local preview, trim range, text overlay, experimental WebM export.
- API proxies to separate Script Intake, Content Engine, Voice Studio, and Render Engine services.

## Component boundaries
The website repository contains only the front end and thin API proxies. AI model code, voice model weights, FFmpeg rendering implementation, Instagram publishing, and scheduler logic remain in their own repositories. The website does not call the Instagram Publisher or Publishing Scheduler.

## Demo mode
No Google login or account system is enabled. A browser-local demo ID is generated. Draft metadata and uploaded blobs are stored in IndexedDB, with the ID in localStorage. Data is local to that browser profile and is not synced to another device. It may be lost when browser storage is cleared.

## Run
Requirements: Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev
```

Browser-local editing and drafts work in Vite. To exercise `/api/v1/*` service proxies locally, install the Vercel CLI (`npm install -g vercel`) and run `npm run dev:vercel`; Vite alone does not execute Vercel serverless functions.

Build and checks:

```bash
npm run check:catalog
npm run check:js
npm run build
```

## Server-side API environment
Copy `.env.example` to the Vercel project environment. Set the four service base URLs and corresponding API keys. Keep all API keys server-side; never expose them through `VITE_` variables. Service URLs must be HTTPS in production.

## Editing limitations
The browser photo editor exports PNG. The browser video editor exports WebM when MediaRecorder is available and is experimental; browser/device codecs vary. Final MP4 production must use `vyro-video-render-engine`. Selected project images and generated WAV audio can be forwarded through the Vercel proxy (3 MB per file in the demo UI). Render requests are rejected unless `review_approved=true`.

## Asset permissions
The current project access toggles are browser-local demo permissions. They do not grant access to another user. Multi-user collaboration, Google OAuth, server-side draft persistence, private object storage, and admin upload are future backend capabilities.

## Publisher boundary
Instagram publishing is intentionally not embedded in the website. `vyro-instagram-publisher` and `vyro-publishing-scheduler` remain operator/internal components with their own approval and credential requirements.
