---
'@me-tools/odx-core': minor
'@me-tools/odx-nuxt': minor
---

Add the `ODataPagedEntitySet` and `ODataPagedService` contracts with SSR-safe
`listPage` and `fetchPage` collection reads that preserve OData V2 and V4 count
information in an explicit `{ items, totalCount }` result.
