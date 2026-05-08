# Task: Skip buffered response flattening when DevTools disabled

Status: done
Owner: Codex Implementer
Created: 2026-05-05
Completed: 2026-05-08
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

- [x] A focused test fails before implementation showing disabled DevTools
  buffered responses still perform log-only flattening or an equivalent
  observable side effect.
- [x] Disabled DevTools buffered responses return the same unflattened response
  body as before.
- [x] Enabled DevTools buffered responses still store flattened response bodies
  in logs.
- [x] Buffered response status handling, `204` behavior, and response hooks
  remain covered and green.
- [x] Handoff notes explicitly request independent review before continuing
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

Completed implementation on 2026-05-08 by Codex Implementer.

- changed files:
  - `packages/proxy/src/api/odata.ts`
  - `packages/proxy/test/integration.test.ts`
  - `.agents/NEXT.md`
  - `.agents/tasks/done/076-skip-buffered-response-flattening-when-devtools-disabled.md`
- summary:
  - Added an integration regression with a disabled-DevTools buffered proxy
    service and mocked `flattenOData()` call tracking.
  - Proved disabled DevTools buffered responses return the original OData
    envelope body to callers, create no DevTools log entry, and no longer
    invoke `flattenOData()` solely for response logs.
  - Guarded the buffered success response log body calculation with
    `tracer.enabled` so enabled DevTools logs still receive flattened response
    bodies and `204` log bodies remain omitted.
  - Did not change core `flattenOData()` semantics, stream proxy behavior,
    response-hook contracts, mock responses, dependencies, lockfiles, or
    generated files.
- failing-test evidence:
  - Before implementation, `pnpm.cmd exec vitest run
    packages/proxy/test/integration.test.ts -t "skips log-only flattening"`
    failed with `AssertionError: expected "vi.fn()" to not be called at all,
    but actually been called 1 times`; the call argument was the original
    `{ d: { results: [...] } }` backend response body.
- tests run:
  - FAIL before fix, then PASS after fix:
    `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts -t
    "skips log-only flattening"` (`1 passed`, `14 skipped` after fix).
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
    (`15 passed`).
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
    (`24 passed`, `1 skipped` by the existing benchmark timing guard).
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify` (`11` proxy test
    files passed, `161` tests passed, `1` skipped, plus the standalone proxy
    example).
  - PASS: `pnpm.cmd run lint`.
  - PASS: `pnpm.cmd run typecheck`.
- skipped checks and residual risk:
  - No required checks were skipped.
  - Full benchmark timing scenarios with `ODX_PROXY_BENCHMARK=1` were not run
    because the task explicitly does not require them; residual risk is limited
    to quantitative timing deltas, not functional behavior.
- self-check result:
  - Scope stayed limited to the buffered proxy response logging path, focused
    integration coverage, and `.agents` workflow state.
  - Enabled DevTools response log shape remains covered by existing flattened
    log assertions.
  - Buffered success status handling, `204 No Content`, buffered generic and
    service-specific response hooks, error forwarding, stream mode coverage,
    and mock responses remain green in the required checks.
  - No Explorer UI, benchmark scenario definition, public hook contract,
    dependency, lockfile, generated file, or unrelated runtime behavior was
    changed.
- review requirement decision:
  - Separate review is required because the task explicitly requires review and
    the change touches production proxy runtime behavior in the buffered
    response path.
- task state movement:
  - Moved from `ready` to `in-progress` before implementation. The direct
    `Move-Item` attempt was denied by filesystem permissions, so the move was
    completed with a patch-based move.
  - Moved from `in-progress` to `done` only after implementation and
    verification passed.
- `.agents/NEXT.md` update:
  - Updated to a fresh Reviewer prompt for task 076.
- commit hash:
  - Commit containing this handoff.
- known gaps:
  - Independent review is pending before continuing past this runtime proxy
    behavior change.
