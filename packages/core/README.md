# @me-tools/odx-core

Framework-agnostic OData types and low-level utilities for handling results,
metadata, query stringification, and safe resource-path construction.

The package also exports `prepareSapCsrfHeaders` and `fetchWithCsrf` for
server/edge transports. These helpers are not browser transports: browsers
cannot read SAP `Set-Cookie` responses or emit the matching `Cookie` header.
Browser applications should send mutations through `@me-tools/odx-proxy`.

Portable path helpers include `formatODataKey`, `createODataEntityPath`,
`formatODataNavigationPath`, `formatODataFunctionCall`, `joinODataPath`, and identifier validators. They
construct service-relative protocol paths without depending on Nuxt, Node.js,
or a transport client.

For optimistic concurrency, `$odataWithResponse` is the additive low-level
entity read. It returns `{ data, etag? }`, preferring the HTTP `ETag` header
and falling back to OData V4 or V2 body annotations. `$odata` remains the
body-only helper, and arbitrary response headers are not exposed.
`$odataMutationWithResponse` is the mutation counterpart. Its `data` property
is optional because a valid PATCH may return `204 No Content` while still
providing the next ETag.

The `@me-tools/odx-core/server` entry also projects parsed
`@me-tools/odx-metadata` documents into the established entity, navigation,
association, and version contracts. This is the migration boundary away from
the legacy file-based EDMX extractor.

## Installation

```bash
pnpm add @me-tools/odx-core
```

## Verification

From the repository root:

```bash
pnpm --filter @me-tools/odx-core run verify
```

This runs the focused core Vitest tests and then the same standalone core
fixture check as `pnpm run example:core`. It verifies package utilities and
parsing behavior, plus framework-free usage for EDMX version detection, entity
extraction, query stringification, OData response flattening, and the low-level
`$odata` helper.

For full documentation, architecture details, and API reference, see the root
documentation in this repository.
