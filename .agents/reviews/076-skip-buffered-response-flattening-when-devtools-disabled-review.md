# Review: Skip buffered response flattening when DevTools disabled

Status: complete
Date: 2026-05-08
Reviewer: Codex Reviewer
Task: `.agents/tasks/done/076-skip-buffered-response-flattening-when-devtools-disabled.md`
Reviewed commit: `130e45db357b6560cf047c70c087531df3952bc7`
Decision: approved

## Findings

None.

## Acceptance Criteria

- [x] Focused failing-test evidence is recorded in the task handoff: pass
- [x] Disabled DevTools buffered responses return the original unflattened
  response body: pass
- [x] Disabled DevTools buffered responses do not perform log-only
  `flattenOData()` work and create no DevTools log entry: pass
- [x] Enabled DevTools buffered responses still store flattened response bodies
  in logs: pass
- [x] Buffered status forwarding, `204 No Content`, buffered response hooks,
  error forwarding, stream mode, and mock response coverage remain green: pass
- [x] The implementation stayed narrow to the buffered proxy response logging
  path and `.agents` workflow state: pass

## Verification

Run or inspect:

- `git diff 130e45db357b6560cf047c70c087531df3952bc7^ 130e45db357b6560cf047c70c087531df3952bc7 -- packages/proxy/src/api/odata.ts packages/proxy/test/integration.test.ts` - pass
- `git diff 130e45db357b6560cf047c70c087531df3952bc7^ 130e45db357b6560cf047c70c087531df3952bc7 -- .agents/NEXT.md .agents/tasks/done/076-skip-buffered-response-flattening-when-devtools-disabled.md .agents/tasks/ready/076-skip-buffered-response-flattening-when-devtools-disabled.md` - pass
- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` - pass, 15 passed
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts` - pass, 24 passed and 1 skipped by the existing benchmark timing guard
- `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass, 11 test files passed, 161 tests passed, 1 skipped, plus standalone proxy example
- `pnpm.cmd run lint` - pass
- `pnpm.cmd run typecheck` - pass

## Residual Risk

- Full benchmark timing scenarios with `ODX_PROXY_BENCHMARK=1` were not run
  because the task did not require quantitative timing verification. Residual
  risk is limited to exact performance deltas, not functional behavior.
- The first sandboxed Vitest attempt could not start the local test command;
  verification was rerun outside the sandbox because Vite/esbuild needs to
  spawn subprocesses.

## Open Questions

None.

## Test Gaps

None.

## Summary

Reviewed commit `130e45db357b6560cf047c70c087531df3952bc7`. The runtime change
guards only the buffered success response log-body flattening behind
`tracer.enabled`, preserves `204` omission behavior, and leaves the returned
buffered response body unchanged. The new integration regression covers the
disabled-DevTools path with an observable `flattenOData()` call check, while
existing integration and package verification cover enabled DevTools log shape,
status handling, response hooks, error forwarding, stream mode, and mock
responses.

## Next Action

- `.agents/NEXT.md` was updated to: start a Planner chat because no ready or
  in-progress tasks remain.
- Follow-up task or fix required: none for task 076.
