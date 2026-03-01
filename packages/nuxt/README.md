# @bc8-odx/nuxt

[![Nuxt](https://img.shields.io/badge/Nuxt-4-green.svg)](https://nuxt.com)

The official Nuxt module for seamless SAP OData integration. It acts as the glue between your Nuxt application, the type-safe OData SDK, and the development explorer.

## Features

- **Type-Safe Composables:** `useOData` for reactive, typed data fetching.
- **Auto-Imports:** Automatic injection of OData utilities and composables.
- **DevTools Integration:** Native Nuxt DevTools tab for traffic monitoring and schema exploration.
- **Zero Config Proxy:** Automatically sets up the server-side proxy for configured services.
- **Schema Generation:** Automated TypeScript model generation during the build process.

## Installation

```bash
pnpm add @bc8-odx/nuxt
```

## Quick Start

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@bc8-odx/nuxt'],
  odata: {
    services: [
      {
        name: 'Northwind',
        url: 'https://services.odata.org/V2/Northwind/Northwind.svc',
        strategy: 'direct',
        icon: 'i-lucide-globe',
      },
    ]
  }
})
```

## Usage

```vue
<script setup lang="ts">
// Full type autocomplete for services and entity sets
const { data, refresh } = await useOData('Northwind').entities('Products').list()
</script>

<template>
  <pre>{{ data }}</pre>
</template>
```

## Documentation & Usage

For detailed setup instructions, API references, and advanced usage patterns, please visit the [main repository](https://github.com/Bechtle-AG/nuxt-sap-odata).
