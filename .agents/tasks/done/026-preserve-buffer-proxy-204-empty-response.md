# Task: Preserve buffer proxy 204 empty response

Status: done
Owner: Codex orchestrator
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

Completed implementation on 2026-05-05 by Codex Implementer.

- changed files:
  - `packages/proxy/src/api/odata.ts`
  - `packages/proxy/test/integration.test.ts`
  - `packages/proxy/test/fixtures/backend.ts`
  - `.agents/tasks/ready/026-preserve-buffer-proxy-204-empty-response.md`
- summary:
  - Added a local buffered proxy integration regression for a mutating backend
    request that returns `204 No Content`.
  - Extended the existing create-style backend fixture to return `204 No
    Content` with an empty payload for an explicit test body.
  - Updated buffered proxy success handling so `204` responses record no
    DevTools response body and return an explicit empty payload to H3, avoiding
    an unhandled-route `404` while preserving HTTP 204 semantics.
  - Did not alter stream mode, Explorer, auth, destination resolution, proxy
    rules, benchmark assertions, or DevTools redaction.
- failing-test evidence:
  - Before implementation, after the fixture was wired through an existing
    mutating proxy route, `pnpm.cmd exec vitest run
    packages/proxy/test/integration.test.ts` failed on the new test with
    `FetchError: [POST] ".../api/odx/TestService/CreatedProducts": 404 Cannot
    find any path matching /api/odx/TestService/CreatedProducts.` at
    `packages/proxy/test/integration.test.ts:137`.
  - Earlier fixture-shaping attempts against newly named DELETE/POST routes
    also returned `404`; those pointed at test harness routing shape, so the
    final regression uses the existing `CreatedProducts` route and explicit
    body trigger.
- tests run:
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
    (`11 passed`).
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
    (suite intentionally skipped by default: `1 skipped`).
  - PASS: `pnpm.cmd run typecheck`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No requested checks were skipped.
  - `packages/proxy/test/performance.test.ts` remains skipped by its existing
    default benchmark guard.
- self-check result:
  - Scope stayed limited to buffered proxy `204 No Content` behavior.
  - Acceptance criteria are met for client status `204`, DevTools log status
    `204`, empty response body semantics, and existing buffered `200`, buffered
    `201`, stream/performance suite invocation, and error-forwarding coverage.
  - Public proxy HTTP behavior changed intentionally; security-sensitive auth,
    destination, rules, redaction, and stream paths were left untouched.
  - Existing unrelated change `packages/explorer/test/state.test.ts` was
    present before implementation and left untouched.
- review requirement decision:
  - Separate review is required because this changes public proxy HTTP behavior
    and the task explicitly marks review as required.
- task state movement:
  - Not moved. The operator explicitly requested that the orchestrator move
    task state.
- `.agents/NEXT.md` update:
  - Not updated. The operator explicitly reserved integration/review workflow
    state handling for the orchestrator.
- commit hash:
  - Not committed by request.
- known gaps:
  - None for the scoped implementation. Independent review is still required.

## Review Notes

Reviewed 2026-05-05 by independent Reviewer worker.

- decision: approved
- findings: none
- focused verification:
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
    (`11 passed`)
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
    (existing suite guard reported `1 skipped`)
  - PASS: `pnpm.cmd run typecheck`
  - PASS: `pnpm.cmd run lint`
- acceptance criteria:
  - buffered `204 No Content` regression test: pass
  - proxied client response status is `204`: pass
  - DevTools log records status `204`: pass
  - response body matches HTTP 204 semantics: pass
  - error forwarding and stream path unchanged: pass
  - separate review requested and completed: pass
- residual risk:
  - performance test remains skipped by its existing benchmark guard. Reviewer
    did not consider this blocking because stream mode was not modified.
