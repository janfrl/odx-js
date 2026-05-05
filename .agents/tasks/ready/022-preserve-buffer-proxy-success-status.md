# Task: Preserve buffer proxy success status

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: high
Review: required

## Objective

Make buffered proxy responses preserve successful backend HTTP status codes
instead of normalizing every successful response to `200`.

## Context

`packages/proxy/src/api/odata.ts` uses `ofetch` for buffer mode so DevTools can
inspect response bodies. The current success path records status `200` after
`ofetch` resolves. That is correct for ordinary reads, but it risks hiding
successful `201 Created`, `202 Accepted`, or `204 No Content` semantics from
callers and DevTools logs.

Relevant docs:

- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `.agents/tasks/done/014-expand-proxy-performance-scenarios.md`
- `.agents/tasks/done/021-record-proxy-benchmark-baseline-output.md`

## Scope

- Add failing tests first in `packages/proxy/test/integration.test.ts` and, if
  needed, the local backend fixture under `packages/proxy/test/fixtures/`.
- Cover at least one non-200 successful buffered backend response, preferably
  `201` for a create-style request and/or `204` for a delete-style request.
- Update `packages/proxy/src/api/odata.ts` only as needed to preserve the
  backend success status on the client response and in DevTools logs.
- Preserve existing error forwarding behavior and existing stream-mode behavior.
- Keep verification local; do not require SAP/BTP services.

## Non-Goals

- Do not redesign proxy buffering or replace `ofetch`.
- Do not change response payload shapes except where HTTP status semantics make
  an empty response necessary.
- Do not alter authentication, destination resolution, rule semantics, or
  DevTools log redaction.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Tests fail before implementation because buffered success statuses are
  not preserved.
- [ ] Buffered proxy responses preserve at least one non-200 successful backend
  status for the client.
- [ ] DevTools traffic logs record the actual successful backend status.
- [ ] Existing 200 success and backend error forwarding tests still pass.
- [ ] Stream-mode behavior is unchanged or explicitly covered if touched.
- [ ] Separate review is requested after implementation.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local proxy/backend fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this changes public proxy HTTP behavior and can affect
external clients that depend on response statuses. Separate review is required
by `.agents/WORKFLOW.md` for public HTTP API/proxy contract changes.

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
