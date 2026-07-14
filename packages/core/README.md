# @me-tools/odx-core

Framework-agnostic OData types and low-level utilities for handling results, metadata, and query stringification.

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
