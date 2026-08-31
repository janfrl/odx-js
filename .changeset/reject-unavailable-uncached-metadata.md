---
'@me-tools/odx-nuxt': patch
---

Reject Nuxt type preparation when remote service metadata cannot be downloaded
and no metadata cache exists, instead of silently generating an incomplete
service registry. Preserve validated temporary and persistent cache fallbacks.
