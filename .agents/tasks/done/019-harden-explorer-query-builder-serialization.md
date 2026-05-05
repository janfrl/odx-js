# Task: Harden Explorer query builder serialization

Status: done
Owner: Codex orchestrator
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

Completed 2026-05-05 by Implementer worker and integrated by Orchestrator.

- changed files:
  - `packages/explorer/composables/useEntityExplorer.ts`
  - `packages/explorer/test/state.test.ts`
- failing-test evidence:
  - Added tests first, then ran
    `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`.
  - Pre-fix failures showed:
    - `Name eq 'Bob's Tea'` instead of `Name eq 'Bob''s Tea'`
    - `contains(Name,'Bob's')` instead of `contains(Name,'Bob''s')`
    - `Price ge '12.5'` instead of `Price ge 12.5`
- summary:
  - Escaped embedded single quotes in visual builder string literals.
  - Applied the same escaping to function filters such as `contains`.
  - Used the current entity schema to serialize numeric EDM property values
    without string quotes when the builder value is numeric-looking text.
  - Kept the serialization helper local to Explorer and reused existing entity
    schema lookup behavior.
- tests run:
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`
    (Implementer).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run`.
  - PASS: `pnpm.cmd run test -- packages/explorer`.
  - PASS: `pnpm.cmd run typecheck`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No task-local checks were skipped.
  - This remains a lightweight serializer for common builder values, not a full
    OData expression grammar.
- self-check result:
  - Scope stayed local to Explorer query-state serialization and tests.
  - Manual `queryInput` behavior was not changed.
  - No `@bc8-odx/core`, `useOData()` composable, proxy, server, UI layout, or
    dependencies changed.
- review requirement decision:
  - Separate review is not required because no core query contracts, public
    composable contracts, or proxy/server behavior changed.
- task state movement:
  - Moved to `.agents/tasks/done/` by Orchestrator.
- `.agents/NEXT.md` update:
  - Updated to planner mode because no implementation tasks remain in
    `.agents/tasks/ready/`.
- commit hash:
  - Pending at handoff update time.
- known gaps:
  - None beyond the intentionally limited grammar scope.
