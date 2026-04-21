<!--
Sync Impact Report:
- Version change: 1.1.0 → 1.2.0
- List of modified principles:
    - Added VIII. High-Signal Documentation & Comments
- Added sections: None
- Removed sections: None
- Templates requiring updates:
    - .specify/templates/plan-template.md (✅ aligned - dynamic gates)
    - .specify/templates/spec-template.md (✅ aligned)
    - .specify/templates/tasks-template.md (✅ aligned)
- Follow-up TODOs: None
-->

# Nuxt SAP OData (ODX) Constitution

## Core Principles

### I. Strict Architectural Boundaries
The project is a monorepo where package boundaries MUST be strictly enforced to ensure portability and modularity.
- **`@bc8-odx/core`**: MUST be pure TypeScript. It must not depend on any frontend (Vue/React) or backend (Nuxt/Nitro) framework.
- **`@bc8-odx/proxy`**: MUST be framework-independent. It must not import from `@nuxt/kit` or any Nuxt-specific packages so it can be used in other Node.js/h3 environments.
- **`@bc8-odx/explorer`**: A Nuxt-based application designed for schema exploration. It MUST be extensible by other Nuxt apps and function both as a standalone application and integrated Nuxt DevTools.

### II. Type-First Developer Experience (DX)
All OData services MUST have automated type generation from EDMX metadata. Public APIs and composables (like `useOData`) MUST be fully typed. The use of `any` or explicit type casts (`as`) is FORBIDDEN without documented justification. Project-specific types MUST augment the `ODataServiceRegistry`.

### III. SAP OData Standard Alignment
The module MUST provide native support for SAP BTP destinations, Cloud SDK connectivity, and standard OData protocols (V2/V4). Features SHOULD support both `proxied` (server-side authenticated) and `direct` (browser-to-backend) communication strategies.

### IV. Nitro-Powered Proxy Layer
OData requests SHOULD be proxied through Nitro server handlers (managed via `@bc8-odx/proxy`) to handle authentication (Basic, Bearer, BTP) and resolve CORS issues. The proxy layer MUST remain lightweight and performant.

### V. Strict Linting & Modern Tooling
The codebase MUST adhere to `@antfu/eslint-config`. Modern TypeScript (strict mode) and Nuxt 4/Nitro/h3 standards MUST be followed. Linting and type-checking are mandatory quality gates.

### VI. Test-Driven Reliability (NON-NEGOTIABLE)
Testing is CRITICAL. Every new feature or bug fix MUST include corresponding unit or integration tests using Vitest and `@nuxt/test-utils`. Bugs MUST be reproduced with a failing test before applying a fix.

### VII. Conventional Commits & Versioning
All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This ensures automated changelog generation and consistent versioning. This project follows Semantic Versioning (SemVer) for all packages and the constitution itself.

### VIII. High-Signal Documentation & Comments
Code documentation and comments MUST prioritize signal over noise.
- **Comments**: MUST only exist if they provide valuable information that is hard or impossible to see from the code alone.
- **JSDoc**: Preferred over standard comments for describing public APIs, types, and non-obvious logic. JSDoc MUST follow linting guidelines but SHOULD NOT be excessively verbose.
- **External Documentation**: Documentation under `./docs` MUST always be kept up to date with core changes.

## Development Constraints

- **Tech Stack:** Nuxt 4, TypeScript (Strict), Nitro, h3, pnpm.
- **Dependency Isolation:** No Nuxt imports in `@bc8-odx/proxy` or `@bc8-odx/core`.
- **Security:** NEVER commit or log secrets/API keys. Use BTP destinations for managed authentication.
- **BTP Ready:** All core components MUST be compatible with SAP BTP deployment (Cloud Foundry/Kyma).

## Development Workflow

### Constitution Gates (Checklist for Plans)
- [ ] **Boundary Compliance:** Does the feature respect package isolation (e.g., no Nuxt in Proxy)?
- [ ] **Type Safety:** Are all new interfaces and models fully typed? No `any`?
- [ ] **Test Coverage:** Are there tests for the new functionality?
- [ ] **BTP Compatibility:** Does it support BTP destinations/proxying (if applicable)?
- [ ] **Linting:** Does the code pass `pnpm lint`?
- [ ] **Documentation:** Are JSDoc comments high-signal? Is `./docs` updated?

## Governance

### Amendment Procedure
Amendments to this constitution require a dedicated PR explaining the rationale. Major changes to core principles should be discussed with the project lead.

### Versioning Policy
- MAJOR: Removal or redefinition of core principles.
- MINOR: New principles or sections added (e.g., v1.1.0 boundary rules, v1.2.0 documentation rules).
- PATCH: Wording clarifications and non-semantic refinements.

**Version**: 1.2.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
