# Task: Harden Explorer proxy trace selection state

Status: done
Owner: Codex orchestrator
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

- changed files:
  - `packages/explorer/test/state.test.ts`
  - `packages/explorer/composables/useODataState.ts`
- summary:
  - Added state-level tests proving selected proxy trace behavior across log
    refresh and clear flows.
  - Confirmed selected trace is preserved when the refreshed logs still contain
    the selected log.
  - Fixed stale selected trace state when refreshed logs no longer contain the
    selected log or when logs are cleared.
- tests run:
  - Before fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "selected proxy trace"`
    failed for stale selected trace after refresh and clear.
  - After fix: same targeted command passed, 4 selected-trace tests passed.
  - `pnpm.cmd --filter @bc8-odx/explorer run verify` - passed, 21 tests.
  - `pnpm.cmd run test -- packages/explorer` - passed, 17 files / 130 tests,
    1 skipped by existing suite behavior.
  - `pnpm.cmd run typecheck` - passed.
- skipped checks and residual risk:
  - `pnpm.cmd run lint` skipped; changes are small TypeScript test/composable
    edits, typecheck and focused verification passed. Residual risk is low.
- self-check result:
  - Scope stayed client-side in Explorer state. No proxy logging payload,
    `/__odx__/logs` endpoint contract, sensitive data display, or broad UI
    behavior changed.
- review requirement decision:
  - Separate review is not required because proxy logging contracts and
    internal endpoints were not changed.
- task state movement:
  - Move this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - No change; it should remain pointed at the lower-numbered ready task
    `.agents/tasks/ready/032-validate-btp-destination-url.md`.
- commit hash:
  - pending commit.
- known gaps:
  - none.
