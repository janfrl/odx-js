---
description: "Task list for API Reference Automation"
---

# Tasks: API Reference Automation

**Input**: Design documents from `/specs/003-api-reference-automation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-contract.md

**Tests**: Fixture-based unit tests for the extraction logic are requested (from research.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize script environment and install `ts-morph` dependency
- [x] T002 Create initial script file in `scripts/extract-api-docs.ts`
- [x] T003 [P] Create test fixture directory in `test/fixtures/api-extraction/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T004 Define `ApiItem` and `ApiProperty` TypeScript interfaces in `scripts/extract-api-docs.ts`
- [x] T005 Setup basic `ts-morph` Project instance in `scripts/extract-api-docs.ts`
- [x] T006 Implement CLI argument parsing and configuration (entry points, output path) in `scripts/extract-api-docs.ts`

**Checkpoint**: Foundation ready - extraction logic implementation can now begin.

---

## Phase 3: User Story 1 - Update API Reference Data (Priority: P1) 🎯 MVP

**Goal**: Extract API metadata (interfaces, types, functions) and JSDoc from source files to JSON.

**Independent Test**: Run script against a sample file and verify generated JSON matches expectations.

### Tests for User Story 1

- [x] T007 [P] [US1] Create test fixtures with complex TypeScript structures in `test/fixtures/api-extraction/sample.ts`
- [x] T008 [US1] Implement unit test suite in `test/api-extractor.test.ts` (initially failing)

### Implementation for User Story 1

- [x] T009 [US1] Implement export discovery logic (navigating `index.ts` exports) in `scripts/extract-api-docs.ts`
- [x] T010 [US1] Implement Interface and Type Alias extraction (properties, types, required) in `scripts/extract-api-docs.ts`
- [x] T011 [US1] Implement Function extraction (parameters as properties) in `scripts/extract-api-docs.ts`
- [x] T012 [US1] Implement JSDoc parsing (descriptions, `@default` tags) in `scripts/extract-api-docs.ts`
- [x] T013 [US1] Implement JSON serialization and file writing in `scripts/extract-api-docs.ts`

**Checkpoint**: User Story 1 complete - JSON can be generated from source.

---

## Phase 4: User Story 2 - Documentation Display (Priority: P2)

**Goal**: Ensure the generated JSON is accessible to the documentation site.

**Independent Test**: Verify `docs/public/api-reference.json` is created and readable via HTTP (mocked or local server).

### Implementation for User Story 2

- [x] T014 [US2] Update script default output path to `docs/public/api-reference.json` in `scripts/extract-api-docs.ts`
- [x] T015 [P] [US2] Create a sample Docus component/page in `docs/content/2.nuxt/api-reference.md` demonstrating `useFetch` consumption.

**Checkpoint**: User Story 2 complete - Data is available for documentation rendering.

---

## Phase 5: User Story 3 - CI/CD Integration (Priority: P3)

**Goal**: Automatically regenerate the API reference during the build process.

**Independent Test**: Run `pnpm run build` (or similar) and verify the JSON file is updated.

### Implementation for User Story 3

- [x] T016 [US3] Add `docs:api` script to root `package.json` to run the extractor.
- [x] T017 [US3] Integrate `docs:api` into the `docs:prepare` or main `build` script in `package.json`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T018 [P] Add progress logging and error reporting to the script.
- [x] T019 [P] Update `README.md` with instructions for running and maintaining the API extractor.
- [x] T020 Final validation against all scenarios in `specs/003-api-reference-automation/spec.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup.
- **User Stories (Phase 3-5)**: Depend on Foundational completion.
  - US1 (Phase 3) is the primary engine.
  - US2 (Phase 4) depends on US1 output.
  - US3 (Phase 5) depends on the script being functional (US1).

---

## Implementation Strategy

### Autonomous Progress

The agent is AUTHORIZED to commit autonomously after completing each task. Commits MUST follow Conventional Commits (e.g., `feat(scripts): implement jsdoc parsing for api extractor`).

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational.
2. Complete User Story 1 implementation and testing.
3. Validate that `api-reference.json` is correctly generated.
