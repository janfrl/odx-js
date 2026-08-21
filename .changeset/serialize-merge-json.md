---
"@me-tools/odx-core": patch
---

Serialize OData MERGE record bodies explicitly as JSON so Fetch-compatible
clients and the Nuxt proxy preserve the payload instead of coercing it to
`[object Object]`.
