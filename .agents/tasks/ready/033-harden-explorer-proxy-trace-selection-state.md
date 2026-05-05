# Task: Harden Explorer proxy trace selection state

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if proxy logging or `/__odx__/logs` contracts change

## Objective

Add state-level Explorer tests for proxy trace selection when logs refresh,
clear, or no longer contain the selected trace, and fix only proven state bugs.

## Context

Recent Explorer tasks improved Traffic Monitor filtering without UI churn. The
Proxy Trace tab also depends on client-side log state and selected log IDs. It
should remain predictable when logs are cleared or refreshed from the internal
logs endpoint.

Relevant docs and files:

- `DESIGN.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/components/tabs/TabProxy.vue`
- `packages/explorer/test/state.test.ts`
- `.agents/tasks/done/018-add-explorer-traffic-search-and-status-filters.md`
- `.agents/tasks/done/027-exclude-pending-logs-from-status-filters.md`

## Scope

- Add focused tests in `packages/explorer/test/state.test.ts` for proxy trace
  selection behavior when:
  - a selected trace log is still present after refresh
  - a selected trace log disappears after refresh
  - logs are cleared locally and on the server
- Update `packages/explorer/composables/useODataState.ts` only if the tests
  expose stale selection or inconsistent state.
- Update `TabProxy.vue` only if the selected-trace fallback is currently
  implemented there and cannot be tested through the composable.
- Preserve existing Traffic Monitor filtering and entity/query state tests.

## Non-Goals

- Do not redesign the Proxy Trace UI.
- Do not add browser verification or require a dev server.
- Do not change proxy logging payloads or `/__odx__/logs` endpoint behavior.
- Do not add new displayed log fields or sensitive data.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Tests cover selected trace persistence when the selected log remains
  available.
- [ ] Tests cover stale selected trace handling when the selected log disappears.
- [ ] Tests cover selected trace cleanup when traffic logs are cleared.
- [ ] Existing Explorer state tests remain green.
- [ ] No proxy logging contract or internal endpoint changes are made.

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

Medium risk because this affects user-facing diagnostics, but it should remain
client-side and test-backed. Separate review is not required if implementation
does not touch proxy logging, internal endpoint contracts, sensitive data
display, or broad UI behavior.

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
