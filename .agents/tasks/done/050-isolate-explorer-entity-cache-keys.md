# Task: Isolate Explorer entity cache keys

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if visible UI behavior, internal endpoint contracts, or server routing changes

## Objective

Prevent Explorer entity preview cache collisions when service or entity-set
names contain separator characters.

## Context

Task 046 encoded Explorer internal endpoint query values for service and entity
names containing `&`, `#`, spaces, or `?`. The next narrow state risk is the
entity preview cache key in Explorer state: it currently combines service and
entity names with a plain separator. Distinct service/entity pairs can produce
the same cache key when names contain that separator, causing stale preview
data, query text, or errors to be restored for the wrong selection.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/046-encode-explorer-internal-endpoint-params.md`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/composables/useEntityExplorer.ts`
- `packages/explorer/test/state.test.ts`

## Scope

- Add a focused failing Explorer state test first for two distinct
  service/entity selections that would collide with the current cache key.
- Update Explorer entity preview cache-key construction so service and entity
  values are isolated unambiguously.
- Preserve cached preview data behavior when reselecting the exact same
  service/entity pair.
- Keep changes limited to Explorer state/composable logic and focused tests.

## Non-Goals

- Do not change Explorer endpoint paths, query parameter names, or request
  methods.
- Do not redesign Explorer UI, add visible controls, or start browser-mode
  verification.
- Do not change public proxied OData URLs, proxy runtime behavior, Nuxt module
  behavior, dependencies, or lockfiles.
- Do not introduce broad cache eviction, persistence, or storage policy changes.

## Acceptance Criteria

- [ ] A focused test proves distinct service/entity pairs no longer share
  cached preview state.
- [ ] Existing cache restore behavior still works for reselecting the exact
  same service/entity pair.
- [ ] Cache-key construction is centralized or made obviously consistent across
  the Explorer composables that read/write entity preview cache entries.
- [ ] Existing Explorer state tests remain green.
- [ ] No visible UI layout or browser-only behavior changes are included.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use mocked Explorer state tests only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches Explorer state restoration behavior. Separate
review is not required if the change stays in cache-key construction with
focused tests and does not change UI layout, endpoint contracts, or server
routing.

## Handoff Notes

- changed files:
  - `packages/explorer/composables/useODataState.ts`
  - `packages/explorer/composables/useEntityExplorer.ts`
  - `packages/explorer/test/state.test.ts`
  - `.agents/tasks/done/050-isolate-explorer-entity-cache-keys.md`
  - `.agents/NEXT.md`
- summary:
  - Added a focused regression test for two distinct service/entity selections
    that collide under the previous `service:entity` cache key.
  - Confirmed the new test failed before the implementation because the second
    selection restored cached preview data from the first selection.
  - Added centralized `buildEntityPreviewCacheKey()` construction using an
    unambiguous serialized tuple and used it for preview cache reads and
    writes.
  - Updated existing cache restore assertions to use the shared key builder,
    preserving exact service/entity reselect behavior.
- tests run:
  - FAIL before fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "does not restore cached entity preview state for colliding service and entity names"`
    failed with `expected [ Array(1) ] to be null`, proving the stale cache
    collision.
  - PASS after fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "does not restore cached entity preview state for colliding service and entity names"`
    (1 test passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`
    (32 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer run verify`
    (32 tests passed).
  - PASS: `pnpm.cmd run typecheck`.
- skipped checks and residual risk:
  - `pnpm.cmd run lint` was not run because this task's required task-local
    checks passed and the change stayed limited to Explorer cache-key logic and
    focused tests. Residual risk is low and limited to lint issues not covered
    by TypeScript or Vitest.
- self-check result:
  - Scope stayed within Explorer state/composable cache-key logic and focused
    tests.
  - Acceptance criteria passed: distinct colliding selections no longer share
    cached preview state, exact reselect restore still works, cache-key
    construction is centralized, Explorer state tests are green, and no UI,
    endpoint contract, server routing, dependency, or lockfile changes were
    included.
  - Relevant workflow/docs/decision boundaries were checked; `.agents/decisions/`
    contains only the ADR template and no conflicting accepted decision.
  - No security/privacy-sensitive data handling or external boundary behavior
    changed.
  - No unrelated tracked edits were included.
- review requirement decision:
  - Separate review is not required. The task is medium risk, but the change
    stayed limited to cache-key construction and focused tests, with no visible
    UI behavior, internal endpoint contract, or server routing changes.
- task state movement:
  - Moved this task from `.agents/tasks/ready/` to `.agents/tasks/in-progress/`
    at start, then to `.agents/tasks/done/` after implementation and
    verification.
- `.agents/NEXT.md` update:
  - Updated to the next ready task,
    `.agents/tasks/ready/051-add-deployment-config-consistency-tests.md`.
- commit hash:
  - pending commit.
- known gaps:
  - No browser-mode verification was run, per task instruction and because no
    visible UI behavior changed.
