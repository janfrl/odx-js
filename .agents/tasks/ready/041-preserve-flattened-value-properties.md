# Task: Preserve flattened value properties

Status: ready
Owner: unassigned
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

- [ ] Tests fail before the fix for at least one entity property named `value`.
- [ ] OData V4 collection envelopes still flatten to arrays.
- [ ] Scalar and nested entity `value` properties are preserved.
- [ ] Existing core utility tests remain green.
- [ ] No Nuxt, proxy, Explorer, or generated type behavior changes are included.

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

