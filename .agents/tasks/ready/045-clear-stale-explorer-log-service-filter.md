# Task: Clear stale Explorer log service filter

Status: ready
Owner: unassigned
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

- [ ] Tests cover service-filter preservation by service name.
- [ ] Tests cover service-filter preservation by route alias.
- [ ] Tests cover stale service-filter cleanup after config refresh.
- [ ] Existing Explorer state tests remain green.
- [ ] No internal endpoint contracts, proxy logs, or visible UI layout change.

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

