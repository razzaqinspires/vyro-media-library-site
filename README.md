# VYRO MEDIA — Creative Media Library

A responsive, searchable media-library website for VYRO MEDIA (`@vyromedia.id`). The first visible content section is **Template Visual Konten**, with three square photo templates and three vertical MP4 video templates. The homepage then surfaces the official **Copyright & Logo** collection and the wider library catalog.

## Features

- Template-first homepage: 3 photo templates (1:1) and 3 video templates (9:16).
- Official brand library imported from VYRO MEDIA Brand Kit v1.0: logo symbol variants, full logo lockups, transparent masters, profile concepts, square banners, 12 Instagram highlight covers, and brand documentation.
- Search, category filters, type filters, sort, asset details, direct download, responsive layouts, and shareable file links.
- Asset inventory generated from actual files in `public/library/` and maintained in `public/data/library.json`.
- Upcoming empty categories (Motion & Overlay, Audio & Voice, Fonts, Icons) are explicitly marked as coming soon; no inventory counts are invented.
- No fictional library counts, customer testimonials, or client portfolio claims.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm. Vite 8 uses the current supported Node runtime ranges.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. For a production build:

```bash
npm run build
npm run preview
```

## Deployment

The site is a static Vite build and can be deployed to Vercel, Netlify, Cloudflare Pages, or any static host. Build command: `npm run build`; output directory: `dist`. Update `public/robots.txt` and `public/sitemap.xml` with the real domain before production.

## Library maintenance

1. Place new media under `public/library/<category>/`.
2. Add a matching object to `public/data/library.json` (id, title, category, type, preview, download, description, tags, format, license).
3. Run `npm run check:catalog`.
4. Run `npm run build`, inspect the mobile and desktop views, then commit.

The current site is a public, read-only catalog. It does **not** yet provide authenticated uploads, cloud storage, user accounts, payment, private collections, or an admin panel. Implement those through a backend and object storage before enabling public upload.

## Asset formats

- Photo templates: PNG, 1080 × 1080.
- Video templates: MP4, 720 × 1280, 24 fps, 6 seconds, no audio; each has a poster and storyboard JSON. These are starter motion templates, not editable NLE project files.
- Existing social artwork: primarily PNG, 1080 × 1080.

## Brand system

- Black: `#050709`
- White: `#F7F9F6`
- Neon lime: `#B8FF00`
- Dark surface: `#0D1116`
- Neutral gray: `#5A6267`
- Font: Inter; system sans-serif fallback.

## Copyright and usage

The logo and brand-kit files are displayed as VYRO MEDIA identity assets. The template files are original starter designs made for this library. Do not sell the raw assets as a standalone stock pack or imply that third-party stock footage, fonts, music, or other licenses are included. Obtain separate rights for any external photos, music, talent, or client materials added later. No trademark clearance or registration status is implied.

## Known limitations

- `public/data/library.json` is a static manifest; editing the library requires a code/content update and redeployment.
- Search and filters run in the browser.
- No server-side analytics or download tracking is configured.
- The social link is set to `https://instagram.com/vyromedia.id`.
