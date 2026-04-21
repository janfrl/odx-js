# Data Model: Monorepo Dependency Graph

## Dependency Structure

The project MUST strictly adhere to the following dependency directions to comply with Principle I (Architectural Boundaries).

### 1. @bc8-odx/core
- **Purpose**: Shared types and utilities.
- **Allowed Dependencies**: None (External pure-TS libs like `ofetch` allowed).
- **Forbidden**: Nuxt, Vue, Nitro, any framework-specific packages.

### 2. @bc8-odx/proxy
- **Purpose**: Server-side OData request handling.
- **Allowed Dependencies**: `@bc8-odx/core`, `h3`.
- **Forbidden**: `@bc8-odx/nuxt`, `@nuxt/kit`, `@nuxt/schema`.

### 3. @bc8-odx/nuxt
- **Purpose**: Nuxt module integration.
- **Allowed Dependencies**: `@bc8-odx/core`, `@bc8-odx/proxy`, `@nuxt/kit`, `@nuxt/schema`.

### 4. @bc8-odx/explorer
- **Purpose**: DevTools UI.
- **Allowed Dependencies**: `@bc8-odx/core`, `@bc8-odx/proxy`, `nuxt`, `vue`.

## Verification Entities

- **PackageManifest**: Represents a `package.json` file in a package directory.
- **ImportDeclaration**: Represents an import statement in a `.ts` file.
- **JSDocNode**: Represents a documentation block for a public API.
