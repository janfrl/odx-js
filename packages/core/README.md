# @bc8-odx/core

Framework-agnostic OData types and low-level utilities for handling results, metadata, and query stringification.

## Installation

```bash
pnpm add @bc8-odx/core
```

## Verification

From the repository root:

```bash
pnpm.cmd --filter @bc8-odx/core run verify
```

This runs the same standalone core fixture check as `pnpm.cmd run example:core`.
It verifies the package can be used outside a framework for EDMX version
detection, entity extraction, query stringification, OData response flattening,
and the low-level `$odata` helper. Use `pnpm.cmd` on Windows PowerShell in this
repository when `.ps1` launchers are blocked.

**For full documentation, architecture details, and API reference, please visit: [odx-js.io/packages/core](https://odx-js.io/packages/core)**
