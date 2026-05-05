# Task: Add proxy benchmark overhead ratios

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark output show relative overhead percentages alongside
absolute average overhead so local performance comparisons are easier to read.

## Context

Tasks 021 and 025 made proxy benchmark reports record absolute average overhead
and compare two JSON reports. The current benchmark output still requires
mental math to understand relative overhead. Adding percentage fields to the
benchmark report is a local tooling improvement and should avoid budgets or
runtime optimization work.

Relevant files:

- `packages/proxy/test/performance.test.ts`
- `scripts/compare-proxy-benchmarks.ts`
- `packages/proxy/README.md`
- `.agents/tasks/done/021-record-proxy-benchmark-baseline-output.md`
- `.agents/tasks/done/025-add-proxy-benchmark-compare-helper.md`

## Scope

- Extend benchmark summary data with optional average overhead percentage for
  scenarios that already have an absolute overhead baseline.
- Print the percentage in the console benchmark table.
- Include the percentage in optional JSON benchmark output.
- Update the compare helper only if needed to preserve compatibility with
  reports that do not yet include the new field.
- Document the field briefly in `packages/proxy/README.md` if the benchmark
  output explanation needs it.

## Non-Goals

- Do not add performance budgets or fail thresholds.
- Do not change benchmark scenario definitions, iteration defaults, or normal
  skipped-test behavior.
- Do not optimize production proxy code.
- Do not require generated benchmark reports to be committed.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Proxy benchmark console output includes relative overhead percentages
  where a direct or baseline comparison exists.
- [ ] Optional JSON benchmark output includes the new percentage field for the
  same scenarios.
- [ ] Reports without percentage fields remain accepted by
  `bench:proxy:compare`.
- [ ] Existing absolute overhead values remain present.
- [ ] Benchmark behavior remains opt-in outside `bench:proxy`.

## Verification

Task-local checks:

- `$env:ODX_PROXY_BENCHMARK_OUTPUT='reports/proxy-benchmark-ratio.json'; pnpm.cmd run bench:proxy; Remove-Item Env:ODX_PROXY_BENCHMARK_OUTPUT`
- `pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-ratio.json reports/proxy-benchmark-ratio.json`
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
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
Separate review is not required unless production proxy code, benchmark
semantics, or dependencies change.

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
