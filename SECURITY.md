# Security Policy — VYRO MEDIA Library

## Scope
This repository contains the public website and thin server-side API proxies. AI model keys, voice reference samples, generated media storage, FFmpeg, and internal publisher/scheduler credentials must remain in their respective services.

## Demo mode limitations
The browser demo uses a random local demo ID as a temporary namespace. It is not authentication. Do not upload confidential client data, identity documents, private recordings, or media for which you do not have rights. Demo assets expire according to server TTL, but browser-local IndexedDB data remains until deleted or cleared by the user.

## Secrets
- Never commit `.env`, access tokens, service keys, voice profile samples, or production credentials.
- Website service keys must be configured as server-side Vercel environment variables and must not use a `VITE_` prefix.
- Use separate, high-entropy service keys for Intake, Content, Voice, and Render.
- Do not configure Instagram Publisher or Scheduler credentials in the website project.

## Reporting
Do not open a public issue with credentials or personal data. Contact the repository maintainer privately and include a minimal reproduction with secrets removed.
