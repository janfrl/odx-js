---
description: "Task list for constitutional compliance audit and refactor"
---

# Tasks: Constitutional Compliance Audit and Refactor

**Input**: Design documents from `/specs/001-audit-refactor-compliance/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Existing test suites MUST pass. New tests required for any newly introduced logic or to reproduce bugs found during audit.

**Organization**: Tasks are grouped by user story and implementation phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup & Foundational (Shared)

**Purpose**: Audit and dependency resolution

- [X] T001 [US1] Audit `packages/proxy/package.json` for forbidden dependencies (`@nuxt/kit`, `@bc8-odx/nuxt`)
- [X] T002 [US1] Audit `packages/core/package.json` for any framework-specific dependencies
- [X] T003 [US1] Scan `packages/proxy` and `packages/core` for Nuxt/Nitro specific imports
- [X] T004 [P] Ensure `pathe` is available in monorepo for framework-agnostic path resolution

---

## Phase 2: User Story 2 - Boundary Refactoring (Priority: P1)

**Goal**: Decouple `@bc8-odx/proxy` and `@bc8-odx/core` from frameworks

**Independent Test**: `pnpm typecheck` passes in `packages/proxy` and `packages/core` without Nuxt dependencies.

### Implementation for User Story 2

- [X] T005 [US2] Remove `@nuxt/kit` and `@bc8-odx/nuxt` from `packages/proxy/package.json`
- [X] T006 [US2] Refactor `packages/proxy/nitro.config.ts` to remove `@nuxt/kit` and `createResolver`
- [X] T007 [US2] Refactor `packages/proxy/src/nitro.ts` to remove `@nuxt/kit` imports
- [X] T008 [US2] Replace `createResolver` with `pathe` or standard Node.js path logic in `packages/proxy`
- [X] T009 [US2] Audit and refactor `packages/proxy/src/tsconfig.json` to remove dependency on `.nuxt/tsconfig.server.json`
- [X] T010 [US2] Ensure `packages/core` remains framework-independent and clean of imports

---

## Phase 3: User Story 3 - Quality & Documentation Refactoring (Priority: P2)

**Goal**: Align comments and JSDoc with Principle VIII

**Independent Test**: Sampling 5 APIs shows high-signal JSDoc.

### Implementation for User Story 3

- [X] T011 [US3] Audit `packages/core/src` for low-signal comments and replace with JSDoc
- [X] T012 [US3] Audit `packages/proxy/src` for low-signal comments and replace with JSDoc
- [X] T013 [US3] Refactor `packages/proxy/src/utils/rules.ts` to convert redundant comments to high-signal JSDoc
- [X] T014 [US3] Update all files in `docs/content/` to reflect framework-agnostic architecture
- [X] T015 [US3] Verify `docs/content/3.proxy/` correctly describes the independent package

---

## Phase 4: Final Validation & Polish

**Purpose**: Ensure monorepo integrity

- [X] T016 [P] Run `pnpm lint` across the entire monorepo
- [X] T017 [P] Run `pnpm typecheck` across the entire monorepo
- [X] T018 [P] Run `pnpm test` to ensure no regressions in proxy or core logic
- [X] T019 Final manual sampling of JSDoc quality in Core/Proxy
- [X] T020 [P] Verify recent commits follow Conventional Commits standard

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: Identifies the specific areas needing change.
2. **Boundary Refactoring (Phase 2)**: Critical architectural work. MUST complete before quality refactor to ensure correct types.
3. **Quality & Doc Refactoring (Phase 3)**: Improves DX and matches code state to documentation.
4. **Validation (Phase 4)**: Final gate.

### Parallel Opportunities

- T004 (Adding `pathe`) can run in parallel with audits.
- Phase 4 tasks (lint, typecheck, test) can run in parallel.
- Auditing different packages (T011, T012) can run in parallel.

---

## Implementation Strategy

### MVP First
Complete Phase 1 and Phase 2 (Boundary Refactoring) to achieve the primary goal of package isolation.

### Incremental Delivery
Phase 3 and Phase 4 ensure that the architectural changes are well-documented and the monorepo remains healthy.

---

## Notes

- Use `pathe` for all path-related logic in Proxy to ensure cross-platform compatibility.
- Ensure JSDoc follows the "Don't state the obvious" rule from the constitution.
