---
'@me-tools/odx-nuxt': patch
'@me-tools/odx-proxy': patch
---

Build metadata request paths structurally so service query parameters such as
`sap-client` and `sap-language` remain after `/$metadata`. Preserve encoded
path/query values and omit fragments for Nuxt preparation and runtime metadata
refresh, including Destination-resolved URLs, without changing authentication.
