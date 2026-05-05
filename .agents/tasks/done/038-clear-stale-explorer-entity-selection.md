# Task: Clear stale Explorer entity selection

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if internal Explorer endpoint contracts change

## Objective

Keep Explorer entity selection consistent when refreshed service config no
longer contains the previously selected entity set.

## Context

Explorer state is client-side and session-oriented. It already reconciles proxy
trace selection when logs refresh, but selected service and selected entity
state can become stale when `/__odx__/config` refreshes after regeneration or a
degraded metadata fallback. A stale selected entity can make the entity browser
show data, schema, or query state for an entity that no longer exists.

Relevant docs and files:

- `ARCHITECTURE.md`
- `DESIGN.md`
- `DOMAIN_MODEL.md`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/test/state.test.ts`
- `.agents/tasks/done/033-harden-explorer-proxy-trace-selection-state.md`

## Scope

- Add focused state tests for config refresh behavior when:
  - the selected service remains and still includes the selected entity
  - the selected service remains but no longer includes the selected entity
  - the selected service disappears entirely
- Update Explorer state reconciliation only if tests prove stale selection.
- Clear or reset entity preview/schema/query state only as needed to avoid
  showing stale entity data.
- Preserve existing traffic-log filters, proxy trace selection, degraded service
  health behavior, and schema graph state.

## Non-Goals

- Do not redesign Explorer UI or add new visible controls.
- Do not change `/__odx__/config`, `/__odx__/schema`, or `/__odx__/logs`
  endpoint payloads.
- Do not add browser verification or a dev server requirement.
- Do not add dependencies.

## Acceptance Criteria

- [x] Tests cover selected entity preservation when the entity remains valid.
- [x] Tests cover stale selected entity cleanup when the entity disappears.
- [x] Tests cover selected service cleanup when the service disappears.
- [x] Existing Explorer state tests remain green.
- [x] No internal endpoint contracts or proxy logging behavior change.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run test -- packages/explorer`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local Explorer state tests and mocked `fetch` only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this affects user-facing Explorer state, but the expected
write surface is client-side and test-backed. Separate review is not required
unless implementation changes internal endpoint contracts, proxy logs, or broad
UI behavior.

## Handoff Notes

- changed files:
  - `packages/explorer/composables/useODataState.ts`
  - `packages/explorer/test/state.test.ts`
  - `.agents/tasks/done/038-clear-stale-explorer-entity-selection.md`
- summary:
  - Added focused Explorer state tests for config refresh behavior when the
    selected entity remains valid, when the entity disappears from the selected
    service, and when the selected service disappears entirely.
  - Confirmed the stale-selection tests failed before the fix.
  - Added selected service/entity reconciliation on config refresh and reset
    entity-scoped preview, schema, method, input, and visual query state when
    the current selection is no longer valid.
  - Updated an existing proxied data-fetch test so its mocked config contains
    the selected service/entity instead of relying on an impossible stale
    selection state.
- tests run:
  - FAIL before fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "refreshed config"`
    (2 expected stale-selection failures).
  - PASS after fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "refreshed config"`
    (3 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer run verify`
    (25 tests passed).
  - PASS: `pnpm.cmd run test -- packages/explorer`
    (17 files passed, 1 skipped; 141 tests passed, 1 skipped).
  - PASS: `pnpm.cmd run typecheck`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No listed checks were skipped.
- self-check result:
  - Scope stayed in Explorer state and tests. No internal endpoint contracts,
    proxy logging behavior, Nuxt config, dependencies, lockfiles, or visible UI
    controls changed.
- review requirement decision:
  - Separate review is not required because the change is client-side state
    reconciliation with focused tests and does not alter internal endpoint
    contracts, proxy logs, or broad UI behavior.
- task state movement:
  - Moved this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Left unchanged because it already points to the required review for
    completed high-risk task 037.
- commit hash:
  - pending commit.
- known gaps:
  - Browser-mode Explorer verification was intentionally not used for this
    state-only task.
