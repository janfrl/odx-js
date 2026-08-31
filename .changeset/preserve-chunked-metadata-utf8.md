---
'@me-tools/odx-nuxt': patch
---

Preserve UTF-8 characters split across metadata response chunks by decoding the
stream incrementally. Labels and other metadata text now reach validation,
caching and SDK generation without replacement characters caused by network
chunk boundaries.
