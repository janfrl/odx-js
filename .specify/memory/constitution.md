<!--
Sync Impact Report:
- Version change: 1.3.0 → 1.3.1
- List of modified principles:
    - IX. Spec-Kit Guided Development & Autonomy (Clarified that autonomy applies to the entire cycle)
- Added sections: None
- Removed sections: None
- Templates requiring updates:
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
All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. 
- **Granularity**: Commits MUST be granular, scoping exactly one change (e.g., one feature, one docs change, one fix).
- **Autonomy**: While operating within a dedicated `spec-kit` feature branch, the agent is AUTHORIZED to commit autonomously without explicit user confirmation for each commit, provided they adhere to the conventional commit standard and granularity rules.
- **Versioning**: This project follows Semantic Versioning (SemVer) for all packages and the constitution itself.

### VIII. High-Signal Documentation & Comments
Code documentation and comments MUST prioritize signal over noise.
- **Comments**: MUST only exist if they provide valuable information that is hard or impossible to see from the code alone.
- **JSDoc**: Preferred over standard comments for describing public APIs, types, and non-obvious logic. JSDoc MUST follow linting guidelines but SHOULD NOT be excessively verbose.
- **External Documentation**: Documentation under `./docs` MUST always be kept up to date with core changes.

### IX. Spec-Kit Guided Development & Autonomy
Development follows a specification-driven approach using `spec-kit` to ensure alignment and quality.
- **Branching Strategy**: Every new specification or feature request MUST be developed in its own dedicated branch (prefixed with `feat/`, `fix/`, or `spec/`).
- **Encapsulation**: All related artifacts—including the specification, implementation plan, task list, and code changes—MUST reside within this branch.
- **Merge & Squash**: Upon completion and successful validation of all tasks, the branch MUST be merged and squashed into the main branch to maintain a clean history.
- **Autonomous Execution**: The agent IS AUTHORIZED to commit changes as they see fit throughout the entire `spec-kit` lifecycle (from specification and planning to implementation and validation) as long as they are inside a dedicated feature branch. This ensures high velocity and clear traceability.

## Development Constraints

- **Tech Stack:** Nuxt 4, TypeScript (Strict), Nitro, h3, pnpm.
- **Dependency Isolation:** No Nuxt imports in `@bc8-odx/proxy` or `@bc8-odx/core`.
- **Security:** NEVER commit or log secrets/API keys. Use BTP destinations for managed authentication.
- **BTP Ready:** All core components MUST be compatible with SAP BTP deployment (Cloud Foundry/Kyma).

## Development Workflow

### Constitution Gates (Checklist for Plans)
- [ ] **Spec-Kit Alignment**: Is this change developed in a dedicated branch?
- [ ] **Boundary Compliance**: Does the feature respect package isolation (e.g., no Nuxt in Proxy)?
- [ ] **Type Safety**: Are all new interfaces and models fully typed? No `any`?
- [ ] **Test Coverage**: Are there tests for the new functionality?
- [ ] **BTP Compatibility**: Does it support BTP destinations/proxying (if applicable)?
- [ ] **Linting**: Does the code pass `pnpm lint`?
- [ ] **Documentation**: Are JSDoc comments high-signal? Is `./docs` updated?

## Governance

### Amendment Procedure
Amendments to this constitution require a dedicated PR explaining the rationale. Major changes to core principles should be discussed with the project lead.

### Versioning Policy
- MAJOR: Removal or redefinition of core principles.
- MINOR: New principles or sections added (e.g., v1.3.0 Spec-Kit rules).
- PATCH: Wording clarifications and non-semantic refinements.

**Version**: 1.3.1 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
