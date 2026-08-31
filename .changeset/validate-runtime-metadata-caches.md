---
'@me-tools/odx-proxy': patch
---

Validate runtime metadata with the shared CSDL parser and the V2/V4 EDMX
envelope before replacing cache files. Reject malformed successful responses
and invalid cached XML. If the temporary cache is damaged, use a valid
persistent copy for explicit stale fallback; fail when neither copy is valid.
