# Task: Reject malformed benchmark report timing fields

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark report formatting and output reject malformed displayed
timing fields before producing human-readable or JSON output.

## Context

Tasks 054 and 060 made benchmark environment parsing strict before timing loops
run. The report formatting layer should also reject malformed timing data so
benchmark output cannot silently display `NaN`, `Infinity`, or other non-finite
timings as if they were meaningful measurements.

Relevant docs and files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/060-validate-benchmark-iteration-env.md`
- `packages/proxy/test/benchmark-report.ts`
- `packages/proxy/test/benchmark-report.test.ts`

## Scope

- Add failing tests first for malformed timing fields passed to
  `formatBenchmarkReport()` and/or `createBenchmarkOutput()`.
- Reject non-finite displayed timing fields such as `NaN`, `Infinity`, and
  `-Infinity`.
- Include scenario-specific error messages that identify the affected scenario
  and timing field.
- Preserve valid benchmark report formatting and JSON output shape.
- Keep validation in the report/output code path and deterministic tests; do
  not require running full timing benchmarks.

## Non-Goals

- Do not change benchmark scenario definitions, timing measurement semantics,
  environment parsing, comparison tooling, production proxy runtime code,
  performance budgets, package scripts, dependencies, lockfiles, or generated
  files.
- Do not add rounding or statistical changes unless required to validate
  finite displayed timing values.
- Do not run `ODX_PROXY_BENCHMARK=1` timing benchmarks as required
  verification.

## Acceptance Criteria

- [x] A focused test fails before implementation for at least one non-finite
  displayed timing field.
- [x] Formatting/output rejects `NaN`, `Infinity`, and `-Infinity` timing
  values with scenario-specific errors.
- [x] Valid benchmark report fixtures still format and serialize exactly as
  expected, except for intentional error handling tests.
- [x] No production runtime behavior or report schema changes are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use deterministic report fixtures; do not require real benchmark timing runs.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is local benchmark tooling validation with deterministic
tests. Separate review is not required unless the implementation changes report
schema, scenario semantics, production proxy runtime behavior, dependencies, or
CI gates.

## Handoff Notes

- changed files
  - `packages/proxy/test/benchmark-report.ts`
  - `packages/proxy/test/benchmark-report.test.ts`
  - `.agents/tasks/done/064-reject-malformed-benchmark-report-timing-fields.md`
  - `.agents/NEXT.md`
- summary
  - Added deterministic malformed timing tests for both
    `formatBenchmarkReport()` and `createBenchmarkOutput()`.
  - Added shared report/output validation that rejects non-finite displayed
    timing fields with scenario-specific `TypeError` messages naming the
    scenario label and field.
  - Preserved valid report formatting and JSON output shape.
- tests run
  - FAIL before fix: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts`; 6 new malformed timing cases failed because no error was thrown.
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts`
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - PASS: `pnpm.cmd run typecheck`
  - PASS: `pnpm.cmd run lint`
  - PASS: `git diff --check`
- skipped checks and residual risk
  - Did not run full `ODX_PROXY_BENCHMARK=1` timing benchmarks because the task
    targets deterministic report/output validation.
- self-check result
  - Scope stayed limited to proxy benchmark report test tooling and workflow
    state. No production proxy runtime behavior, benchmark measurement
    semantics, env parsing, scripts, dependencies, lockfiles, generated files,
    report schema, or scenario definitions changed.
- review requirement decision
  - Separate review is not required because this remains low-risk local
    benchmark tooling validation and does not change runtime behavior or report
    schema.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start
    and to `.agents/tasks/done/` after verification.
- `.agents/NEXT.md` update
  - Updated to point at `.agents/tasks/ready/065-verify-non-identifier-service-names-in-minimal-nuxt-playground.md`.
- commit hash
  - Commit containing this handoff.
- known gaps
  - None.
