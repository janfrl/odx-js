# Task: Validate benchmark concurrency env

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark configuration reject zero, negative, non-integer, and
non-numeric concurrency values before any timing loops run.

## Context

Proxy benchmark output now includes concurrency metadata and stricter report
comparison validation. The benchmark runner still parses
`ODX_PROXY_BENCHMARK_CONCURRENCY` directly with `Number.parseInt`, which can
allow invalid values such as `0`, negative numbers, partial numeric strings, or
`NaN` into loop controls. The benchmark should fail fast with a clear message
instead of hanging or producing misleading timing output.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/034-add-proxy-benchmark-report-metadata.md`
- `.agents/tasks/done/052-validate-benchmark-comparison-timing-fields.md`
- `packages/proxy/test/performance.test.ts`
- `packages/proxy/README.md`

## Scope

- Add focused tests for benchmark concurrency env parsing that prove invalid
  values are rejected before benchmark measurement loops execute.
- Reject at least `0`, negative values, decimal values, non-numeric strings,
  empty strings, and partially parsed strings such as `5abc`.
- Preserve the existing default concurrency when the env var is absent.
- Preserve valid positive integer overrides.
- Keep changes limited to benchmark test/tooling code and narrow README wording
  only if the accepted env value rules need to be discoverable.

## Non-Goals

- Do not change benchmark scenario definitions, timing measurement semantics,
  report JSON shape, comparison tooling, production proxy runtime code,
  dependencies, lockfiles, CI gates, or performance budgets.
- Do not run the full timing benchmark as part of proving invalid env parsing
  unless the implementer chooses to run it as an optional smoke check.
- Do not introduce broad configuration abstractions unrelated to benchmark env
  parsing.

## Acceptance Criteria

- [x] A focused test fails before implementation for invalid concurrency env
  values that currently reach loop controls.
- [x] Invalid concurrency values fail with a clear error that names
  `ODX_PROXY_BENCHMARK_CONCURRENCY`.
- [x] Absent concurrency env keeps the existing default.
- [x] Valid positive integer concurrency env values still work.
- [x] No production proxy runtime behavior or benchmark report schema changes
  are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use deterministic benchmark configuration tests; do not require running the
  timing benchmark with `ODX_PROXY_BENCHMARK=1`.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is local benchmark tooling validation and tests only.
Separate review is not required unless production proxy code, benchmark
scenario semantics, dependencies, report JSON shape, CI gates, or performance
budgets change.

## Handoff Notes

- changed files
  - `packages/proxy/test/performance.test.ts`
  - `packages/proxy/README.md`
  - `.agents/tasks/done/054-validate-benchmark-concurrency-env.md`
  - `.agents/NEXT.md`
- summary
  - Added deterministic benchmark configuration tests outside the skipped
    timing benchmark suite.
  - Confirmed invalid values failed before the fix because no error was thrown.
  - Added strict positive-integer parsing for
    `ODX_PROXY_BENCHMARK_CONCURRENCY` while preserving default `5` and valid
    integer overrides.
  - Documented the concurrency env value as a positive integer in the proxy
    README.
- tests run
  - FAIL before fix: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts -t "benchmark concurrency"`; invalid-value cases did not throw.
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - PASS: `pnpm.cmd run lint`
  - PASS: `pnpm.cmd run typecheck`
- skipped checks and residual risk
  - Did not run the full timing benchmark with `ODX_PROXY_BENCHMARK=1`
    because the task targets deterministic env parsing before timing loops.
- self-check result
  - Scope stayed limited to benchmark test/tooling code, narrow README wording,
    task handoff, and workflow state. No production proxy runtime behavior,
    scenario definitions, timing measurement semantics, report JSON shape,
    comparison tooling, dependencies, lockfiles, CI gates, or budgets changed.
- review requirement decision
  - Separate review is not required because this is low-risk local benchmark
    tooling validation.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update
  - Updated to point at `.agents/tasks/ready/055-use-http-client-for-nuxt-metadata-downloads.md`.
- commit hash
  - The task implementation commit is the commit containing this handoff.
- known gaps
  - None.
