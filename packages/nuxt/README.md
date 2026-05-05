# @bc8-odx/nuxt

The official Nuxt module for the ODX ecosystem. It provides type-safe OData composables, automated SDK generation, and native DevTools integration.

## Installation

```bash
pnpm add @bc8-odx/nuxt
```

## Verification

From the repository root:

```bash
pnpm.cmd --filter @bc8-odx/nuxt run verify
```

This runs the Nuxt package generation/module e2e tests, then prepares the
minimal Nuxt playground and verifies the generated ODX service registry types
plus typed composable usage in the playground app. Use `pnpm.cmd` on Windows
PowerShell in this repository when `.ps1` launchers are blocked.

**For full documentation, getting started guides, and module configuration, please visit: [odx-js.io/packages/nuxt](https://odx-js.io/packages/nuxt)**

## Service Names And Generated Types

Generated registry declarations preserve the configured service name as the
registry key. Service names that are valid TypeScript identifiers can be used
with dot notation, for example `useOData().V2Service`. For names that are not
valid identifiers, use bracket or functional access instead, for example
`useOData()['Sales-Order']` or `useOData('Sales-Order')`.

Service names are also used in generated output and metadata cache paths, so
avoid path separator characters such as `/` and `\` in service names.
