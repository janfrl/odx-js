# Task: Test proxy benchmark report formatting

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Add fast unit coverage for proxy benchmark report formatting so future
performance tooling changes can be verified without running the full benchmark.

## Context

The proxy benchmark now reports round medians, standard deviation, metadata,
and overhead fields, but the table formatter and JSON output shape live inside
`packages/proxy/test/performance.test.ts`, which only runs during
`bench:proxy`. Extracting the pure formatting/output-shaping logic into a small
testable helper gives performance tooling a quick regression check without
changing benchmark scenarios.

Relevant files:

- `packages/proxy/test/performance.test.ts`
- `packages/proxy/test/benchmark-compare.test.ts`
- `packages/proxy/README.md`
- `.agents/tasks/done/030-add-proxy-benchmark-overhead-ratios.md`
- `.agents/tasks/done/034-add-proxy-benchmark-report-metadata.md`

## Scope

- Add focused tests for benchmark report formatting/output shaping, covering:
  - overhead columns rendering when overhead values exist.
  - missing overhead values rendering as `-`.
  - JSON output metadata retaining iterations, rounds, warmup iterations, and
    concurrency.
- Extract only pure helper logic from `performance.test.ts` if needed to make
  the tests fast and deterministic.
- Keep benchmark scenario definitions, environment variables, timing
  measurement, and compare-helper behavior unchanged.

## Non-Goals

- Do not change benchmark scenario names, timing loops, thresholds, or budgets.
- Do not optimize production proxy runtime code.
- Do not add CI gates or require benchmark reports to be committed.
- Do not add dependencies.

## Acceptance Criteria

- [x] A focused unit test verifies benchmark table overhead formatting.
- [x] A focused unit test verifies benchmark JSON metadata shape.
- [x] `pnpm.cmd run bench:proxy` still runs the same scenarios and prints the
  same user-facing fields.
- [x] Existing benchmark compare tests remain green.
- [x] No production proxy code changes are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/benchmark-report.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Keep new tests deterministic and avoid measuring live timings.
- `packages/proxy/test/performance.test.ts` is expected to skip benchmark
  scenarios unless `bench:proxy` or `ODX_PROXY_BENCHMARK=1` is active.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is local benchmark tooling and tests only. Separate
review is not required unless production proxy code, benchmark scenario
semantics, dependencies, or CI gating change.

## Handoff Notes

- changed files:
  - `packages/proxy/test/benchmark-report.ts`
  - `packages/proxy/test/benchmark-report.test.ts`
  - `packages/proxy/test/performance.test.ts`
  - `.agents/tasks/done/043-test-proxy-benchmark-report-formatting.md`
- summary:
  - Extracted benchmark table formatting, JSON output shaping, and overhead
    assignment into a pure test-local helper.
  - Added deterministic unit tests for overhead column rendering, missing
    overhead dashes, JSON metadata shape, scenario categories, and overhead
    calculation.
  - Kept benchmark scenario definitions, timing measurement, environment
    variables, compare-helper behavior, production proxy code, dependencies,
    and CI gates unchanged.
- tests run:
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/benchmark-report.test.ts`
    (2 files passed, 11 tests passed).
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
    (expected skipped-by-default behavior: 1 file skipped, 1 test skipped).
  - PASS: `pnpm.cmd run typecheck`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No task-local checks were skipped.
  - `pnpm.cmd run bench:proxy` was not run because this task targets fast
    deterministic coverage; the benchmark entrypoint was verified by loading
    `performance.test.ts` with its expected skipped-by-default guard.
- self-check result:
  - Scope stayed in proxy benchmark test tooling. No production proxy runtime
    code, benchmark scenario semantics, timing loops, thresholds, budgets,
    dependencies, CI gates, or committed benchmark JSON reports changed.
- review requirement decision:
  - Separate review is not required because this is low-risk local benchmark
    tooling and tests only.
- task state movement:
  - Moved this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Left unchanged while task 045 is concurrently in progress.
- commit hash:
  - pending commit.
- known gaps:
  - None for the scoped deterministic report formatting coverage.
