# Research: Constitutional Compliance Audit and Refactor

## Summary
The initial audit confirmed several critical violations of the project constitution, particularly regarding Principle I (Strict Architectural Boundaries) in the `packages/proxy` package.

## Findings

### 1. Package Boundary Violations
- **Problem**: `packages/proxy` currently has a workspace dependency on `@bc8-odx/nuxt` and imports `@nuxt/kit` in `nitro.config.ts` and `src/nitro.ts`.
- **Impact**: Violates the principle that the proxy MUST be framework-independent and usable in other Node.js/h3 environments.
- **Decision**: Remove `@bc8-odx/nuxt` and `@nuxt/kit` from `packages/proxy`. Use `pathe` for path resolution instead of `@nuxt/kit`'s `createResolver`.

### 2. Documentation Drift
- **Problem**: `./docs/content/3.proxy/1.introduction.md` and related files may still describe the proxy as tightly coupled with Nuxt.
- **Decision**: Update documentation to reflect the independent nature of the proxy package.

### 3. Low-Signal Comments
- **Problem**: Some files in `packages/proxy` (e.g., `src/utils/rules.ts`) contain standard comments that should be converted to JSDoc or removed if redundant.
- **Decision**: Perform a sweep of `packages/proxy` and `packages/core` to align with Principle VIII.

## Alternatives Considered

- **Keeping `@nuxt/kit` for development only**: Rejected because it might still leak into the production bundle or cause confusion about dependencies.
- **Automated JSDoc generation**: Evaluated but decided on manual audit to ensure "high-signal" quality which automated tools often fail to capture.

## Best Practices
- Use `node:path` or `pathe` for cross-platform path handling in framework-agnostic libraries.
- Standardize on `h3` primitives for the proxy layer without relying on Nuxt-specific wrappers.
