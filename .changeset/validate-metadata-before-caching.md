---
'@me-tools/odx-nuxt': patch
---

Validate downloaded CSDL before replacing temporary or persistent metadata
caches. Malformed successful responses fail preparation while preserving the
last valid cache for later offline use; persistence errors are no longer
misclassified as transport failures.
