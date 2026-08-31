---
"@me-tools/odx-nuxt": patch
---

Use a fresh HTTP(S) connection for each build-time metadata download. Synchronous
SDK generation can delay processing an upstream idle close, making a pooled
socket unsafe to reuse for the next service. Retain request authentication,
TLS policy, timeouts and cache/error handling without introducing retries or
changing application-runtime OData connection pooling.
