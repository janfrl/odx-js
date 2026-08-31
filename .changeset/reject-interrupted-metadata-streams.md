---
'@me-tools/odx-nuxt': patch
---

Reject aborted, incomplete or failed metadata response streams instead of
leaving the download pending or emitting an unhandled stream error. Preserve
normal complete responses and validated offline-cache fallback without caching
partial bodies.
