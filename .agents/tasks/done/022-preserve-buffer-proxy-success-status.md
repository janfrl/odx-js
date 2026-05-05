# Task: Preserve buffer proxy success status

Status: done
Owner: Codex orchestrator
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

Completed implementation on 2026-05-05 by Codex Implementer.

- changed files:
  - `packages/proxy/src/api/odata.ts`
  - `packages/proxy/test/integration.test.ts`
  - `packages/proxy/test/fixtures/backend.ts`
  - `.agents/tasks/ready/022-preserve-buffer-proxy-success-status.md`
- summary:
  - Added a local `POST /CreatedProducts` backend fixture that returns
    `201 Created`.
  - Added an integration test proving buffered proxy mode preserves the
    successful backend status for the client and records the same status in
    DevTools logs.
  - Updated buffered proxy success handling to capture the actual `ofetch`
    response status, set it on the H3 response, and use it for DevTools trace
    and traffic log updates.
  - Did not alter stream mode, error forwarding, auth, destination resolution,
    proxy rules, or DevTools redaction.
- failing-test evidence:
  - Before implementation,
    `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` failed
    on the new test with `expected 200 to be 201` at
    `packages/proxy/test/integration.test.ts:120`.
- tests run:
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
    (`10 passed`).
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
    (suite intentionally skipped by default: `1 skipped`).
  - PASS: `pnpm.cmd run typecheck`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No task-requested checks were skipped.
  - `packages/proxy/test/performance.test.ts` is skipped by design unless the
    benchmark environment flag is enabled; this preserves existing normal test
    behavior.
- self-check result:
  - Scope stayed limited to buffered proxy HTTP success status semantics.
  - Acceptance criteria are met for a non-200 success status, DevTools log
    status, existing `200` success, and backend error forwarding via the focused
    integration suite.
  - Public proxy behavior changed intentionally; security-sensitive auth,
    destination, rules, redaction, and stream paths were left untouched.
  - Git status was clean before edits except for a global Git ignore permission
    warning outside the repo.
- review requirement decision:
  - Separate review is required because this changes public proxy HTTP behavior
    and the task explicitly requires review.
- task state movement:
  - Not moved. The operator explicitly requested not to move the task file; the
    orchestrator will integrate, review, move task state, and commit.
- `.agents/NEXT.md` update:
  - Not updated to avoid taking over orchestrator workflow state; next step is a
    separate review of this implemented task.
- commit hash:
  - Not committed by request.
- known gaps:
  - Final `git status --short` also reported unrelated README/package script
    changes outside this task scope. They were not edited by this implementer
    and were left untouched.

## Review Notes

Reviewed 2026-05-05 by independent Reviewer worker.

- decision: approved
- findings: none
- focused verification reviewed:
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
    (skipped by existing default behavior)
  - PASS: `pnpm.cmd run typecheck`
  - PASS: `pnpm.cmd run lint`
- acceptance criteria:
  - failing test evidence recorded: pass
  - buffered non-200 success status preserved for client: pass
  - DevTools log records actual success status: pass
  - existing `200` success and error forwarding covered: pass
  - stream-mode behavior unchanged: pass
  - separate review requested and completed: pass
- scope note:
  - unrelated README/package script changes were outside the reviewed task 022
    implementation and were not included in the task 022 commit.
