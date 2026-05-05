# Task: Preserve buffer proxy 204 empty response

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: high
Review: required

## Objective

Add a focused regression for buffered proxy `204 No Content` responses and fix
the buffered path only if the test exposes incorrect status, body, or log
behavior.

## Context

Task 022 fixed buffered proxy preservation for successful non-200 responses
using a `201 Created` fixture. `204 No Content` is the remaining success status
most likely to expose body-handling edge cases because the backend intentionally
returns no payload.

Relevant docs:

- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `.agents/tasks/done/022-preserve-buffer-proxy-success-status.md`

## Scope

- Add a failing or protective test first in
  `packages/proxy/test/integration.test.ts`.
- Add or extend a local fixture route in
  `packages/proxy/test/fixtures/backend.ts` for a mutating request that returns
  `204 No Content`.
- Verify buffered proxy mode preserves the `204` status for the client and in
  DevTools traffic logs.
- Verify the client response does not become a misleading JSON body.
- Change `packages/proxy/src/api/odata.ts` only if the new test shows the
  current behavior is wrong.

## Non-Goals

- Do not redesign proxy buffering or replace `ofetch`.
- Do not change stream mode unless a focused assertion proves it was already
  involved.
- Do not change authentication, destination resolution, rule semantics,
  request hooks, response hooks, or DevTools redaction.
- Do not add dependencies.

## Acceptance Criteria

- [ ] A local integration test covers a buffered proxy `204 No Content`
  backend response.
- [ ] The proxied client response status is `204`.
- [ ] DevTools logs record status `204` for the request.
- [ ] The proxied response body remains empty or otherwise matches HTTP 204
  semantics.
- [ ] Existing buffered `200`, buffered `201`, stream, and error-forwarding
  coverage remains green.
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

High risk because this validates public proxy HTTP behavior for a success status
used by OData mutations. Separate review is required by `.agents/WORKFLOW.md`
for public HTTP/proxy contract work.

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
