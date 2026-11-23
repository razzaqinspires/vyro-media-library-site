# VYRO MEDIA Prime Studio — Architecture v2.0

## Website boundary
The public website is a Vite front end plus thin Vercel API proxy functions. It does not embed AI model code, voice model weights, FFmpeg, the Instagram publisher, or the scheduler. The seven component repositories remain independent.

## Website-connected components
1. `vyro-script-intake`: normalize and validate incoming briefs.
2. `vyro-ai-content-engine`: create structured ContentPackage JSON.
3. `vyro-ai-voice-studio`: synthesize audio only from a server-configured voice profile with explicit rights confirmation.
4. `vyro-video-render-engine`: produce reviewed 1080x1920 MP4 masters.

## Internal-only components
- `vyro-publishing-scheduler`: persistent queue and scheduling state.
- `vyro-instagram-publisher`: official Meta API publication.
Neither is called from the public demo website. Publishing must remain an explicit, separately authorized operator workflow.

## Demo identity and drafts
The demo creates a random browser-local ID. Project metadata and uploaded media blobs are stored in IndexedDB; the ID is stored in localStorage. This is not authentication, not a cloud account, and not cross-device sync. Clearing browser storage can erase the demo projects.

## Editing
Photo editing is client-side canvas processing with PNG export. Video editing is experimental browser MediaRecorder output (WebM where supported). Final MP4 rendering is delegated to the separate Render Engine API and requires a human-approved ContentPackage. Selected library images, local image uploads, and a generated WAV can be forwarded to the Render Engine through the server-side proxy; the demo proxy caps each forwarded file at 3 MB to stay within typical serverless request limits.

## API configuration
Configure Vercel server-side environment variables from `.env.example`. Local Vite mode provides the browser demo only; use `vercel dev` to execute API proxy functions locally. Do not use `VITE_` for secret keys. Each Python service requires a unique `VYRO_SERVICE_API_KEY`; the matching key is held only by the Vercel proxy environment. Use HTTPS between proxy and services.

## Media access
Library asset access is opt-in per project in the demo UI. Uploaded media remains in the current browser profile. No private file is shared with another visitor. Actual multi-user asset grants require a future authenticated backend and object storage.
