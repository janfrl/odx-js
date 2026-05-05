# Task: Clear stale Explorer log service filter

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if internal Explorer endpoint contracts or visible UI layout change

## Objective

Keep Explorer traffic-log service filters consistent when refreshed config no
longer contains the filtered service or route alias.

## Context

Task 038 reconciled selected service and selected entity state after config
refreshes. The traffic-log service filter is another config-backed state value:
if a service is removed or renamed after regeneration/config refresh, the
filter can remain active and hide all existing logs even though the selected
service no longer exists. This should be fixed as state behavior with focused
tests and no UI redesign.

Relevant docs and files:

- `ARCHITECTURE.md`
- `DESIGN.md`
- `DOMAIN_MODEL.md`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/test/state.test.ts`
- `.agents/tasks/done/038-clear-stale-explorer-entity-selection.md`

## Scope

- Add focused Explorer state tests for config refresh behavior when:
  - the current log service filter still matches an existing service name.
  - the current log service filter still matches an existing route alias.
  - the current log service filter no longer matches any service name or route
    alias.
- Clear only the stale service filter when it no longer matches config.
- Preserve log search text, status filter, selected proxy trace state, selected
  service/entity reconciliation, and traffic log contents.

## Non-Goals

- Do not redesign Explorer UI or add visible controls.
- Do not change `/__odx__/config` or `/__odx__/logs` payloads.
- Do not change proxy logging or service health behavior.
- Do not add browser verification or a dev server requirement.
- Do not add dependencies.

## Acceptance Criteria

- [x] Tests cover service-filter preservation by service name.
- [x] Tests cover service-filter preservation by route alias.
- [x] Tests cover stale service-filter cleanup after config refresh.
- [x] Existing Explorer state tests remain green.
- [x] No internal endpoint contracts, proxy logs, or visible UI layout change.

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

Medium risk because this affects user-facing Explorer state, but the write
surface should be client-side state and tests only. Separate review is not
required unless implementation changes internal endpoint contracts, proxy logs,
or visible UI layout.

## Handoff Notes

- changed files:
  - `packages/explorer/composables/useODataState.ts`
  - `packages/explorer/test/state.test.ts`
  - `.agents/tasks/done/045-clear-stale-explorer-log-service-filter.md`
  - `.agents/NEXT.md`
- summary:
  - Added focused Explorer state tests for log service-filter preservation by
    configured service name and route alias.
  - Added a stale-filter config refresh test proving only
    `logFilterService` is cleared while preserving log search text, status
    filter, selected proxy trace state, selected service/entity state, and
    traffic log contents.
  - Added config refresh reconciliation that clears `logFilterService` only
    when the current filter no longer matches any configured service name or
    route alias.
- tests run:
  - FAIL before fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "traffic log service filter"`
    (1 expected stale-filter failure: expected `old-northwind` to be null; 2
    preservation tests passed).
  - PASS after fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "traffic log service filter"`
    (3 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer run verify`
    (28 tests passed).
  - PASS: `pnpm.cmd run test -- packages/explorer`
    (18 files passed, 1 skipped; 158 tests passed, 1 skipped; dependency
    `DEP0155` deprecation warnings emitted).
  - PASS: `pnpm.cmd run typecheck`.
  - FAIL transient/unrelated: `pnpm.cmd run lint` initially failed on
    `packages/proxy/test/performance.test.ts` import ordering while task 043
    had active parallel proxy benchmark edits in the shared worktree.
  - PASS: `pnpm.cmd exec eslint packages/explorer/composables/useODataState.ts packages/explorer/test/state.test.ts`.
  - PASS on rerun after the parallel task 043 worktree changes cleared:
    `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No checks were skipped.
- self-check result:
  - Scope stayed in Explorer client state and state tests. No visible UI,
    internal endpoint contracts, proxy logging, dependencies, lockfiles, or
    benchmark files changed.
- review requirement decision:
  - Separate review is not required because endpoint contracts, proxy logs, and
    visible UI layout were not changed.
- task state movement:
  - Moved this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Updated to point to task 044 after checking the ready queue.
- commit hash:
  - pending commit.
- known gaps:
  - Browser verification was intentionally not used for this state-only task.
