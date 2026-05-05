# Task: Expand BTP destination edge tests

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: high
Review: required

## Objective

Increase confidence in BTP destination resolution with local tests for edge
cases that do not require a real SAP BTP account.

## Context

`resolveBtpDestination()` handles VCAP/default-env loading, destination service
token calls, principal propagation, on-premise connectivity, local fallback, and
production error behavior. Existing tests cover the main happy paths but leave
edge cases under-specified.

Relevant files:

- `packages/proxy/src/utils/btp-destination.ts`
- `packages/proxy/test/btp-destination.test.ts`
- `packages/proxy/src/plugins/btp-auth.ts`
- `packages/proxy/src/utils/target.ts`

## Scope

- Add failing tests first for selected edge cases.
- Prefer cases that can be verified with mocks only, such as:
  - malformed `VCAP_SERVICES`
  - `default-env.json` fallback loading
  - production failure behavior when Destination Service calls fail
  - cache key behavior for technical vs user-token lookups
  - on-premise connectivity defaults when proxy host/port are absent
- Fix implementation only when a new test proves a real bug.

## Non-Goals

- Do not require real SAP/BTP services.
- Do not change authentication semantics without a failing test and separate
  review.
- Do not log or store real credentials in tests.

## Acceptance Criteria

- [ ] New local tests cover at least three meaningful BTP destination edge cases.
- [ ] Any implementation changes are test-first and narrowly scoped.
- [ ] Existing BTP destination happy-path tests still pass.
- [ ] Security/privacy implications are recorded in handoff notes.
- [ ] Separate review is requested after implementation.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use mocks/local fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because BTP destination resolution touches authentication,
credentials, principal propagation, and on-premise connectivity. Separate review
is required.

## Handoff Notes

To be completed by the implementer.
