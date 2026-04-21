# ODX: OData Developer Experience

[![Nuxt](https://img.shields.io/badge/Nuxt-4-green.svg)](https://nuxt.com)
[![Documentation](https://img.shields.io/badge/Documentation-ODX-blue.svg)](https://odx.nuxt.com)

A powerful ecosystem for seamless, type-safe integration with OData services. It provides a robust server-side proxy, automated TypeScript model generation, and a high-fidelity DevTools UI for exploration.

**Check out the [Official Documentation](https://odx.nuxt.com) for guides, tutorials, and API reference.**

ODX works with any standard OData V2/V4 endpoint. Additionally, it comes with first-class support for SAP systems out of the box (handling NetWeaver routing, basic auth, and automated CSRF-Token pre-fetching).

## 📦 Packages

This repository is a monorepo managed with `pnpm`.

| Package | Description |
| :--- | :--- |
| [`@bc8-odx/core`](./packages/core) | Core OData types and framework-agnostic utilities. |
| [`@bc8-odx/proxy`](./packages/proxy) | H3-based server proxy for OData backends. |
| [`@bc8-odx/nuxt`](./packages/nuxt) | The main Nuxt module and client-side composables. |
| [`@bc8-odx/explorer`](./packages/explorer) | Standalone UI for the ODX DevTools. |

## ✨ Features

- **Type-Safe SDK:** Automated TypeScript model generation from EDMX schemas using `odata2ts`.
- **Nuxt DevTools:** Integrated Traffic Monitor, Schema Explorer, and Entity Data browser.
- **Server Proxy:** Automated handling of authentication, CSRF tokens, and mock data.
- **Enterprise Optimized:** Specifically built for the nuances of OData V2 and V4.
- **Flexible Mocking:** Serve local mock data based on JSON files or EDMX definitions.

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
```
