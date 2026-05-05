# Task: Skip buffered response flattening when DevTools disabled

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: required

## Objective

Avoid flattening buffered proxy response bodies solely for DevTools logs when
DevTools logging is disabled, while preserving the actual buffered response
returned to callers.

## Context

Task 071 removed disabled DevTools trace accumulation. The buffered proxy path
still calls `flattenOData(responseData)` when updating DevTools logs after a
successful buffered response. When DevTools logging is disabled, that
flattening work is unnecessary because no log entry will be stored, and it can
be costly for large responses.

This task should optimize only the disabled-DevTools log-update path. It must
not change the response body returned by the proxy, enabled DevTools log body
shape, hook behavior, or stream mode.

Relevant files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/022-preserve-buffer-proxy-success-status.md`
- `.agents/tasks/done/026-preserve-buffer-proxy-204-empty-response.md`
- `.agents/tasks/done/059-cover-buffered-service-specific-response-hooks.md`
- `.agents/tasks/done/071-skip-devtools-trace-allocation-when-disabled.md`
- `packages/proxy/src/api/odata.ts`
- `packages/proxy/src/utils/trace.ts`
- `packages/proxy/test/integration.test.ts`
- `packages/proxy/test/performance.test.ts`

## Scope

- Add failing tests first proving disabled DevTools buffered responses do not
  perform log-only flattening while the caller still receives the original
  buffered response body.
- Preserve enabled DevTools behavior: response logs should continue to receive
  flattened response bodies where they did before.
- Preserve `204 No Content` behavior, successful backend status forwarding,
  buffered response hooks, service-specific hooks, error forwarding, stream
  mode behavior, and mock responses.
- Keep the change narrow to the proxy buffered response logging path.

## Non-Goals

- Do not change core `flattenOData()` semantics.
- Do not change stream proxy response-hook behavior.
- Do not alter buffered response payloads returned to callers.
- Do not change DevTools enabled log payload shape, Explorer UI, benchmark
  scenario definitions, public hook contracts, dependencies, lockfiles, or
  generated files.
- Do not introduce broad tracing or logging abstractions.

## Acceptance Criteria

- [ ] A focused test fails before implementation showing disabled DevTools
  buffered responses still perform log-only flattening or an equivalent
  observable side effect.
- [ ] Disabled DevTools buffered responses return the same unflattened response
  body as before.
- [ ] Enabled DevTools buffered responses still store flattened response bodies
  in logs.
- [ ] Buffered response status handling, `204` behavior, and response hooks
  remain covered and green.
- [ ] Handoff notes explicitly request independent review before continuing
  past this runtime proxy behavior change.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use existing local proxy fixtures only.
- Do not require full `ODX_PROXY_BENCHMARK=1` timing runs.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches production proxy runtime behavior in the
buffered response path. Separate review is required to verify that caller
responses, enabled DevTools logs, status handling, and hook contracts do not
regress.

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
