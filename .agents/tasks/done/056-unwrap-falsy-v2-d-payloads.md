# Task: Unwrap falsy V2 d payloads

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if behavior changes beyond proven top-level OData V2 envelope unwrapping

## Objective

Make core OData flattening unwrap top-level V2 `d` envelopes whose payload is
falsy when focused tests prove the current behavior is wrong.

## Context

`flattenOData()` currently unwraps V2 payloads with `if (data.d)`. That misses
valid falsy scalar payloads such as `0`, `false`, or an empty string when they
arrive inside an OData V2 `{ d: ... }` envelope. Recent flattening work
preserved entity properties named `value`; this task should similarly avoid
mistaking ordinary entity fields for envelopes while fixing only the proven
top-level V2 case.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/041-preserve-flattened-value-properties.md`
- `packages/core/src/odata-utils.ts`
- `packages/core/test/odata-utils.test.ts`
- `examples/core-standalone.ts`

## Scope

- Add focused failing tests first for top-level V2 envelopes with falsy scalar
  `d` payloads, including at least `0`, `false`, and `''`.
- Update `flattenOData()` so those proven V2 envelopes unwrap to the payload
  value instead of becoming `null` or losing the value.
- Preserve existing flattening for `d.results`, V4 `value` collections,
  metadata removal, binary placeholders, and nested entity properties.
- Add or preserve a guard that ordinary entity objects with a property named
  `d` are not collapsed when they also contain normal entity fields.

## Non-Goals

- Do not redesign the flattener, add schema-aware parsing, change public types,
  change proxy or Nuxt behavior, change examples beyond test fixture needs,
  add dependencies, or alter OData V4 `value` envelope behavior.
- Do not broaden the fix to ambiguous nested `d` properties unless a focused
  test proves they are OData envelopes and the behavior remains reviewable.
- Do not remove the prior protection for entity properties named `value`.

## Acceptance Criteria

- [x] Tests fail before implementation for falsy top-level V2 `d` payloads.
- [x] `flattenOData({ d: 0 })` returns `0`.
- [x] `flattenOData({ d: false })` returns `false`.
- [x] `flattenOData({ d: '' })` returns `''`.
- [x] Ordinary entity objects with their own `d` property and other fields are
  preserved rather than unwrapped.
- [x] Core package verification remains green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/core exec vitest run test/odata-utils.test.ts`
- `pnpm.cmd --filter @bc8-odx/core run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use deterministic core unit tests and the existing standalone core example.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this changes core data transformation behavior used across
packages. Separate review is not required if the fix is limited to proven
top-level V2 envelope unwrapping with focused tests and does not alter public
types, proxy behavior, Nuxt behavior, or V4 collection semantics.

## Handoff Notes

- changed files
  - `packages/core/src/odata-utils.ts`
  - `packages/core/test/odata-utils.test.ts`
  - `.agents/tasks/done/056-unwrap-falsy-v2-d-payloads.md`
  - `.agents/NEXT.md`
- summary
  - Added focused tests for `{ d: 0 }`, `{ d: false }`, and `{ d: '' }`.
  - Added a guard test proving ordinary entity objects with `d` plus other
    fields are preserved.
  - Replaced truthy `data.d` envelope detection with explicit V2
    envelope-shape detection using `Object.hasOwn(data, 'd')` and only `d` or
    `__metadata` keys.
- tests run
  - FAIL before fix: `pnpm.cmd --filter @bc8-odx/core exec vitest run test/odata-utils.test.ts -t "falsy scalar|ordinary entity"`; falsy `d` envelope returned `{ d: 0 }`.
  - PASS: `pnpm.cmd --filter @bc8-odx/core exec vitest run test/odata-utils.test.ts`
  - PASS: `pnpm.cmd --filter @bc8-odx/core run verify`
  - PASS: `pnpm.cmd run typecheck`
  - Initial `pnpm.cmd run lint` failed on `prefer-object-has-own`.
  - PASS after fix: `pnpm.cmd run lint`
- skipped checks and residual risk
  - None.
- self-check result
  - Scope stayed limited to core flattening behavior and focused tests. Existing
    `d.results`, V4 `value` collections, metadata stripping, binary
    placeholders, nested entity properties, and entity `value` field behavior
    are preserved by existing tests.
- review requirement decision
  - Separate review is not required because the fix is limited to proven V2
    envelope unwrapping and does not alter public types, proxy behavior, Nuxt
    behavior, or V4 collection semantics.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update
  - Updated to point at `.agents/tasks/ready/057-run-stability-checkpoint.md`.
- commit hash
  - The task implementation commit is the commit containing this handoff.
- known gaps
  - None.
