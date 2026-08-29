---
"@me-tools/odx-core": patch
"@me-tools/odx-nuxt": patch
---

Reject malformed or unsupported MIME result parts and empty nested changesets instead of silently dropping their positions. Require multipart/mixed envelopes, application/http operation parts, and an HTTP status line at the start of each operation. Valid per-operation failures remain independent outcomes; malformed responses reject without automatic mutation replay.
