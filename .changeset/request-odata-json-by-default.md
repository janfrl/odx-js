---
'@me-tools/odx-core': patch
'@me-tools/odx-nuxt': patch
---

Request JSON responses by default for OData reads while preserving explicit
caller header overrides, so V2 Atom defaults cannot leak non-serializable
payloads into Nuxt SSR.
