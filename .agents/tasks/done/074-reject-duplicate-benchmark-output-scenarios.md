# Task: Reject duplicate benchmark output scenarios

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make benchmark report creation reject duplicate scenario labels before writing
human-readable or JSON benchmark output.

## Context

Task 047 made the comparison helper reject duplicate labels when comparing two
existing reports. Tasks 064, 068, and 070 tightened report creation validation
for malformed timing/count fields and deterministic summary math. Report
creation should also reject duplicate scenario labels so malformed output is
not produced in the first place.

Relevant files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/047-reject-duplicate-benchmark-scenarios.md`
- `.agents/tasks/done/064-reject-malformed-benchmark-report-timing-fields.md`
- `.agents/tasks/done/068-validate-benchmark-count-fields.md`
- `packages/proxy/test/benchmark-report.ts`
- `packages/proxy/test/benchmark-report.test.ts`

## Scope

- Add failing tests first for duplicate scenario labels passed to
  `formatBenchmarkReport()` and `createBenchmarkOutput()`.
- Reject duplicate labels with an error naming the repeated scenario label.
- Preserve valid report formatting, JSON output shape, category derivation,
  timing validation, count validation, and overhead fields.
- Keep validation deterministic; do not run full timing benchmarks.

## Non-Goals

- Do not change benchmark scenario definitions, measurement loops, comparison
  tooling, report schema for valid output, production proxy runtime behavior,
  package scripts, dependencies, lockfiles, or generated files.
- Do not add performance budgets or CI gates.

## Acceptance Criteria

- [x] A focused test fails before implementation for duplicate labels in report
  creation.
- [x] `formatBenchmarkReport()` and `createBenchmarkOutput()` reject duplicate
  scenario labels with a specific error.
- [x] Existing valid benchmark report fixtures still format and serialize as
  before.
- [x] No production runtime behavior or valid report schema changes are
  included.

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
production proxy behavior, benchmark scenario semantics, valid report schema,
dependencies, or CI behavior.

## Handoff Notes

- changed files
  - `packages/proxy/test/benchmark-report.ts`
  - `packages/proxy/test/benchmark-report.test.ts`
  - `.agents/tasks/done/074-reject-duplicate-benchmark-output-scenarios.md`
  - `.agents/NEXT.md`
- summary
  - Added deterministic duplicate-label tests for `formatBenchmarkReport()`
    and `createBenchmarkOutput()`.
  - Confirmed those tests failed before implementation because duplicate
    labels did not throw.
  - Added shared benchmark-summary validation that rejects the first repeated
    scenario label with `Duplicate benchmark scenario label: "<label>"`.
  - Preserved valid report formatting, JSON output shape, category derivation,
    timing validation, count validation, and overhead fields.
- tests run
  - FAIL before fix: `pnpm.cmd run test -- packages/proxy/test/benchmark-report.test.ts`
    showed the two new duplicate-label assertions failing because no error was
    thrown. That script invocation also ran broader workspace tests due to the
    forwarded argument shape and surfaced an unrelated Explorer suite failure,
    so it was used only as the pre-fix red-state check.
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-report.test.ts`
    with the workspace `node_modules/.bin` prepended to PATH for this shell;
    1 file and 26 tests passed.
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify`; 11 proxy test files
    and 160 tests passed, 1 skipped, then the standalone proxy example passed.
  - PASS: `pnpm.cmd run lint`.
  - PASS: `pnpm.cmd run typecheck`.
- skipped checks and residual risk
  - No requested checks were skipped.
  - Did not run full `ODX_PROXY_BENCHMARK=1` timing benchmarks because the task
    targets deterministic report/output validation.
- self-check result
  - Scope stayed limited to benchmark report validation/tests and workflow
    state. No production proxy runtime behavior, scenario definitions,
    measurement loops, comparison tooling, package scripts, dependencies,
    lockfiles, generated files, report schema for valid output, performance
    budgets, or CI gates changed.
- review requirement decision
  - Separate review is not required because this is low-risk benchmark-tooling
    validation with deterministic tests and no production/runtime/schema
    changes.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start
    and to `.agents/tasks/done/` after implementation and verification passed.
- `.agents/NEXT.md` update
  - Updated to resume the normal workflow with the orchestrator; the
    lowest-numbered ready task is
    `.agents/tasks/ready/075-make-standalone-examples-assertion-backed.md`.
- commit hash
  - Commit containing this handoff; report final hash in the chat summary.
- known gaps
  - None for the scoped duplicate-label validation.
