# Task: Add Explorer traffic search and status filters

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if internal log endpoint contracts change

## Objective

Improve the Explorer Traffic Monitor by adding client-side search and status
filtering for recorded OData logs without changing proxy logging semantics.

## Context

Recent Explorer work expanded state/composable coverage, and DevTools logging
was audited for sensitive authorization handling. The Traffic Monitor currently
filters by service only. For larger local sessions and benchmark/devtools
follow-ups, users need to quickly isolate failed requests, methods, entity sets,
or URL fragments.

Relevant docs:

- `DESIGN.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `.agents/tasks/done/009-expand-explorer-tests.md`
- `.agents/tasks/done/012-expand-explorer-state-tests.md`

## Scope

- Add Explorer state for traffic search text and status/category filtering.
- Update `packages/explorer/components/tabs/TabLogs.vue` with compact Nuxt UI
  controls that fit the existing workbench header.
- Add or extend tests in `packages/explorer/test/state.test.ts` for filtering
  behavior.
- Filters should work across service name, entity set/path, method, status, and
  target URL when present.
- Preserve the existing service filter and clear-log behavior.

## Non-Goals

- Do not change `@bc8-odx/proxy` logging behavior or `/__odx__/logs` payloads.
- Do not add server-side search.
- Do not redesign the Traffic Monitor.
- Do not display new sensitive fields.

## Acceptance Criteria

- [ ] Traffic logs can be filtered by free-text search.
- [ ] Traffic logs can be filtered to failures and non-failures, or equivalent
  status categories.
- [ ] Existing service filter behavior still works and composes with the new
  filters.
- [ ] Explorer state tests cover the filter combinations.
- [ ] UI remains compact and consistent with `DESIGN.md`.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer exec vitest run`
- `pnpm.cmd run test -- packages/explorer`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local component/composable tests only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because Explorer is user-facing and renders diagnostic data.
Separate review is required only if the task changes internal log endpoint
contracts or touches proxy logging/security behavior.

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
