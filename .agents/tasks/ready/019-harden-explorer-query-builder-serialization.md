# Task: Harden Explorer query builder serialization

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if core query contracts change

## Objective

Make the Explorer visual query builder serialize OData filters more safely for
common string and numeric values before sending preview requests.

## Context

Task 005 fixed OData key literal escaping in the Nuxt composable. The Explorer
query builder has its own lightweight serialization in
`packages/explorer/composables/useEntityExplorer.ts`, including quoted string
filters. It should have focused tests for escaping embedded quotes and avoiding
invalid query strings for common builder values.

Relevant docs:

- `DESIGN.md`
- `DOMAIN_MODEL.md`
- `.agents/tasks/done/005-escape-odata-key-literals.md`
- `.agents/tasks/done/012-expand-explorer-state-tests.md`

## Scope

- Add failing Explorer state tests for visual query builder serialization of:
  - string values containing single quotes
  - function filters such as `contains`
  - numeric pagination/filter values
- Fix the Explorer serialization only as needed by the tests.
- Keep behavior local to Explorer unless a proven reusable OData concern belongs
  in `@bc8-odx/core`.
- Preserve existing manual `queryInput` behavior.

## Non-Goals

- Do not rewrite the query builder UI.
- Do not implement the full OData expression grammar.
- Do not change `useOData()` composable contracts in this task.
- Do not add new dependencies.

## Acceptance Criteria

- [ ] String filter values escape embedded single quotes using OData literal
  rules.
- [ ] Function filters serialize escaped string values correctly.
- [ ] Numeric values are not quoted as strings.
- [ ] Existing query builder reset/cache behavior still passes.
- [ ] Any decision to move logic into `core` is justified in handoff notes.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer exec vitest run`
- `pnpm.cmd run test -- packages/explorer`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local tests only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this changes request construction in a user-facing
developer tool. Separate review is required only if the task moves behavior into
`core`, changes public query contracts, or touches proxy/server behavior.

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
