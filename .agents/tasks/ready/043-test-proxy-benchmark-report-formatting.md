# Task: Test proxy benchmark report formatting

Status: ready
Owner: unassigned
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

- [ ] A focused unit test verifies benchmark table overhead formatting.
- [ ] A focused unit test verifies benchmark JSON metadata shape.
- [ ] `pnpm.cmd run bench:proxy` still runs the same scenarios and prints the
  same user-facing fields.
- [ ] Existing benchmark compare tests remain green.
- [ ] No production proxy code changes are included.

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
