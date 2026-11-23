# VYRO MEDIA Prime Studio — Architecture 3.0

## Public website boundary
The website is a Vite front end plus thin Vercel API proxy functions. It does not embed Python component source, AI model weights, VoxCPM model files, FFmpeg binaries, database internals, Instagram publishing, or scheduler implementation. Each service stays in its own repository and is called through server-side environment URLs and service keys.

## Website-connected components
1. `vyro-script-intake`: validates and normalizes structured content briefs.
2. `vyro-ai-content-engine`: creates hooks, narration, visual prompts, storyboards, caption, and review flags. Optional AI images are exposed through the same service API.
3. `vyro-ai-voice-studio`: synthesizes WAV narration from a configured voice profile with explicit rights confirmation.
4. `vyro-video-render-engine`: accepts demo-scoped assets and produces MP4 masters after a human approval gate.

## Explicitly disconnected from the website
- `vyro-instagram-publisher`: operator-only Instagram publishing component.
- `vyro-publishing-scheduler`: internal publishing queue and scheduling component.

The public Studio Demo must not contain a button, API call, credential, proxy, or direct route to either publishing repository. Instagram publication is a separately authorized operator process.

## Demo identity and drafts
No Google OAuth or real account is enabled. A browser-local ID is created with the `VYRO-DEMO-` prefix. The ID is retained in `localStorage`; projects and uploaded media blobs are stored in IndexedDB. Project drafts are local to the browser profile and are not synced across devices. Clearing browser data may remove the demo content. The ID is a namespace, not a verified identity or secure login. Browser export stores a maximum of 12 MiB raw attachments to keep the resulting JSON/base64 file under the 20 MiB import limit.

The website API proxies validate the demo ID, apply best-effort in-memory per-IP/per-route request limits, keep service keys server-side, and forward demo IDs to media-producing services. The Python services derive private namespaces from demo IDs and apply TTL cleanup. This is adequate for a limited demo, not a substitute for production authentication, durable rate limiting, authorization, or object-storage policy.

## Media access and permissions
The project UI offers opt-in library-asset selections and local file uploads. Uploaded files require the user's rights confirmation before Render forwarding. These choices control what that browser demo sends to the Render service for the current project. They do not create cross-user collaboration or server-managed ACLs. Multi-user sharing requires authenticated accounts and a durable authorization backend in a later phase.

## Editing and AI tools
- Photo editor: browser canvas, brightness/contrast/saturation, text overlay, PNG export.
- Video editor: preview, trim, text overlay, browser `MediaRecorder` WebM export where supported. This is experimental and device/browser codecs differ. The server render pipeline currently composes approved still-image scenes and WAV narration; full arbitrary multi-track video editing is not part of this release.
- AI content: Script Intake → AI Content Engine; generated content always requires human review.
- AI image: optional Image API adapter in the AI Content Engine; image API credentials remain on the service, not in browser JavaScript.
- AI voice: Voice Studio profile must exist on the server and the user must confirm rights; listen to the complete WAV before rendering.
- Final render: browser forwards only permitted images and voiceover to the separate Render Engine. Final MP4 output uses FFmpeg server-side.

## Environment configuration
Set server-side Vercel variables from `.env.example`: four service URLs and four matching service keys. Production service URLs must use HTTPS. Never expose these secrets through `VITE_` variables.

Vite dev mode runs the browser-local parts. Use `vercel dev` to run the Vercel API proxies locally. The Studio Demo shows a service-not-configured error until the backend URLs/keys are configured.

## Demo retention
- Browser drafts: stale projects are removed after 30 days when the demo initializes; the user can delete a project sooner.
- AI image artifacts: service-side TTL (default 48 hours).
- Voice artifacts: service-side TTL (default 48 hours).
- Render assets: service-side TTL (default 48 hours).
- Render outputs: service-side TTL (default 72 hours).

Retention periods are configurable server-side. They are experimental demo settings and must be reviewed before production scale.
