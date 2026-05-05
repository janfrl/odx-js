# Review: Skip DevTools trace allocation when disabled

Status: complete
Date: 2026-05-05
Reviewer: independent Reviewer worker
Task: `.agents/tasks/done/071-skip-devtools-trace-allocation-when-disabled.md`
Reviewed commit: uncommitted working tree
Decision: approved

## Findings

1. [P2] Disabled tracers share a mutable public trace array.
   `packages/proxy/src/utils/trace.ts` assigns the same `DISABLED_TRACE` array
   to every disabled `DevToolsTracer`, but `trace` remains a public mutable
   array property. Any consumer with a disabled tracer instance can mutate
   `tracer.trace`, contaminating all disabled tracers and making future
   disabled requests observe retained entries. Use a per-instance empty array,
   or make the disabled trace truly immutable with a type/runtime contract that
   cannot be mutated.

   Integrator update: addressed by giving every `DevToolsTracer` instance its
   own empty trace array and adding focused coverage that mutating one disabled
   tracer's public `trace` array does not affect another disabled tracer.

2. [P2] Nitro runtime still allocates disabled trace entries before
   `DevToolsTracer`.
   `packages/proxy/src/plugins/btp-auth.ts` still creates `trace: any[] = []`
   and pushes trace objects during target resolution regardless of
   `config.devtools.enabled` or production mode. The implementation tests use
   the standalone `createODataHandler` path, so they do not cover this plugin
   path. Normal Nuxt/Nitro proxy requests can still allocate and accumulate
   trace entries while DevTools logging is disabled, which misses the task
   objective beyond the isolated `DevToolsTracer` class.

   Integrator update: addressed by gating the plugin trace initialization and
   `addTrace()` path on the same DevTools enabled and non-production condition,
   with focused coverage for disabled DevTools and production plugin
   target-resolution paths.

## Acceptance Criteria

- [x] A focused test fails before implementation showing disabled DevTools
  requests retain trace entries or allocate a non-empty trace.
- [x] Disabled DevTools requests no longer accumulate trace entries after the
  integration fix.
- [x] Enabled DevTools requests still store proxy trace entries in DevTools
  logs.
- [x] Existing focused proxy rule and integration checks remain green.
- [x] Handoff notes explicitly request independent review before the workflow
  continues past this runtime optimization.

## Verification

- `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts` - pass, 15
  tests.
- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` - pass, 14
  tests.

Integrator verification:

- `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts` - pass, 18
  tests.
- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` - pass, 14
  tests.
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts` - pass, 24
  tests and 1 skipped benchmark timing guard.
- `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass, 9 proxy test files,
  127 tests, 1 skipped benchmark timing guard, plus standalone proxy example.
- `pnpm.cmd run lint` - pass.
- `pnpm.cmd run typecheck` - pass.
- `git diff --check` - pass.

Focused re-review:

- Findings: none blocking.
- Fix 1 accepted: disabled `DevToolsTracer` instances now use per-instance
  trace arrays, and the focused test proves cross-instance mutation isolation.
- Fix 2 accepted: the Nitro `btp-auth` plugin now gates trace entry creation on
  DevTools enabled and non-production mode, with disabled and production tests.
- Enabled DevTools trace logging and callable `proxyTrace` compatibility were
  accepted by focused re-review.
- `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts` - pass, 18
  tests.
- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` - pass, 14
  tests.

## Residual Risk

- Original reviewer did not rerun performance tests, full proxy verify, lint,
  or typecheck. Integrator ran those checks after applying the focused fixes,
  and focused re-review accepted those broader verification notes.

## Open Questions

- None.

## Test Gaps

- None identified after focused re-review.

## Summary

The integration fix addresses the two blocking findings and focused re-review
approved the result.

## Next Action

- `.agents/NEXT.md` should be updated to the next workflow action.
- Follow-up task or fix required: none for task 071.
