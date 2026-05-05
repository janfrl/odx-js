# Task: Exclude pending logs from status filters

Status: done
Owner: Codex orchestrator
Created: 2026-05-05
Risk: medium
Review: conditional - required if proxy logging or `/__odx__/logs` contracts change

## Objective

Make Explorer Traffic Monitor status filters treat pending rows as pending, not
as successful or failed traffic.

## Context

Explorer status filtering currently classifies a row by `Number(log.status ||
0)`. Pending rows can have no final status and `isPending: true`, which risks
matching the `success` filter as status `0`. This is a narrow state bug in the
Explorer diagnostic workflow and should be fixed with tests before UI changes.

Relevant docs:

- `DESIGN.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `.agents/tasks/done/018-add-explorer-traffic-search-and-status-filters.md`
- `.agents/tasks/done/024-improve-explorer-filtered-empty-state.md`

## Scope

- Add focused tests in `packages/explorer/test/state.test.ts` proving:
  - `all` status includes pending rows.
  - `success` excludes pending rows with no final status.
  - `failures` excludes pending rows with no final status.
- Update `packages/explorer/composables/useODataState.ts` only as needed.
- Update `packages/explorer/components/tabs/TabLogs.vue` only if the current
  pending display depends on the corrected state behavior.
- Preserve existing search, service, success, failure, and filtered-empty tests.

## Non-Goals

- Do not redesign the Traffic Monitor table, filters, or empty state.
- Do not change proxy logging behavior or `/__odx__/logs` payloads.
- Do not add a new pending filter option in this task.
- Do not display additional sensitive log fields.

## Acceptance Criteria

- [ ] Pending rows remain visible when status filter is `all`.
- [ ] Pending rows without a final status are hidden by the `success` filter.
- [ ] Pending rows without a final status are hidden by the `failures` filter.
- [ ] Existing Traffic Monitor filtering and filtered-empty behavior still
  passes.
- [ ] No internal endpoint or proxy logging contract changes.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run test -- packages/explorer`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local Explorer state tests only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this changes user-facing diagnostic filtering behavior.
Separate review is not required if the change stays in Explorer state/UI and
does not touch proxy logging, internal endpoints, or displayed sensitive data.

## Handoff Notes

Completed 2026-05-05 by Orchestrator.

- changed files:
  - `packages/explorer/composables/useODataState.ts`
  - `packages/explorer/test/state.test.ts`
- failing-test evidence:
  - Added the pending-row state test first, then ran
    `pnpm.cmd --filter @bc8-odx/explorer run verify`.
  - The new test failed because `success` included the pending row:
    expected `['ok-products']`, received
    `['pending-products', 'ok-products']`.
- summary:
  - Status filters now leave pending/no-final-status rows visible for `all`.
  - `success` and `failures` filters exclude rows with `isPending: true` or no
    final status.
  - Existing service/search/status and filtered-empty tests remain intact.
- tests run:
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer run verify`.
  - PASS: `pnpm.cmd run test -- packages/explorer`.
  - PASS: `pnpm.cmd run typecheck`.
- skipped checks and residual risk:
  - `pnpm.cmd run lint` passed during the task 026/027 combined checkpoint
    before this task was integrated.
- self-check result:
  - Scope stayed local to Explorer state filtering and tests.
  - No proxy logging behavior, `/__odx__/logs` payload contracts, UI redesign,
    or displayed sensitive fields changed.
- review requirement decision:
  - Separate review is not required because the change stays in Explorer state
    and tests.
- task state movement:
  - Moved to `.agents/tasks/done/` by Orchestrator.
- `.agents/NEXT.md` update:
  - Updated to task 028.
- commit hash:
  - Pending at handoff update time.
- known gaps:
  - None.
