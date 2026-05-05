# Task: Add proxy benchmark report metadata

Status: done
Owner: Codex orchestrator
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Include lightweight run metadata in optional proxy benchmark JSON reports and
make the comparison helper display that context without adding performance
budgets.

## Context

Benchmark reports now include absolute and relative overhead fields, and the
comparison helper can compare scenario timings. Local comparisons are still
harder to interpret when reports do not say which Node version, iteration
count, concurrency, or timestamp produced them.

Relevant files:

- `packages/proxy/test/performance.test.ts`
- `scripts/compare-proxy-benchmarks.ts`
- `packages/proxy/test/benchmark-compare.test.ts`
- `packages/proxy/README.md`
- `.agents/tasks/done/025-add-proxy-benchmark-compare-helper.md`
- `.agents/tasks/done/030-add-proxy-benchmark-overhead-ratios.md`

## Scope

- Add a small metadata object to optional benchmark JSON output with fields
  such as schema/version, timestamp, Node version, iterations, and concurrency
  values already used by the benchmark.
- Update the compare helper to accept reports with or without metadata.
- Print concise metadata context in compare output when present.
- Add or update focused compare-helper tests for old reports without metadata
  and new reports with metadata.
- Update `packages/proxy/README.md` to mention the metadata fields if helpful.

## Non-Goals

- Do not add performance budgets, thresholds, or pass/fail gates.
- Do not change benchmark scenario definitions or iteration defaults.
- Do not optimize production proxy code.
- Do not require generated benchmark reports to be committed.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Optional benchmark JSON output includes run metadata.
- [ ] `bench:proxy:compare` remains compatible with older reports that lack
  metadata.
- [ ] Compare output shows metadata context when both reports include it.
- [ ] Focused tests cover metadata and backward compatibility.
- [ ] Benchmark behavior remains opt-in outside `bench:proxy`.

## Verification

Task-local checks:

- `$env:ODX_PROXY_BENCHMARK_OUTPUT='reports/proxy-benchmark-metadata.json'; pnpm.cmd run bench:proxy; Remove-Item Env:ODX_PROXY_BENCHMARK_OUTPUT`
- `pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-metadata.json reports/proxy-benchmark-metadata.json`
- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/performance.test.ts`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use local generated reports under gitignored `reports/`.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is local benchmark tooling and documentation only.
Separate review is not required unless production proxy code, scenario
semantics, dependency wiring, or CI pass/fail behavior changes.

## Handoff Notes

- changed files:
  - `packages/proxy/test/performance.test.ts`
  - `scripts/compare-proxy-benchmarks.ts`
  - `packages/proxy/test/benchmark-compare.test.ts`
  - `packages/proxy/README.md`
- summary:
  - Added multi-round benchmark measurement with `rounds`,
    `medianRoundAvgMs`, and `roundStdDevMs` so local benchmark noise is visible.
  - Added an adjacent `small seq devtools baseline` scenario so DevTools
    overhead is compared against a nearby non-DevTools buffer run instead of a
    stale earlier sample.
  - Included benchmark metadata in JSON reports and made the compare helper
    print concise metadata context.
  - Compare output now uses median round average when available, while keeping
    older reports without metadata or median fields compatible.
  - Updated focused compare-helper tests and proxy benchmark documentation.
- tests run:
  - `$env:ODX_PROXY_BENCHMARK_OUTPUT='reports/proxy-benchmark-metadata.json'; pnpm.cmd run bench:proxy; Remove-Item Env:ODX_PROXY_BENCHMARK_OUTPUT`
    - passed and wrote gitignored metadata/round report.
  - `pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-metadata.json reports/proxy-benchmark-metadata.json`
    - passed and printed metadata plus median-round timing basis.
  - `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/performance.test.ts`
    - passed, with the performance test skipped by default outside
    `bench:proxy`.
  - `pnpm.cmd run lint` - passed.
  - `pnpm.cmd run typecheck` - passed.
- skipped checks and residual risk:
  - none.
- self-check result:
  - Scope stayed limited to local benchmark tooling, tests, and proxy README
    documentation. No production proxy code, scenario defaults beyond adding
    repeated rounds, dependencies, performance budgets, or CI gates changed.
- review requirement decision:
  - Separate review is not required because this is local benchmark tooling and
    documentation only.
- task state movement:
  - Move this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - No change; it already points to the lowest-numbered remaining ready task
    `.agents/tasks/ready/032-validate-btp-destination-url.md`.
- commit hash:
  - pending commit.
- known gaps:
  - Local loopback benchmarks remain directional rather than production-grade;
    the new round median and standard deviation make that noise visible.
