---
"@me-tools/odx-core": patch
---

Stop automatically logging backend error payloads and response objects from
`createODataClient`. HTTP failures still reject and explicit host error hooks
remain available. Preserve the client's generic parsed and raw response types
instead of returning `any`.
