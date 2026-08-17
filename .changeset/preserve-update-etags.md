---
'@me-tools/odx-core': minor
'@me-tools/odx-nuxt': minor
---

Add an explicit optimistic-concurrency entity-set capability whose
`updateWithResponse` method preserves the next ETag from a conditional PATCH,
including valid bodyless 204 responses, without changing existing entity-set
contracts or the body-only update method.
