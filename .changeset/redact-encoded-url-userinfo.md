---
"@me-tools/odx-core": patch
---

Redact query and fragment values that contain fully or partially percent-encoded
URL userinfo before traffic logs are stored. Preserve ordinary OData query bytes
and leave the actual backend request unchanged.
