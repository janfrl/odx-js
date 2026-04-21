<!--
Sync Impact Report:
- Version change: 0.0.0 → 1.0.0
- List of modified principles: Initial creation
- Added sections: Core Principles (I-VI), Development Constraints, Development Workflow, Governance
- Templates requiring updates: 
    - .specify/templates/plan-template.md (✅ aligned)
    - .specify/templates/spec-template.md (✅ aligned)
    - .specify/templates/tasks-template.md (✅ aligned)
- Follow-up TODOs: None
-->

# Nuxt SAP OData (ODX) Constitution

## Core Principles

### I. Modular Monorepo Architecture
The project MUST be organized into specialized packages within the `packages/` directory. Core logic resides in `@bc8-odx/core`, server-side handlers in `@bc8-odx/proxy`, Nuxt module integration in `@bc8-odx/nuxt`, and DevTools UI in `@bc8-odx/explorer`. Internal dependencies MUST use the `@bc8-odx` scope and be linked via pnpm workspaces.

### II. Type-First Developer Experience (DX)
All OData services MUST have automated type generation from EDMX metadata. Public APIs and composables (like `useOData`) MUST be fully typed. The use of `any` or explicit type casts (`as`) is FORBIDDEN without documented justification. Project-specific types MUST augment the `ODataServiceRegistry`.

### III. SAP OData Standard Alignment
The module MUST provide native support for SAP BTP destinations, Cloud SDK connectivity, and standard OData protocols (V2/V4). Features SHOULD support both `proxied` (server-side authenticated) and `direct` (browser-to-backend) communication strategies.

### IV. Nitro-Powered Proxy Layer
OData requests SHOULD be proxied through Nitro server handlers to manage authentication (Basic, Bearer, BTP) and resolve Cross-Origin Resource Sharing (CORS) issues. The proxy layer MUST remain lightweight and performant.

### V. Strict Linting & Modern Tooling
The codebase MUST adhere to `@antfu/eslint-config`. Modern TypeScript (strict mode) and Nuxt 4/Nitro/h3 standards MUST be followed. Linting and type-checking are mandatory quality gates.

### VI. Test-Driven Reliability (NON-NEGOTIABLE)
Every new feature or bug fix MUST include corresponding unit or integration tests using Vitest and `@nuxt/test-utils`. Bugs MUST be reproduced with a failing test before applying a fix. High test coverage for core logic is expected.

## Development Constraints

- **Tech Stack:** Nuxt 4, TypeScript (Strict), Nitro, h3, pnpm.
- **Architectural Patterns:** Prioritize explicit composition and delegation (e.g., wrapper classes, proxies) over complex inheritance.
- **Security:** NEVER commit or log secrets/API keys. Use BTP destinations for managed authentication.
- **BTP Ready:** All core components MUST be compatible with SAP BTP deployment (Cloud Foundry/Kyma).

## Development Workflow

### Constitution Gates (Checklist for Plans)
- [ ] **Modular Alignment:** Does the feature fit into the existing package structure?
- [ ] **Type Safety:** Are all new interfaces and models fully typed? No `any`?
- [ ] **Test Coverage:** Are there tests for the new functionality?
- [ ] **BTP Compatibility:** Does it support BTP destinations/proxying (if applicable)?
- [ ] **Linting:** Does the code pass `pnpm lint`?

### Review Process
- All PRs MUST pass automated linting, type-checking, and tests.
- Changes to the core OData client or proxy logic require rigorous integration testing with the playground.

## Governance

### Amendment Procedure
Amendments to this constitution require a dedicated PR explaining the rationale. Major changes to core principles should be discussed with the project lead.

### Versioning Policy
This constitution follows Semantic Versioning (SemVer).
- MAJOR: Removal or redefinition of core principles.
- MINOR: New principles or sections added.
- PATCH: Wording clarifications and non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
