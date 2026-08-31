---
'@me-tools/odx-nuxt': patch
---

Apply configured global and service headers to SDK metadata downloads using
case-insensitive service precedence. Preserve explicit auth selection, request
XML metadata, and exclude transport-managed connection, framing, proxy and
compression headers. This enables API-key-protected metadata endpoints without
changing runtime Destination or BTP authentication.
