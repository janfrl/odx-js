# Nuxt SAP OData Module (ODX)

This project is a modern Nuxt module (ODX - OData Developer Experience) designed for seamless integration of SAP OData services into Nuxt applications. It provides automated type generation, a server-side proxy for OData requests (supporting BTP destinations), and a comprehensive DevTools UI for schema exploration and request debugging.

## Project Overview

- **Core Technology:** Nuxt 4, TypeScript, h3, Nitro, `odata2ts`.
- **Architecture:** Monorepo managed with `pnpm` workspaces.
- **Packages:**
    - `packages/core`: Shared OData types, utilities, and low-level OData client (`$odata`).
    - `packages/proxy`: Server-side handlers for proxying OData requests. Includes support for BTP destinations via `@sap-cloud-sdk/connectivity`.
    - `packages/nuxt`: The main Nuxt module that handles configuration, type generation during the `prepare:types` hook, and DevTools integration.
    - `packages/explorer`: A dedicated Nuxt application that serves as the DevTools UI for exploring OData schemas and inspecting request logs.
    - `packages/approuter`: (Optional) SAP AppRouter configuration for deployment in SAP BTP.
- **Key Features:**
    - **OData Proxy:** Nitro server handlers manage authentication (Basic, Bearer, BTP Destinations) and proxy requests to SAP backends.
    - **Type Generation:** Automatically generates TypeScript models and interfaces from EDMX metadata files during development (`prepare:types` hook) or build time.
    - **Type-Safe Composables:** Provides `useOData` for fully typed data fetching in the client-side code, leveraging the generated models.
    - **DevTools Integration:** Custom explorer accessible within Nuxt DevTools for inspecting service schemas, viewing live request logs, and exploring entity data.

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
3.  **Start development mode:** (Runs the playground with the module and the explorer UI)
    ```bash
    pnpm run dev
    ```

### Testing and Linting
- **Run all tests:**
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
    pnpm run typecheck
    ```

### Production Build
- **Build the entire project (including MTA for BTP):**
    ```bash
    pnpm run build
    ```
- **Prepare the module for publishing:**
    ```bash
    pnpm run prepack
    ```

## Development Conventions

- **Monorepo Structure:** Internal packages use the `@bc8-odx` scope (e.g., `@bc8-odx/core`).
- **OData Strategy:** Services can be configured as `proxied` (default, routes through Nitro) or `direct` (direct browser-to-backend calls).
- **Environment Overrides:** Configuration for services can be dynamically overridden using environment variables prefixed with `NUXT_ODATA_SERVICES_<SERVICE_NAME>_` (e.g., `NUXT_ODATA_SERVICES_V2SERVICE_URL`).
- **Code Style:** Strictly adheres to `@antfu/eslint-config`.
- **Testing:** Uses Vitest and `@nuxt/test-utils` for both unit tests and e2e integration tests. Integration tests for the proxy and module often use the `playground` or `test/fixtures/basic`.
- **Type Safety:** The module augments the `ODataServiceRegistry` interface in `@bc8-odx/core` with service-specific types during the `prepare:types` hook.

## Deployment (SAP BTP)

- The project includes an `mta.yaml` for building and deploying to SAP BTP.
- The `packages/approuter` provides the entry point for BTP managed approuter or standalone approuter scenarios.
- Deployment can be triggered via `pnpm run deploy` if the Cloud Foundry CLI and MTA plugin are installed.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
