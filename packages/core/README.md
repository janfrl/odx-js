# @bc8-odx/core

The foundation of the `nuxt-sap-odata` ecosystem. This package contains framework-agnostic TypeScript types, generic OData utilities, and low-level fetchers.

## Features

- **Framework Agnostic:** Zero dependencies on Nuxt or Vue.
- **Type-Safe:** Shared interfaces for OData entities, sets, and service configurations.
- **Utilities:** Helpers like `flattenOData`, `sanitizeBaseURL`, and `stringifyQuery` for handling OData-specific data structures.
- **Server Interfaces:** Common contracts used across the proxy and generator.

## Installation

```bash
pnpm add @bc8-odx/core
```

## Usage

```typescript
import { $odata, flattenOData } from '@bc8-odx/core'

// Low-level OData request
const data = await $odata(myFetchClient, 'Northwind', 'GET', {
  entitySet: 'Products',
  query: { $top: 10 }
})

// Clean up OData-specific nesting (e.g., .d.results)
const cleanData = flattenOData(data)
```

## Documentation & Usage

For comprehensive documentation, configuration guides, and full ecosystem overview, please visit the [main repository](https://github.com/Bechtle-AG/nuxt-sap-odata).
