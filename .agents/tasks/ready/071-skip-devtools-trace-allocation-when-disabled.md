# Task: Skip DevTools trace allocation when disabled

Status: ready
Owner: unassigned
Created: 2026-05-05
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

- [ ] A focused test fails before implementation showing disabled DevTools
  requests retain trace entries or allocate a non-empty trace.
- [ ] Disabled DevTools requests no longer accumulate trace entries.
- [ ] Enabled DevTools requests still store proxy trace entries in DevTools logs.
- [ ] Existing proxy rule, integration, and package verification checks remain
  green.
- [ ] Handoff notes explicitly request independent review before the workflow
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
