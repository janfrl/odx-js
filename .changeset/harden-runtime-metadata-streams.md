---
'@me-tools/odx-proxy': patch
---

Preserve multibyte UTF-8 text across runtime metadata response chunks and reject
aborted, prematurely closed or errored response streams. Keep the existing
explicit stale-cache fallback without caching partial responses, and allow a
subsequent refresh to recover normally.
