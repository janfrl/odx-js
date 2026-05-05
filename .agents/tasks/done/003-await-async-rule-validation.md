# Task: Await async proxy rule validation

Status: done
Owner: delegated implementer
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

- First add a focused failing test that demonstrates the suspected bug.
- Only change implementation after the failing test verifies the bug.
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

- [ ] The first implementation step adds a test that fails against current code
      for async denial.
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

- changed files: `packages/proxy/src/utils/rules.ts`,
  `packages/proxy/test/rules.test.ts`, and this task file
- summary: added async deny/allow tests for `ODataGuard.validate`; synchronous
  validators still return `this`, async validators return `Promise<this>` and
  reject through the existing 403 validation path when they resolve `false`
- tests run:
  - failing-test evidence before fix: async denial test failed because the
    request was not rejected
  - `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts`
  - `pnpm.cmd run typecheck`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run test`
- skipped checks and residual risk: none
- self-check result: scope, acceptance criteria, security guidance, and
  unrelated changes checked
- review requirement decision: separate review required because proxy rule
  enforcement is security-sensitive policy behavior
- task state movement: move from `.agents/tasks/ready/` to
  `.agents/tasks/done/`
- `.agents/NEXT.md` update: pending orchestrator integration
- commit hash: pending commit at handoff-note update time
- known gaps: async validation only blocks when the caller awaits or returns
  the promise from hook code

Review update:

- initial review requested durable API documentation for the async await/return
  requirement
- `API.md` now documents the requirement and includes an async validation
  example
- focused re-review approved the change
