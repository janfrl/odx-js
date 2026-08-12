---
'@me-tools/odx-core': minor
'@me-tools/odx-nuxt': patch
---

Expose portable request options for imperative OData reads and mutations, and
declare OData V4 aggregation pipelines as a typed query option. Framework
adapters can now share cancellation, header, and analytical-query contracts
without importing a transport implementation, and the Nuxt adapter implements
that named contract directly.
