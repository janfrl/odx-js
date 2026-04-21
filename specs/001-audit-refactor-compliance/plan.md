# Implementation Plan: Audit and Refactor for Constitutional Compliance

**Branch**: `001-audit-refactor-compliance` | **Date**: 2026-04-21 | **Spec**: [specs/001-audit-refactor-compliance/spec.md]
**Input**: Feature specification from `/specs/001-audit-refactor-compliance/spec.md`

## Summary
Audit the ODX monorepo and refactor `packages/core` and `packages/proxy` to strictly comply with the architectural boundaries (Principle I), type safety (Principle II), and documentation standards (Principle VIII) defined in the project constitution.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: `h3`, `ofetch`, `pathe` (replacing `@nuxt/kit`)
**Storage**: N/A
**Testing**: Vitest, `@nuxt/test-utils`
**Target Platform**: Framework-agnostic Node.js (Core/Proxy), Nuxt 4 (Module/Explorer)
**Project Type**: Monorepo library/toolkit
**Performance Goals**: N/A
**Constraints**: Zero Nuxt imports in Core/Proxy. High-signal JSDoc only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Boundary Compliance:** Plan decouples Proxy from Nuxt.
- [x] **Type Safety:** Audit includes verification of `ODataServiceRegistry` augmentation.
- [x] **Test Coverage:** All refactored code will be verified by existing and new tests.
- [x] **BTP Compatibility:** Decoupling ensures Proxy remains BTP-compatible in pure Nitro environments.
- [x] **Linting:** `pnpm lint` and `pnpm typecheck` are mandatory gates.
- [x] **Documentation:** Plan includes manual audit of comments and update of `./docs`.

## Project Structure

### Documentation (this feature)

```text
specs/001-audit-refactor-compliance/
├── plan.md              # This file
├── research.md          # Audit findings and decoupling decisions
├── data-model.md        # Dependency graph rules
├── quickstart.md        # Verification guide
├── contracts/           # N/A for this refactor
└── tasks.md             # Implementation tasks
```

### Source Code (monorepo structure)

```text
packages/
├── core/                # MUST be pure TS
├── proxy/               # MUST be framework-independent
├── nuxt/                # Nuxt module
└── explorer/            # DevTools UI (Nuxt app)
```

**Structure Decision**: Monorepo with strict package boundaries as defined in Principle I.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
