# Nuxt SAP OData Module

This project is a Nuxt module designed to integrate SAP OData services into Nuxt applications using the SAP Cloud SDK. It handles client generation from EDMX files, provides composables for data fetching, and includes built-in DevTools support.

## Project Overview

- **Core Technology:** Nuxt 4, TypeScript, SAP Cloud SDK.
- **Main Goal:** Simplify SAP OData consumption in Nuxt by automating client generation and providing a streamlined API for proxying and fetching data.
- **Architecture:**
    - `src/module.ts`: Main entry point defining module options, hooks, and registrations.
    - `src/runtime/`: Runtime code (composables, server handlers, utilities) injected into the Nuxt app.
    - `src/generate.ts`: Integration with `@sap-cloud-sdk/generator` to generate OData clients from EDMX files during build time.
    - `client/`: Source code for the custom DevTools UI.
    - `playground/`: A Nuxt application used for local development and manual testing of the module.
    - `test/`: Automated tests using Vitest and Nuxt Test Utils.

## Building and Running

### Development
1.  **Install dependencies:**
    ```bash
    pnpm install
    ```
2.  **Prepare for development:** (Generates type stubs and prepares the playground)
    ```bash
    pnpm run dev:prepare
    ```
3.  **Start development mode:** (Runs the playground with the module)
    ```bash
    pnpm run dev
    ```

### Testing and Linting
- **Run tests:**
    ```bash
    pnpm run test
    ```
- **Run tests in watch mode:**
    ```bash
    pnpm run test:watch
    ```
- **Lint the codebase:**
    ```bash
    pnpm run lint
    ```
- **Type check:**
    ```bash
    pnpm run test:types
    ```

### Production Build
- **Build the module:**
    ```bash
    pnpm run prepack
    ```

## Development Conventions

- **Nuxt Module Structure:** Adheres to standard Nuxt module patterns using `@nuxt/kit`.
- **SAP Cloud SDK:** Leverages the official SAP Cloud SDK for OData client generation and type safety.
- **Server Proxies:** OData requests are proxied through Nitro server handlers (`src/runtime/server/api/odata.ts`) to handle authentication and bypass CORS.
- **Composables:** Uses `useOData` as the primary entry point for fetching data in the client-side code.
- **DevTools:** Integrates with Nuxt DevTools to provide insights into OData services, logs, and configuration.
- **Code Style:** Uses ESLint for linting, following Nuxt-specific configurations.
- **Typing:** Strict TypeScript usage is encouraged, especially for OData entities and service definitions.
