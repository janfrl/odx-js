# Task: Escape OData key literals

Status: done
Owner: delegated implementer
Created: 2026-05-04
Risk: medium
Review: conditional - required only if the fix changes public composable shape
or broad URL construction behavior

## Objective

Correctly escape string key values in `useOData()` URL construction.

## Context

`packages/nuxt/src/runtime/composables/useOData.ts` formats string keys by
wrapping them in single quotes. OData string literals require embedded single
quotes to be escaped by doubling them. This affects `get`, `update`, and
`remove` paths for single and composite keys.

Relevant files:

- `packages/nuxt/src/runtime/composables/useOData.ts`
- `packages/nuxt/test/composables.test.ts`
- `API.md`
- `DOMAIN_MODEL.md`

## Scope

- First add a focused failing test for an embedded single quote in a key.
- Only change implementation after the failing test verifies the bug.
- Add or extract a small string-key escaping helper.
- Apply it consistently to single and composite key values.
- Add focused composable tests for keys containing single quotes.
- Preserve existing numeric and simple string key behavior.

## Non-Goals

- Do not implement full OData filter parsing.
- Do not change query string serialization.
- Do not change direct vs proxied service URL resolution.
- Do not alter generated type registry behavior.

## Acceptance Criteria

- [ ] The first implementation step adds a test that fails against current code
      for embedded single quotes.
- [ ] `get("O'Brien")` produces an OData key literal with doubled embedded
      quotes.
- [ ] Composite string keys escape embedded quotes.
- [ ] Existing key formatting tests still pass.
- [ ] Mutation methods use the same escaped key formatting.

## Verification

Task-local checks:

- `pnpm.cmd run test -- packages/nuxt/test/composables.test.ts`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run test -- packages/nuxt`
- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches public composable URL behavior. Separate review
is not required if the fix is narrowly scoped and tests pass; require review if
the implementer changes broader composable semantics.

## Handoff Notes

- changed files: `packages/nuxt/src/runtime/composables/useOData.ts`,
  `packages/nuxt/test/composables.test.ts`, and this task file
- summary: added OData string key literal escaping that doubles embedded single
  quotes for single and composite keys; added coverage for `get`, `update`, and
  `remove`
- tests run:
  - failing-test evidence before fix: embedded quote test failed because
    `O'Brien` was emitted as `'O'Brien'` instead of `'O''Brien'`
  - `pnpm.cmd exec vitest run packages/nuxt/test/composables.test.ts`
  - `pnpm.cmd run typecheck`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run test`
- skipped checks and residual risk: none
- self-check result: scope, acceptance criteria, public composable behavior,
  and unrelated changes checked
- review requirement decision: separate review not required; the API shape did
  not change and URL behavior change is narrowly limited to valid OData string
  literal escaping
- task state movement: move from `.agents/tasks/ready/` to
  `.agents/tasks/done/`
- `.agents/NEXT.md` update: pending orchestrator integration
- commit hash: pending commit at handoff-note update time
- known gaps: none
