# VYRO MEDIA service map — Prime 3.0

| Repository | Website connection | Responsibility |
|---|---|---|
| `vyro-script-intake` | Yes, via `/api/v1/intake` | Validate and normalize script brief |
| `vyro-ai-content-engine` | Yes, via `/api/v1/content` and `/api/v1/images` | AI script, storyboard, caption, optional image generation |
| `vyro-ai-voice-studio` | Yes, via `/api/v1/voice` and `/api/v1/voice-file` | Consented voice synthesis and WAV artifacts |
| `vyro-video-render-engine` | Yes, via `/api/v1/assets`, `/api/v1/render`, `/api/v1/render-file` | Demo-scoped asset intake and final MP4 render |
| `vyro-instagram-publisher` | **No** | Internal/manual Instagram publishing only |
| `vyro-publishing-scheduler` | **No** | Internal operator queue and scheduling only |
| `vyro-media-library-site` | Website | Public library, browser demo, local drafts, editing UI, thin API proxies |

The later orchestrator may fetch the five independent processing/publishing components by pinned Git commit/tag. The public website must remain a thin client and must not vendor their backend source into its root repository.
