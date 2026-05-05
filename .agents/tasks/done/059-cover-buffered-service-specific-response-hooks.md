# Task: Cover buffered service-specific response hooks

Status: done
Owner: Codex Implementer
Created: 2026-05-05
Risk: high
Review: required

## Objective

Make buffered proxy responses call and await both generic and service-specific
response hooks, matching the typed hook surface already exposed by
`ODataProxyHooks`.

## Context

Request hooks call both `odx:proxy:request` and
`odx:proxy:request:<serviceName>`. The public `ODataProxyHooks` type also
declares `odx:proxy:response:<serviceName>`, but buffered proxy execution only
calls the generic response hook and does not await the hook call inside
`ofetch` response handling. This task should address only the buffered mode
contract because stream proxy response-hook semantics are not clearly defined
by existing docs/tests.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `API.md`
- `packages/core/src/types.ts`
- `packages/proxy/src/api/odata.ts`
- `packages/proxy/test/integration.test.ts`

## Scope

- Add focused proxy integration tests proving buffered responses call:
  - `odx:proxy:response`
  - `odx:proxy:response:<serviceName>`
- Prove async buffered response hooks are awaited before the proxied request
  resolves when the hook mutates a test-visible side effect.
- Preserve direct-strategy hook bypass behavior.
- Preserve request hook behavior, status forwarding, DevTools logging, error
  forwarding, and stream proxy behavior.
- Update narrow API documentation only if it already describes response hooks
  and needs clarification for buffered mode.

## Non-Goals

- Do not add stream-mode response hooks, mutate streamed responses, change
  `proxyRequest` behavior, redesign the hook API, alter hook payload shape,
  change DevTools trace storage, or change direct strategy behavior.
- Do not add dependencies, change package scripts, or introduce browser-mode
  verification.

## Acceptance Criteria

- [ ] A focused test fails before implementation because the service-specific
  buffered response hook is not called.
- [ ] A focused test proves async buffered response hooks are awaited.
- [ ] Generic buffered response hooks still run.
- [ ] Direct-strategy requests still bypass proxy hooks.
- [ ] Proxy package verification remains green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/proxy exec vitest run test/integration.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use the existing local proxy/backend fixtures; do not depend on external
  OData services.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because proxy hooks are public extension contracts and external
integration behavior. Separate review is required. The task intentionally
excludes stream proxy response-hook behavior because the expected contract is
not clear enough from current docs/tests.

## Handoff Notes

- Changed files:
  - `packages/proxy/src/api/odata.ts`
  - `packages/proxy/test/integration.test.ts`
  - `API.md`
  - `docs/content/en/3.proxy/4.reference.md`
  - `.agents/NEXT.md`
  - `.agents/tasks/done/059-cover-buffered-service-specific-response-hooks.md`
- Summary:
  - Added focused proxy integration coverage for buffered generic and service-specific response hooks.
  - Added coverage proving async service-specific buffered response hooks are awaited before the proxied request resolves.
  - Updated buffered proxy response handling to await generic and service-specific response hooks.
  - Clarified public docs that response hooks are buffered-mode hooks and stream response-hook behavior is not currently defined.
- Initial failing test result:
  - `pnpm.cmd --filter @bc8-odx/proxy exec vitest run test/integration.test.ts -t "generic and service-specific buffered response hooks|awaits async buffered response hooks"` failed before implementation: service-specific response hook was called 0 times, and async hook side effect remained `false` after request resolution.
- Tests run:
  - `pnpm.cmd --filter @bc8-odx/proxy exec vitest run test/integration.test.ts -t "generic and service-specific buffered response hooks|awaits async buffered response hooks"` passed after implementation.
  - `pnpm.cmd --filter @bc8-odx/proxy exec vitest run test/integration.test.ts` passed, 13 tests.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` passed, 9 test files, 84 passed, 1 skipped, plus proxy standalone example.
  - `pnpm.cmd run typecheck` passed.
  - `pnpm.cmd run lint` passed.
- Skipped checks and residual risk:
  - None.
- Self-check result:
  - Scope matches the task: buffered response hooks only; no stream proxy behavior changes.
  - Direct-strategy bypass, request hooks, status forwarding, DevTools logging, and error forwarding remain covered by the full proxy integration file and package verification.
  - No new dependencies or unrelated refactors.
  - Documentation updates are narrow and match the public hook contract.
- Review requirement decision:
  - Separate review is required because this touches public proxy hook behavior.
- Task state movement:
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Updated to a reviewer prompt for this completed task.
- Commit hash:
  - To be filled after commit.
- Known gaps:
  - Stream proxy response-hook behavior remains intentionally undefined and unchanged.
