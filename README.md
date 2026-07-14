# ODX: OData Developer Experience

[![Nuxt](https://img.shields.io/badge/Nuxt-4-green.svg)](https://nuxt.com)

A powerful ecosystem for seamless, type-safe integration with OData services. It provides a robust server-side proxy, automated TypeScript model generation, and a high-fidelity DevTools UI for exploration.

Documentation is maintained in this repository while the public documentation
site is not yet live.

ODX works with any standard OData V2/V4 endpoint. Additionally, it comes with first-class support for SAP systems out of the box (handling NetWeaver routing, basic auth, and automated CSRF-Token pre-fetching).

ODX is maintained under the company-neutral Modern Enterprise Tools (`me-tools`)
organization.

## 📦 Packages

This repository is a monorepo managed with `pnpm`.
All five ODX product packages below are configured for public publication, but
have not yet been published. The
`packages/approuter` workspace is a private SAP BTP deployment module, not a
reusable npm package.


| Package | Description |
| :--- | :--- |
| [`@me-tools/odx-metadata`](./packages/metadata) | Loss-aware, framework-neutral XML and JSON CSDL ingestion. |
| [`@me-tools/odx-core`](./packages/core) | Core OData types and framework-agnostic utilities. |
| [`@me-tools/odx-proxy`](./packages/proxy) | H3-based server proxy for OData backends. |
| [`@me-tools/odx-nuxt`](./packages/nuxt) | The main Nuxt module and client-side composables. |
| [`@me-tools/odx-explorer`](./packages/explorer) | Standalone UI for the ODX DevTools. |

## Repository Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - package boundaries, runtime flows, generation, deployment shape, and extension points.
- [`API.md`](./API.md) - durable module, composable, proxy, hook, and internal endpoint contracts.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) - local development, SAP BTP MTA deployment, AppRouter routes, and operational checks.
- [`SECURITY.md`](./SECURITY.md) - trust boundaries, auth, headers, secrets, logging, CSRF, and review triggers.
- [`DOMAIN_MODEL.md`](./DOMAIN_MODEL.md) - stable ODX, OData, proxy, generation, and Explorer concepts.
- [`DESIGN.md`](./DESIGN.md) - Nuxt UI design system guidance for the docs site and Explorer.
- [research/](./research/) - durable ecosystem and architecture research, including the Nuxt Fiori direction.

## ✨ Features

- **Loss-Aware Metadata:** Versioned XML and JSON CSDL ingestion for semantic tooling.
- **Type-Safe SDK:** Automated TypeScript model generation from EDMX schemas using `odata2ts`.
- **Nuxt DevTools:** Integrated Traffic Monitor, Schema Explorer, and Entity Data browser.
- **Server Proxy:** Automated handling of authentication, CSRF tokens, and mock data.
- **Enterprise Optimized:** Specifically built for the nuances of OData V2 and V4.
- **Flexible Mocking:** Serve local mock data based on JSON files or EDMX definitions.
- **API Reference Automation:** Automatically extracted documentation from source code via `ts-morph`.

## 🚀 Quick Start

1. Install the module:

```bash
pnpm add @me-tools/odx-nuxt
```

2. Configure your services in `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@me-tools/odx-nuxt'],
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
The supported toolchain is Node.js 22 or 24 with pnpm 10 or 11. The repository
pins the pnpm version used by CI through `packageManager`.


```bash
# Install dependencies
pnpm install

# Prepare for development (generates types and stubs)
pnpm run dev:prepare

# Start development server with playground
pnpm run dev

# Run the complete repository gate
pnpm run verify

# Build all publishable packages
pnpm run build

# Build the SAP BTP deployment archive
pnpm run build:deployment

# Regenerate API Reference
pnpm run docs:api
```

The API reference is automatically updated during `pnpm run docs:prepare`.

### Package verification

`pnpm run verify` is the complete repository gate. Use
`pnpm run verify:packages` when you specifically need the package-local checks
without the surrounding lint, workspace typecheck, and publication checks.

| Command | What it verifies |
| :--- | :--- |
| `pnpm run example:core` | Runs the standalone core example against local fixtures, covering EDMX version detection, entity extraction, query stringification, OData response flattening, and the low-level `$odata` helper. |
| `pnpm run example:proxy` | Starts a local fixture backend and H3 proxy, then verifies proxied OData reads and header forwarding through `@me-tools/odx-proxy`. |
| `pnpm run examples` | Runs the core and proxy standalone examples together for a quick package isolation smoke check. |
| `pnpm run verify:packages` | Runs the package-local verify scripts for metadata, core, proxy, Nuxt, Explorer, AppRouter, and docs without replacing broad `lint`, `typecheck`, or workspace `test`. |
| `pnpm run bench:proxy` | Runs the proxy performance benchmark and reports direct, buffered proxy, streamed proxy, concurrent, and DevTools logging timing baselines. |
| `pnpm --filter @me-tools/odx-metadata run verify` | Runs the loss-aware CSDL parser corpus, security cases, serialization, and deterministic hashing checks. |
| `pnpm --filter @me-tools/odx-core run verify` | Runs the focused core Vitest tests and standalone fixture check through the package-local script. |
| `pnpm --filter @me-tools/odx-proxy run verify` | Runs the proxy package Vitest suite and standalone fixture check through the package-local script. |
| `pnpm --filter @me-tools/odx-nuxt run verify` | Runs the Nuxt package Vitest suite and minimal playground check through the package-local script. |
| `pnpm --filter @me-tools/odx-explorer run verify` | Runs the Explorer package Vitest suite without the full workspace test run. |
| `pnpm --filter odx-approuter run verify` | Runs the AppRouter deployment config consistency check against `mta.yaml`. |
| `pnpm --filter docs run verify` | Runs docs metadata extraction and API reference extraction without starting the docs dev server. |
