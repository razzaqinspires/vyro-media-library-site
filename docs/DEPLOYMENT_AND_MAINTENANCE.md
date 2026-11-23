# Deployment & Maintenance

## Vercel

- Framework preset: Vite (or Other).
- Install: `npm install`.
- Build: `npm run build`.
- Output: `dist`.
- No environment variables required for the static site.

## Domain and SEO

- Replace `YOUR-DOMAIN.example` in `public/robots.txt` and `public/sitemap.xml`.
- Update `og:url` / Open Graph image metadata when a real domain and production social image exist.
- Add Search Console and an analytics provider only after privacy and cookie requirements are reviewed.

## Adding assets

Put files into `public/library/`, then register them in `public/data/library.json`. Use unique lowercase IDs, descriptive filenames, concise descriptions, a preview path, a download path, file format, and a rights statement. Keep large video files optimized for web delivery.

## Dynamic uploads (future)

The current frontend is read-only. For multi-user upload, add authentication, role-based authorization, server-side file validation, virus scanning, object storage, signed upload/download URLs, audit logs, and explicit license/consent metadata. Do not expose storage service credentials in frontend JavaScript.
