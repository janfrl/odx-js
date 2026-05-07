# @bc8-odx/nuxt

The official Nuxt module for the ODX ecosystem. It provides type-safe OData composables, automated SDK generation, and native DevTools integration.

## Installation

```bash
pnpm add @bc8-odx/nuxt
```

## Verification

From the repository root:

```bash
pnpm --filter @bc8-odx/nuxt run verify
```

This runs the Nuxt package generation/module e2e tests, then prepares the
minimal Nuxt playground and verifies the generated ODX service registry types
plus typed composable usage in the playground app.

For full documentation, getting started guides, and module configuration, see
the root documentation in this repository.

## Service Names And Generated Types

Generated registry declarations preserve the configured service name as the
registry key. Service names that are valid TypeScript identifiers can be used
with dot notation, for example `useOData().V2Service`. For names that are not
valid identifiers, use bracket or functional access instead, for example
`useOData()['Sales-Order']` or `useOData('Sales-Order')`.

Service names are also used in generated output and metadata cache paths, so
avoid path separator characters such as `/` and `\` in service names.
