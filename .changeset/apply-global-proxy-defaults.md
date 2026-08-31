---
"@me-tools/odx-proxy": patch
---

Apply configured global auth and header defaults to normal proxied data requests
in both standalone H3 and Nitro. Preserve service-profile selection without
mixing partial credentials, case-insensitive service/incoming header precedence,
Destination credential ownership, disabled incoming auth forwarding and the
direct-bridge boundary. Add real buffered/streamed HTTP contracts for both entry
paths plus relative and development fallback credential checks.
