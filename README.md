# ODX: OData Developer Experience

[![Nuxt](https://img.shields.io/badge/Nuxt-4-green.svg)](https://nuxt.com)

A powerful ecosystem for seamless, type-safe integration with OData services. It provides a robust server-side proxy, automated TypeScript model generation, and a high-fidelity DevTools UI for exploration.

Documentation is maintained in this repository while the public documentation
site is not yet live.

ODX works with any standard OData V2/V4 endpoint. Additionally, it comes with first-class support for SAP systems out of the box (handling NetWeaver routing, basic auth, and automated CSRF-Token pre-fetching).

## 📦 Packages

This repository is a monorepo managed with `pnpm`.

| Package | Description |
| :--- | :--- |
| [`@bc8-odx/core`](./packages/core) | Core OData types and framework-agnostic utilities. |
| [`@bc8-odx/proxy`](./packages/proxy) | H3-based server proxy for OData backends. |
| [`@bc8-odx/nuxt`](./packages/nuxt) | The main Nuxt module and client-side composables. |
| [`@bc8-odx/explorer`](./packages/explorer) | Standalone UI for the ODX DevTools. |

## Repository Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - package boundaries, runtime flows, generation, deployment shape, and extension points.
- [`API.md`](./API.md) - durable module, composable, proxy, hook, and internal endpoint contracts.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - local development, SAP BTP MTA deployment, AppRouter routes, and operational checks.
- [`SECURITY.md`](./SECURITY.md) - trust boundaries, auth, headers, secrets, logging, CSRF, and review triggers.
- [`DOMAIN_MODEL.md`](./DOMAIN_MODEL.md) - stable ODX, OData, proxy, generation, and Explorer concepts.
- [`DESIGN.md`](./DESIGN.md) - Nuxt UI design system guidance for the docs site and Explorer.

## ✨ Features

- **Type-Safe SDK:** Automated TypeScript model generation from EDMX schemas using `odata2ts`.
- **Nuxt DevTools:** Integrated Traffic Monitor, Schema Explorer, and Entity Data browser.
- **Server Proxy:** Automated handling of authentication, CSRF tokens, and mock data.
- **Enterprise Optimized:** Specifically built for the nuances of OData V2 and V4.
- **Flexible Mocking:** Serve local mock data based on JSON files or EDMX definitions.
- **API Reference Automation:** Automatically extracted documentation from source code via `ts-morph`.

## 🚀 Quick Start

1. Install the module:

```bash
pnpm add @bc8-odx/nuxt
```

2. Configure your services in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@bc8-odx/nuxt'],
  odata: {
    services: [
      {
        name: 'Northwind',
        url: 'https://services.odata.org/V2/Northwind/Northwind.svc',
        route: 'northwind',
        icon: 'i-lucide-globe',
      },
    ]
  }
})
```

3. Use typed composables in your components:

```vue
<script setup lang="ts">
// Full type autocomplete for services and entity sets
const { data, refresh } = await useOData('Northwind').entitySet('Products').list()
</script>
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Prepare for development (generates types and stubs)
pnpm run dev:prepare

# Start development server with playground
pnpm run dev

# Run tests
pnpm run test

# Run package-level verification examples
pnpm run examples

# Regenerate API Reference
pnpm run docs:api
```

The API reference is automatically updated during `pnpm run docs:prepare`.

### Package verification

Use `pnpm run verify:packages` when you want the package-local confidence checks
in one command. It is additive: still run broad `lint`, `typecheck`, or
workspace `test` when the change scope calls for them.

| Command | What it verifies |
| :--- | :--- |
| `pnpm run example:core` | Runs the standalone core example against local fixtures, covering EDMX version detection, entity extraction, query stringification, OData response flattening, and the low-level `$odata` helper. |
| `pnpm run example:proxy` | Starts a local fixture backend and H3 proxy, then verifies proxied OData reads and header forwarding through `@bc8-odx/proxy`. |
| `pnpm run examples` | Runs the core and proxy standalone examples together for a quick package isolation smoke check. |
| `pnpm run verify:packages` | Runs the existing package-local verify scripts for core, proxy, Nuxt, Explorer, AppRouter, and docs without replacing broad `lint`, `typecheck`, or workspace `test`. |
| `pnpm run bench:proxy` | Runs the proxy performance benchmark and reports direct, buffered proxy, streamed proxy, concurrent, and DevTools logging timing baselines. |
| `pnpm --filter @bc8-odx/core run verify` | Runs the focused core Vitest tests and standalone fixture check through the package-local script. |
| `pnpm --filter @bc8-odx/proxy run verify` | Runs the proxy package Vitest suite and standalone fixture check through the package-local script. |
| `pnpm --filter @bc8-odx/nuxt run verify` | Runs the Nuxt package Vitest suite and minimal playground check through the package-local script. |
| `pnpm --filter @bc8-odx/explorer run verify` | Runs the Explorer package Vitest suite without the full workspace test run. |
| `pnpm --filter odx-approuter run verify` | Runs the AppRouter deployment config consistency check against `mta.yaml`. |
| `pnpm --filter docs run verify` | Runs docs metadata extraction and API reference extraction without starting the docs dev server. |
