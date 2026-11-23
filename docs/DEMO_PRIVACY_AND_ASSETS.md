# Demo privacy, draft storage, and asset permissions

## What the demo stores
- Browser localStorage: one random `VYRO-DEMO-...` namespace identifier.
- Browser IndexedDB: project metadata, selected library assets, uploaded images/videos/audio, edited exports, generated image blobs, and draft content packages.
- Temporary service artifacts: optional generated images, WAV audio, temporary render assets, and MP4 output. These are namespaced by the demo ID and expire under the configured service TTL.

## What the demo does not provide
- No Google login, password, or verified account.
- No cross-device synchronization.
- No shared project or multi-user access grant.
- No permanent cloud asset storage or guaranteed backup.
- No direct Instagram publication, publishing schedule, or posting automation.

## Asset selection
Library access toggles are project-local choices. Only selected and allowed image assets are forwarded to the Render Engine. The user-upload section stores browser-local blobs. Users must only upload material they own or are licensed to use, and must obtain consent from identifiable people and voice subjects.

## Removing demo data
Use the project delete action to remove one draft and its IndexedDB file blobs. Clearing site data/browser storage removes all browser-local drafts. Server-side demo artifacts expire under service TTL configuration; they are not automatically synchronized with browser deletion.

## Important limitation
A random demo ID is a namespace, not authentication. Anyone who obtains a demo ID may attempt to use it while artifacts remain valid. Do not store confidential, sensitive, or client-restricted material in this demo. Production multi-user access requires identity, authorization, durable rate limiting, private object storage, audit logs, and data deletion controls.
