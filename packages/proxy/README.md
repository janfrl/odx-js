# @bc8-odx/proxy

An `h3`-based server proxy specifically designed for SAP OData services. It handles authentication, request interception, mock data serving, and development logging.

## Features

- **H3 Compatibility:** Designed to be used in Nitro and any H3-based server.
- **Traffic Monitor:** Integrated request and response logging for development.
- **Mock Server:** Support for serving local data based on EDMX definitions.
- **CSRF Handling:** Automated token management for secure SAP backend interactions.
- **Generation SDK:** Endpoints to trigger OData SDK generation dynamically.

## Installation

```bash
pnpm add @bc8-odx/proxy
```

## Usage

```typescript
import { createODataClient } from '@bc8-odx/proxy'

// Returns an ofetch instance configured with base OData settings
const client = createODataClient()

const products = await client('/Products', {
  query: { $top: 10 }
})
```

## Documentation & Usage

For comprehensive documentation on proxy configuration and advanced middleware usage, please visit the [main repository](https://github.com/Bechtle-AG/nuxt-sap-odata).
