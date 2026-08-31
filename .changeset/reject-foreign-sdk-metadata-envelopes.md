---
'@me-tools/odx-nuxt': patch
---

Require a parsed OData V2/V4 EDMX envelope before SDK metadata is accepted.
Well-formed HTML and foreign XML no longer replace valid metadata caches or
reach SDK generation. Preserve prefix-independent EDMX and apply the same
check to selected offline caches and local metadata input.
