# Task: Test deterministic benchmark summary math

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark timing summary math testable with deterministic fixtures
instead of relying only on full benchmark runs.

## Context

`packages/proxy/test/performance.test.ts` computes average, percentile,
round-average median, and round standard deviation values inside the benchmark
test file. These calculations should have focused deterministic coverage before
runtime performance optimization work uses the benchmark output for decisions.

Relevant files:

- `packages/proxy/test/performance.test.ts`
- `packages/proxy/test/benchmark-report.test.ts`
- a new package-local deterministic benchmark math test file if needed

## Scope

- Add failing deterministic tests first for summary math using fixed timing and
  round-average arrays.
- Cover `avgMs`, `minMs`, `maxMs`, `p50Ms`, `p95Ms`,
  `medianRoundAvgMs`, and `roundStdDevMs`.
- Prefer extracting pure helper functions only if needed for direct tests; keep
  extraction package-local under `packages/proxy/test/`.
- Preserve the existing benchmark scenario behavior and output shape.
- Keep full timing benchmarks skipped unless explicitly enabled by existing
  benchmark env/lifecycle controls.

## Non-Goals

- Do not change benchmark measurement loops, timing source, scenario labels,
  report schema, comparison tooling, production proxy runtime behavior,
  dependencies, lockfiles, or generated files.
- Do not tune percentile algorithms unless the failing deterministic tests
  prove an existing calculation bug and the expected behavior is documented in
  the task handoff.
- Do not run full performance benchmarks as required verification.

## Acceptance Criteria

- [x] Focused deterministic tests cover benchmark summary math with fixed
  fixtures.
- [x] If helper extraction is needed, the extracted functions are pure,
  package-local, and do not alter benchmark output contracts.
- [x] Existing benchmark configuration tests and report tests remain green.
- [x] Full `ODX_PROXY_BENCHMARK=1` timing runs are not required to verify this
  task.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use deterministic helper tests only; leave full benchmark scenarios skipped
  unless the existing benchmark lifecycle/env enables them.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is benchmark-tooling-only test/extraction work. Separate
review is not required unless the implementation changes production runtime
code, benchmark output schema, scenario semantics, dependencies, or CI gates.

## Handoff Notes

- changed files: `packages/proxy/test/performance.test.ts`,
  `packages/proxy/test/benchmark-summary.ts`,
  `.agents/tasks/done/070-test-deterministic-benchmark-summary-math.md`, and
  `.agents/NEXT.md`.
- summary: added deterministic summary math tests for fixed timing and
  round-average fixtures, including zero-value empty fixtures. Extracted the
  existing benchmark summary calculations into a pure package-local test helper
  and reused it from benchmark measurement code without changing benchmark
  scenarios, labels, skip behavior, or output fields.
- failing-first proof: before helper implementation,
  `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts` failed
  with `Cannot find module './benchmark-summary' imported from .../performance.test.ts`.
- tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts` - passed
    after implementation; 24 passed, 1 skipped.
  - `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts` -
    passed; 24 passed.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` - passed; 9 files passed,
    122 tests passed, 1 skipped, standalone proxy example passed.
  - `pnpm.cmd run typecheck` - passed.
  - `pnpm.cmd run lint` - passed.
- skipped checks and residual risk: no required checks were skipped. Full
  `ODX_PROXY_BENCHMARK=1` timing runs were intentionally not run per task
  scope; existing benchmark scenario remains skipped without the benchmark env
  or lifecycle.
- self-check result: scope, acceptance criteria, root docs, workflow rules,
  architecture boundaries, and security/privacy implications checked; no
  production runtime, dependency, lockfile, generated, or unrelated files were
  changed.
- review requirement decision: separate review is not required under the
  workflow and task risk notes because this is low-risk test-only/helper work
  and does not change production runtime, output schema, scenario semantics,
  dependencies, or CI gates.
- task state movement: moved from `ready/` to `in-progress/` at start, then
  from `in-progress/` to `done/` after verification and handoff updates.
- `.agents/NEXT.md` update: points to task 071,
  `.agents/tasks/ready/071-skip-devtools-trace-allocation-when-disabled.md`.
- commit hash: commit containing this handoff.
- known gaps: none.
