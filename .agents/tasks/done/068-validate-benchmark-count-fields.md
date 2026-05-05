# Task: Validate benchmark count fields

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark report formatting and JSON output reject malformed count
fields before reporting benchmark results.

## Context

Tasks 054, 060, and 064 tightened benchmark env parsing and displayed timing
validation. Count-like fields still need deterministic validation at the report
layer so malformed summaries cannot silently display invalid `iterations`,
`rounds`, or `concurrency` values.

Relevant files:

- `packages/proxy/test/benchmark-report.ts`
- `packages/proxy/test/benchmark-report.test.ts`
- `.agents/tasks/done/064-reject-malformed-benchmark-report-timing-fields.md`

## Scope

- Add failing tests first for invalid count fields passed to
  `formatBenchmarkReport()` and/or `createBenchmarkOutput()`.
- Reject missing, zero, negative, fractional, and non-finite count values for
  `iterations`, `rounds`, and `concurrency`.
- Include scenario-specific error messages naming the scenario label and
  malformed field.
- Preserve valid report formatting, JSON output shape, timing validation, and
  overhead reporting.
- Keep validation deterministic; do not run full timing benchmarks.

## Non-Goals

- Do not change benchmark env parsing, timing measurement loops, scenario
  definitions, report schema, comparison tooling, production proxy runtime
  behavior, package scripts, dependencies, lockfiles, or generated files.
- Do not add performance budgets or CI gates.

## Acceptance Criteria

- [x] A focused test fails before implementation for at least one malformed
  count field.
- [x] `formatBenchmarkReport()` and `createBenchmarkOutput()` reject invalid
  `iterations`, `rounds`, and `concurrency` values with scenario-specific
  errors.
- [x] Valid benchmark report fixtures still format and serialize as before.
- [x] No production runtime behavior or benchmark schema changes are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use deterministic report fixtures; do not require `ODX_PROXY_BENCHMARK=1`.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is benchmark-tooling-only validation with deterministic
tests. Separate review is not required unless the implementation changes
production proxy code, benchmark timing semantics, report schema, dependencies,
or CI behavior.

## Handoff Notes

- changed files
  - `packages/proxy/test/benchmark-report.ts`
  - `packages/proxy/test/benchmark-report.test.ts`
  - `.agents/tasks/done/068-validate-benchmark-count-fields.md`
  - `.agents/NEXT.md`
- summary
  - Added deterministic malformed count tests for `formatBenchmarkReport()` and
    `createBenchmarkOutput()`.
  - Added shared report/output validation that rejects missing, zero, negative,
    fractional, and non-finite `iterations`, `rounds`, and `concurrency`
    values with scenario-specific `TypeError` messages.
  - Preserved valid report formatting, JSON output shape, timing validation,
    and overhead reporting.
- tests run
  - FAIL before fix: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts`; 14 new malformed count cases failed because no error was thrown.
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts`
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - PASS: `pnpm.cmd run typecheck`
  - PASS: `pnpm.cmd run lint`
  - PASS: `git diff --check`
- skipped checks and residual risk
  - No required checks were skipped.
  - Did not run full `ODX_PROXY_BENCHMARK=1` timing benchmarks because the task
    targets deterministic report/output validation.
- self-check result
  - Scope stayed limited to proxy benchmark report test tooling and workflow
    state. No production proxy runtime behavior, benchmark timing semantics,
    env parsing, package scripts, dependencies, lockfiles, generated files,
    report schema, comparison tooling, or scenario definitions changed.
- review requirement decision
  - Separate review is not required because this remains low-risk benchmark
    tooling validation and does not change runtime behavior, timing semantics,
    dependencies, CI behavior, or report schema.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start
    and to `.agents/tasks/done/` after verification. Direct filesystem moves
    were blocked, so task state was moved with `apply_patch`.
- `.agents/NEXT.md` update
  - Updated to point at `.agents/tasks/ready/069-warn-on-benchmark-comparison-metadata-mismatches.md`.
- commit hash
  - Commit containing this handoff.
- known gaps
  - None.
