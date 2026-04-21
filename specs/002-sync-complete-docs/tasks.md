# Tasks: Documentation Sync & Completion

**Input**: Design documents from `/specs/002-sync-complete-docs/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic documentation structure

- [ ] T001 Reorganize `docs/content/` directory structure to follow Diátaxis framework (Tutorials, How-to, Reference, Explanation)
- [ ] T002 Update `docs/nuxt.config.ts` to support Nuxt Content v3 and Nuxt UI v4
- [ ] T003 [P] Create `docs/scripts/extract-metadata.ts` using `untyped` for API metadata extraction
- [ ] T004 [P] Configure `docs/package.json` with a script to run metadata extraction before build

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core documentation components and shared layouts

- [ ] T005 [P] Create `docs/components/ApiReference.vue` component using Nuxt UI v4 to render JSON metadata
- [ ] T006 [P] Implement `docs/components/AppHeader.vue` and `docs/components/AppFooter.vue` for consistent navigation
- [ ] T007 Create `docs/content/index.md` with updated branding and logical entry points

**Checkpoint**: Infrastructure ready - content implementation can now begin

---

## Phase 3: User Story 1 - Onboarding Journey (Priority: P1) 🎯 MVP

**Goal**: Provide a logical path from introduction to first OData request

**Independent Test**: A user can navigate from `/` to `/getting-started/usage` and complete a data fetch successfully

### Implementation for User Story 1

- [ ] T008 [P] [US1] Rewrite `docs/content/1.getting-started/1.introduction.md` as a high-level overview
- [ ] T009 [P] [US1] Rewrite `docs/content/1.getting-started/2.installation.md` for Nuxt 4 and pnpm
- [ ] T010 [P] [US1] Create `docs/content/1.getting-started/3.configuration.md` with basic "odata" block options
- [ ] T011 [US1] Create `docs/content/1.getting-started/4.usage.md` with "Your First Request" guide using `useOData`
- [ ] T012 [US1] Add "Next Steps" call-to-action buttons to all onboarding pages

**Checkpoint**: Onboarding journey (MVP) is fully functional and testable independently

---

## Phase 4: User Story 2 - Feature Reference (Priority: P2)

**Goal**: Detailed, accurate API information for ODX packages

**Independent Test**: Verify that `ApiReference` component renders correct types for `ModuleOptions` and `useOData`

### Implementation for User Story 2

- [ ] T013 [P] [US2] Document `@bc8-odx/core` in `docs/content/5.core/` including `ODataQuery` types
- [ ] T014 [P] [US2] Document `@bc8-odx/proxy` in `docs/content/3.proxy/` including BTP destination setup
- [ ] T015 [US2] Implement `docs/content/2.nuxt/reference.md` using `ApiReference` for `ModuleOptions`
- [ ] T016 [US2] Create `docs/content/6.guides/2.authentication.md` with SAP-specific auth patterns
- [ ] T017 [US2] [P] Create `docs/content/6.guides/3.deployment.md` for SAP BTP (CF/Kyma) deployment details

**Checkpoint**: Technical reference coverage is complete for all core features

---

## Phase 5: User Story 3 - Visual Discovery (Priority: P3)

**Goal**: Guide users through the ODX Explorer and traffic monitoring

**Independent Test**: Verify that Explorer documentation matches the current UI features

### Implementation for User Story 3

- [ ] T018 [P] [US3] Update `docs/content/4.explorer/1.introduction.md` with latest screenshots/descriptions
- [ ] T019 [US3] Create `docs/content/4.explorer/2.features.md` documenting schema visualizer and request logs
- [ ] T020 [US3] Add a "Troubleshooting" section to the Explorer guides

**Checkpoint**: Visual discovery guides are complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T021 [P] Run `pnpm run docs:build` and fix any dead links or broken components
- [ ] T022 [P] Verify all code snippets in Markdown follow correct syntax highlighting
- [ ] T023 Update `README.md` and `GEMINI.md` to point to the new documentation URL
- [ ] T024 Perform a final check of the mobile responsiveness of the docs site

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion
- **User Stories (Phase 3+)**: All depend on Phase 2 completion
- **Polish (Final Phase)**: Depends on all user stories being complete

### Parallel Opportunities

- T003 and T004 (Metadata setup) can run in parallel with T001
- T005 and T006 (UI components) can run in parallel
- Once Foundational is done, User Stories 1, 2, and 3 can technically start in parallel, though sequential order (P1 -> P2 -> P3) is recommended for narrative flow

---

## Implementation Strategy

### Autonomous Progress

The agent is AUTHORIZED to commit autonomously after completing each task or logical group in this list. Commits MUST be granular and follow Conventional Commits (e.g., `docs(nuxt): update configuration guide`).

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify onboarding flow in the browser
5. Commit and proceed to Story 2
