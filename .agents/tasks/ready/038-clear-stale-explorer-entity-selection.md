# Task: Clear stale Explorer entity selection

Status: ready
Owner: unassigned
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

- [ ] Tests cover selected entity preservation when the entity remains valid.
- [ ] Tests cover stale selected entity cleanup when the entity disappears.
- [ ] Tests cover selected service cleanup when the service disappears.
- [ ] Existing Explorer state tests remain green.
- [ ] No internal endpoint contracts or proxy logging behavior change.

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

