# @bc8-odx/explorer

A high-fidelity Vue/Nuxt UI for exploring OData services. This package serves as the core interface for the `nuxt-sap-odata` DevTools.

## Features

- **Traffic Monitor:** Real-time inspection of OData requests and responses.
- **Schema Explorer:** Interactive visualization of Entity Types, Complex Types, and Associations.
- **Entity Data Browser:** Tabular view for browsing and filtering live entity data.
- **Modern Tech Stack:** Built with Nuxt UI, Vue Flow, Elkjs, and Shiki for a premium developer experience.

## Installation

This package is managed as part of the `nuxt-sap-odata` monorepo.

```bash
pnpm add @bc8-odx/explorer
```

## Integration

The explorer is typically integrated into a Nuxt application via the `@bc8-odx/nuxt` module. During development, it communicates with the `@bc8-odx/proxy` API to fetch schemas and request logs.

## Documentation & Usage

For information on how to access and use the OData Explorer within your Nuxt projects, please visit the [main repository](https://github.com/Bechtle-AG/nuxt-sap-odata).
