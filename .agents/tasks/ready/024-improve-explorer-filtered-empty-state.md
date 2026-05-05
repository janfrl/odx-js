# Task: Improve Explorer filtered empty state

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if log endpoint contracts or proxy logging change

## Objective

Make the Explorer Traffic Monitor distinguish between no recorded traffic and
no rows matching the active filters, with a compact way to clear filters.

## Context

Task 018 added client-side Traffic Monitor search and status filters. The table
empty state still reads like no traffic exists, which can mislead users when
logs are present but hidden by filters. This should be a cautious, test-backed
Explorer improvement with no endpoint or proxy logging changes.

Relevant docs:

- `DESIGN.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `.agents/tasks/done/018-add-explorer-traffic-search-and-status-filters.md`

## Scope

- Add shared Explorer state or computed values only as needed to tell whether
  active filters hide existing logs.
- Update `packages/explorer/components/tabs/TabLogs.vue` with a compact empty
  state message and a clear-filters action when logs exist but filters match
  nothing.
- Add focused tests in `packages/explorer/test/state.test.ts` for active-filter
  detection and clearing filter state.
- Preserve the existing no-traffic empty state for sessions with no logs.
- Keep styling consistent with the existing workbench and Nuxt UI controls.

## Non-Goals

- Do not redesign the Traffic Monitor table or controls.
- Do not change `@bc8-odx/proxy` logging behavior or `/__odx__/logs` payloads.
- Do not add server-side filtering or persistence.
- Do not display additional sensitive log fields.

## Acceptance Criteria

- [ ] Explorer state can tell when filters are active.
- [ ] Explorer state can clear service, status, and search filters together.
- [ ] The table empty state differentiates no traffic from no filter matches.
- [ ] Existing filtering behavior from task 018 still passes.
- [ ] No proxy logging or internal endpoint contracts change.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run test -- packages/explorer`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local Explorer state/component code only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this changes a user-facing diagnostic workflow in Explorer.
Separate review is required only if internal log endpoint contracts, proxy
logging behavior, or security-sensitive displayed data changes.

## Handoff Notes

To be completed by the implementer:

- changed files
- summary
- tests run
- skipped checks and residual risk
- self-check result
- review requirement decision
- task state movement
- `.agents/NEXT.md` update
- commit hash
- known gaps
