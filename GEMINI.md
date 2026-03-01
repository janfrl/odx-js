# Nuxt SAP OData Module

This project is a Nuxt module designed to integrate SAP OData services into Nuxt applications. It provides automated type generation, a server-side proxy for OData requests, and a comprehensive DevTools UI for exploration and debugging.

## Project Overview

- **Core Technology:** Nuxt 4, TypeScript, h3, Nitro.
- **Architecture:** Monorepo using `pnpm` workspaces.
- **Packages:**
    - `packages/core`: Shared OData types and low-level utilities (e.g., `$odata`, entity set interfaces).
    - `packages/proxy`: Server handlers for proxying OData requests, fetching schemas from EDMX, and managing development logs.
    - `packages/nuxt`: The main Nuxt module (`nuxt-sap-odata`) that handles configuration, type generation via `odata2ts`, and DevTools registration.
    - `packages/explorer`: Source code for the custom DevTools UI (built with Nuxt UI and Vue).
- **Key Features:**
    - **OData Proxy:** Nitro server handlers (`packages/proxy/src/api/odata.ts`) manage authentication and proxy requests to SAP backends.
    - **Type Generation:** Automatically generates TypeScript models from EDMX files during the `prepare:types` hook using `odata2ts`.
    - **Composables:** Provides `useOData` for type-safe data fetching in the client-side code.
    - **DevTools Integration:** Custom explorer for inspecting service schemas, viewing request logs, and exploring entity data.

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
    pnpm run typecheck
    ```

### Production Build
- **Build the module:**
    ```bash
    pnpm run prepack
    ```

## Development Conventions

- **Monorepo Structure:** Internal packages use the `@bc8-odx` scope (e.g., `@bc8-odx/core`).
- **OData Strategy:** Services can be `proxied` (default) or `direct`. Proxied requests go through the Nitro server handler.
- **Type Safety:** The module uses a virtual type registry (`ODataServiceRegistry`) that is augmented during build time based on the configured services.
- **Environment Variables:** Configuration can be overridden or extended using environment variables prefixed with `NUXT_ODATA_SERVICES_` (e.g., `NUXT_ODATA_SERVICES_V2SERVICE_URL`).
- **Code Style:** Uses `@antfu/eslint-config` for consistent linting across the monorepo.
- **Testing:** Uses Vitest and `@nuxt/test-utils` for unit and integration testing.
