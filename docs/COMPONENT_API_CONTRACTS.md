# Component API Contracts

All website-facing API calls are proxied server-side by Vercel functions. Each component has its own `VYRO_SERVICE_API_KEY`. Never place these keys in browser JavaScript or `VITE_` variables.

| Component | Website proxy | Service endpoint |
|---|---|---|
| Script Intake | `/api/v1/intake` | `POST /v1/briefs/normalize` |
| Content Engine | `/api/v1/content` | `POST /v1/content/generate` |
| Voice Studio | `/api/v1/voice` | `POST /v1/voice/synthesize` |
| Render Engine | `/api/v1/render` | `POST /v1/render` |

The browser sends a draft brief to Script Intake; normalized data is passed to Content Engine. The resulting ContentPackage remains unapproved. Voice synthesis requires an explicitly authorized server-side voice profile and a consent confirmation. Final rendering requires an explicit human approval field.

The current Vercel proxies are JSON request/response bridges. They do not persist projects or upload user media to cloud storage. Demo uploads remain in IndexedDB. A production media-upload workflow requires a dedicated authenticated upload endpoint and object-storage policy.
