# Task: Test deterministic benchmark summary math

Status: ready
Owner: unassigned
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

- [ ] Focused deterministic tests cover benchmark summary math with fixed
  fixtures.
- [ ] If helper extraction is needed, the extracted functions are pure,
  package-local, and do not alter benchmark output contracts.
- [ ] Existing benchmark configuration tests and report tests remain green.
- [ ] Full `ODX_PROXY_BENCHMARK=1` timing runs are not required to verify this
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
