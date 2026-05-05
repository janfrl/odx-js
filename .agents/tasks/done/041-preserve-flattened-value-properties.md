# Task: Preserve flattened value properties

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if public utility contracts change beyond the scoped bug fix

## Objective

Make `flattenOData` preserve ordinary entity properties named `value` when the
input is not an OData collection envelope.

## Context

`flattenOData` currently treats `value` as an OData V4 collection envelope key
whenever it appears on an object. That is correct for `{ value: [...] }`, but
it can drop a legitimate scalar or object property named `value` on an entity
payload. Core utilities are framework-agnostic package behavior, so this should
be fixed with focused tests first.

Relevant docs and files:

- `ARCHITECTURE.md`
- `DOMAIN_MODEL.md`
- `packages/core/src/odata-utils.ts`
- `packages/core/test/odata-utils.test.ts`
- `examples/core-standalone.ts`

## Scope

- Add focused tests in `packages/core/test/odata-utils.test.ts` proving:
  - OData V4 `{ value: [...] }` collection envelopes still unwrap.
  - Plain objects with scalar `value` properties preserve that property.
  - Plain objects with nested object `value` properties preserve and flatten
    that nested value.
- Update `flattenOData` only as needed to distinguish collection envelopes from
  ordinary entity properties.
- Keep metadata stripping, binary handling, depth protection, and V2 `d.results`
  behavior unchanged.

## Non-Goals

- Do not redesign `flattenOData` or change its max-depth behavior.
- Do not change `$odata`, query stringification, EDMX parsing, or proxy code.
- Do not add dependencies.
- Do not change public type names or exports.

## Acceptance Criteria

- [x] Tests fail before the fix for at least one entity property named `value`.
- [x] OData V4 collection envelopes still flatten to arrays.
- [x] Scalar and nested entity `value` properties are preserved.
- [x] Existing core utility tests remain green.
- [x] No Nuxt, proxy, Explorer, or generated type behavior changes are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/core/test/odata-utils.test.ts`
- `pnpm.cmd --filter @bc8-odx/core run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local core tests and fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches a public core utility contract used across
packages. Separate review is not required if the change is narrowly test-backed
and limited to preserving ordinary `value` properties while keeping OData
envelope behavior intact.

## Handoff Notes

- changed files:
  - `packages/core/src/odata-utils.ts`
  - `packages/core/test/odata-utils.test.ts`
  - `.agents/tasks/done/041-preserve-flattened-value-properties.md`
- summary:
  - Added focused `flattenOData` tests for V4 `{ value: [...] }` envelopes,
    scalar entity properties named `value`, and nested entity properties named
    `value`.
  - Confirmed the scalar and nested `value` property tests failed before the
    fix because `flattenOData` skipped all `value` keys.
  - Updated collection-envelope detection to unwrap only array-valued
    `results` or `value` properties, while preserving ordinary `value`
    properties during object flattening.
- tests run:
  - FAIL before fix: `pnpm.cmd exec vitest run packages/core/test/odata-utils.test.ts`
    (2 expected `value` property preservation failures).
  - PASS after fix: `pnpm.cmd exec vitest run packages/core/test/odata-utils.test.ts`
    (15 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/core run verify`
    (5 files passed, 26 tests passed, `examples/core-standalone.ts` passed).
  - PASS: `pnpm.cmd run typecheck`.
  - BLOCKED: `pnpm.cmd run lint` after core style cleanup only failed on a
    concurrent task 042 proxy edit: `packages/proxy/src/utils/url.ts` unused
    `RE_LEADING_SLASH`.
- skipped checks and residual risk:
  - No task-local core checks were skipped.
  - Full lint is pending the concurrent proxy task cleanup; the core files no
    longer report lint errors.
- self-check result:
  - Scope stayed in core flattening behavior and tests. Metadata stripping,
    binary handling, depth protection, V2 `d.results`, V4 array envelope
    unwrapping, query stringification, EDMX parsing, proxy, Nuxt, Explorer,
    generated types, dependencies, and lockfiles were not changed.
- review requirement decision:
  - Separate review is not required because the public utility contract change
    is narrowly test-backed and limited to preserving ordinary `value`
    properties while keeping envelope behavior intact.
- task state movement:
  - Moved this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Left unchanged while task 042 is concurrently in progress.
- commit hash:
  - pending commit.
- known gaps:
  - Broad lint should be rerun after task 042 finishes.
