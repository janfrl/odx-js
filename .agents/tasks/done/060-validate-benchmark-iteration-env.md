# Task: Validate benchmark iteration env

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark configuration reject invalid iteration and round env
values before timing loops run.

## Context

Task 054 made `ODX_PROXY_BENCHMARK_CONCURRENCY` strict, but
`ODX_PROXY_BENCHMARK_ITERATIONS` and `ODX_PROXY_BENCHMARK_ROUNDS` still use
permissive `Number.parseInt` parsing. Invalid values can produce misleading
reports or skip measurement work. The benchmark should fail fast with clear
configuration errors before timing code executes.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/054-validate-benchmark-concurrency-env.md`
- `packages/proxy/test/performance.test.ts`
- `packages/proxy/README.md`

## Scope

- Add focused tests for invalid `ODX_PROXY_BENCHMARK_ITERATIONS` and
  `ODX_PROXY_BENCHMARK_ROUNDS` values.
- Reject zero, negative, decimal, non-numeric, empty, and partially parsed
  values such as `5abc`.
- Preserve existing defaults when the env vars are absent.
- Preserve valid positive integer overrides.
- Keep validation deterministic and outside full timing benchmark execution.
- Update the proxy README wording only if the accepted env value rules need to
  be discoverable.

## Non-Goals

- Do not change benchmark scenario definitions, timing measurement semantics,
  report JSON shape, comparison tooling, production proxy runtime code,
  dependencies, lockfiles, CI gates, or performance budgets.
- Do not run the full timing benchmark as part of proving validation unless the
  implementer chooses an optional smoke check.
- Do not revisit concurrency validation except where shared helper extraction
  makes the implementation smaller and covered by existing tests.

## Acceptance Criteria

- [x] Focused tests fail before implementation for invalid iteration and round
  env values.
- [x] Invalid values fail with clear errors naming the relevant env var.
- [x] Absent env vars keep existing defaults.
- [x] Valid positive integer overrides still work.
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

Low risk because this is local benchmark tooling validation. Separate review is
not required unless production proxy code, benchmark scenario semantics,
dependencies, report JSON shape, CI gates, or performance budgets change.

## Handoff Notes

- changed files
  - `packages/proxy/test/performance.test.ts`
  - `packages/proxy/README.md`
  - `.agents/tasks/done/060-validate-benchmark-iteration-env.md`
  - `.agents/NEXT.md`
- summary
  - Added deterministic tests for iteration and round defaults, valid
    positive-integer overrides, and invalid values.
  - Confirmed invalid values failed before the fix because `parseInt` accepted
    or partially parsed them.
  - Reused a shared positive-integer env parser for iterations, rounds, and
    concurrency.
  - Updated proxy README wording so iteration and round env values are
    discoverable as positive integers.
- tests run
  - FAIL before fix: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts -t "iteration value|round value"`; 12 invalid-value cases did not throw.
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - PASS: `pnpm.cmd run lint`
  - PASS: `pnpm.cmd run typecheck`
- skipped checks and residual risk
  - Did not run the full timing benchmark with `ODX_PROXY_BENCHMARK=1`
    because the task targets deterministic env parsing before timing loops.
- self-check result
  - Scope stayed limited to benchmark configuration tests/tooling and narrow
    README wording. No production proxy runtime code, benchmark scenario
    semantics, report JSON shape, comparison tooling, dependencies, lockfiles,
    CI gates, or performance budgets changed.
- review requirement decision
  - Separate review is not required because this is low-risk local benchmark
    tooling validation.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update
  - Updated to point at `.agents/tasks/ready/061-document-service-name-type-generation-limits.md`.
- commit hash
  - The task implementation commit is the commit containing this handoff.
- known gaps
  - None.
