# Task: Await async proxy rule validation

Status: ready
Owner: unassigned
Created: 2026-05-04
Risk: high
Review: required

## Objective

Make custom proxy validation rules correctly reject requests when an async
validator resolves to `false`.

## Context

`ODataGuard.validate()` accepts a callback typed as
`boolean | Promise<boolean>`, but it currently checks only the immediate return
value. A callback returning `Promise.resolve(false)` is not rejected. Proxy
rules are part of authorization and policy behavior, so this needs focused
tests and review.

Relevant files:

- `packages/proxy/src/utils/rules.ts`
- `packages/proxy/src/api/odata.ts`
- `packages/proxy/test/rules.test.ts`
- `API.md`
- `SECURITY.md`

## Scope

- Change the validation API or add an async validation path so async validators
  are awaited before proxying.
- Ensure programmatic hook usage can block requests with async validators.
- Add tests for async allow and async deny cases.
- Preserve the existing synchronous validation behavior.

## Non-Goals

- Do not redesign the full `ODataGuard` fluent API unless needed for this fix.
- Do not add new rule types.
- Do not change XSUAA scope or attribute semantics.
- Do not alter non-validation proxy rules.

## Acceptance Criteria

- [ ] A custom validator returning `Promise.resolve(false)` rejects with 403.
- [ ] A custom validator returning `Promise.resolve(true)` allows the request.
- [ ] Existing synchronous validation tests still pass.
- [ ] Any public API or documentation mismatch is updated or explicitly noted.
- [ ] The fix does not introduce unhandled promise rejections.

## Verification

Task-local checks:

- `pnpm.cmd run test -- packages/proxy/test/rules.test.ts`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run test -- packages/proxy`
- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because proxy rules may enforce authorization and policy boundaries.
Separate review is required under `.agents/WORKFLOW.md`.

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
