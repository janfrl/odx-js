# Task: Cover buffered service-specific response hooks

Status: ready
Owner: unassigned
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

