# Task: Skip DevTools trace allocation when disabled

Status: done
Owner: Implementer
Created: 2026-05-05
Completed: 2026-05-05
Risk: medium
Review: required

## Objective

Avoid accumulating DevTools trace entries when DevTools logging is disabled,
without changing visible proxy behavior.

## Context

`DevToolsTracer` always exposes `event.context.proxyTrace` and `addTrace()`
always pushes entries into `trace`, even when `config.devtools.enabled` is
false or the process is production. This can allocate trace objects on normal
runtime proxy requests where no DevTools log will be stored. Benchmark tooling
has been tightened enough to make this a small, reviewed runtime optimization
candidate.

Relevant files:

- `packages/proxy/src/utils/trace.ts`
- `packages/proxy/src/api/odata.ts`
- `packages/proxy/test/rules.test.ts`
- `packages/proxy/test/integration.test.ts`
- `packages/proxy/test/performance.test.ts`

## Scope

- Add failing tests first that prove disabled DevTools requests do not retain
  trace entries while enabled DevTools requests still record traces in logs.
- Optimize `DevToolsTracer` so disabled DevTools logging does not accumulate
  trace entry objects.
- Preserve enabled DevTools trace content, pending/final log updates, stream
  finish behavior, request/response status logging, and rule trace behavior
  when DevTools is enabled.
- Preserve the callable `event.context.proxyTrace` contract enough that
  existing rule code remains safe when DevTools is disabled.
- Keep the optimization narrow; prefer a no-op disabled trace path over broader
  proxy redesign.

## Non-Goals

- Do not change buffered versus streamed proxy mode selection, response body
  flattening, log payload shape when DevTools is enabled, Explorer UI, benchmark
  scenario definitions, public hooks, dependencies, lockfiles, or generated
  files.
- Do not implement the alternative buffered-response flattening optimization in
  this task.
- Do not broaden into shared tracing abstractions or API documentation changes
  unless a contract conflict is discovered and recorded as a blocker.

## Acceptance Criteria

- [x] A focused test fails before implementation showing disabled DevTools
  requests retain trace entries or allocate a non-empty trace.
- [x] Disabled DevTools requests no longer accumulate trace entries.
- [x] Enabled DevTools requests still store proxy trace entries in DevTools logs.
- [x] Existing proxy rule, integration, and package verification checks remain
  green.
- [x] Handoff notes explicitly request independent review before the workflow
  continues past this runtime optimization.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts`
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

Medium risk because this touches production proxy runtime tracing behavior.
Separate review is required even if the diff is small, because disabled tracing
must remain compatible with rule hooks and enabled DevTools logging must not
regress.

## Handoff Notes

- changed files: `.agents/NEXT.md`, `.agents/tasks/done/071-skip-devtools-trace-allocation-when-disabled.md`, `.agents/tasks/in-progress/071-skip-devtools-trace-allocation-when-disabled.md`, `.agents/tasks/ready/071-skip-devtools-trace-allocation-when-disabled.md`, `packages/proxy/src/utils/trace.ts`, `packages/proxy/test/integration.test.ts`, `packages/proxy/test/rules.test.ts`
- summary: Added disabled tracing coverage that keeps `event.context.proxyTrace` callable while asserting disabled tracers retain no entries, added enabled DevTools log trace coverage, and changed `DevToolsTracer.addTrace()` to no-op when logging is disabled while enabled tracers keep their normal per-request trace array.
- failing-first proof: Before implementation, `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts` failed with `AssertionError: expected [ ...(2) ] to deeply equal []`; the received entries were the disabled rule trace and disabled proxy trace. `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` passed, proving enabled DevTools logs already retained trace entries.
- tests run: `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts` passed, `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` passed, `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts` passed with the benchmark timing suite skipped by its env guard, `pnpm.cmd --filter @bc8-odx/proxy run verify` passed, `pnpm.cmd run lint` passed, `pnpm.cmd run typecheck` passed, `git diff --check` passed.
- skipped checks and residual risk: No required checks skipped. Full benchmark timing scenarios were not run because the task explicitly did not require `ODX_PROXY_BENCHMARK=1`; residual performance risk is limited to quantitative timing deltas, not functional behavior.
- self-check result: Scope stayed within the assigned proxy trace and test files plus workflow state. Enabled DevTools log shape, pending/final update paths, stream finish registration, status logging, rule trace behavior, dependencies, lockfiles, generated files, Explorer UI, benchmark scenarios, and unrelated files were not changed.
- review requirement decision: Separate review was required because the task is marked review-required and touches production proxy runtime tracing behavior. Initial review found two P2 issues; integration fixed both and focused re-review approved the result.
- task state movement: Moved from `ready` to `in-progress` at start, then to `done` only after verification passed. The initial PowerShell `Move-Item` and `Copy-Item` attempts were denied by filesystem permissions, so the state move was completed with patch-based add/delete operations.
- `.agents/NEXT.md` update: Updated to a Reviewer prompt for task 071.
- commit hash: commit containing this handoff.
- known gaps: None.

## Integrator Notes

- findings addressed: Replaced the shared disabled `DevToolsTracer` trace array
  with a per-instance empty array and added coverage proving a mutation to one
  disabled tracer's public `trace` array does not affect another disabled
  tracer. Gated the Nitro `btp-auth` plugin trace path so trace entries are not
  allocated or accumulated when DevTools are disabled or production mode is
  active, while enabled DevTools still receives the same plugin trace array.
- changed files: `.agents/NEXT.md`, `.agents/reviews/071-skip-devtools-trace-allocation-when-disabled-review.md`, `.agents/tasks/done/071-skip-devtools-trace-allocation-when-disabled.md`, `packages/proxy/src/plugins/btp-auth.ts`, `packages/proxy/src/utils/trace.ts`, `packages/proxy/test/rules.test.ts`.
- tests run: `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts` passed with 18 tests, `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` passed with 14 tests, `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts` passed with 24 tests and 1 skipped benchmark timing guard, `pnpm.cmd --filter @bc8-odx/proxy run verify` passed with 9 proxy test files, 127 tests, 1 skipped benchmark timing guard, and the standalone proxy example, `pnpm.cmd run lint` passed, `pnpm.cmd run typecheck` passed, `git diff --check` passed.
- skipped checks and residual risk: No required functional checks skipped. Full benchmark timing scenarios were not run because the task explicitly does not require `ODX_PROXY_BENCHMARK=1`; residual risk is limited to quantitative timing deltas.
- review requirement decision: Focused re-review was required because the original independent review had blocking findings and this integration fix changes runtime trace behavior in the Nitro plugin path. Focused re-review approved the fixes.
- commit hash: commit containing this handoff.
- known gaps: None.
