# Task: Validate benchmark comparison timing fields

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark comparison fail clearly when reports contain malformed
timing fields used for comparison.

## Context

Recent benchmark-tooling tasks made comparison output stricter for missing and
duplicate scenarios. The comparison helper currently prefers
`medianRoundAvgMs` when available and falls back to `avgMs`. The next narrow
quality step is to pin behavior for malformed optional timing fields so bad
benchmark JSON cannot silently produce misleading comparisons.

Relevant docs and files:

- `.agents/tasks/done/039-report-missing-benchmark-scenarios.md`
- `.agents/tasks/done/043-test-proxy-benchmark-report-formatting.md`
- `.agents/tasks/done/047-reject-duplicate-benchmark-scenarios.md`
- `scripts/compare-proxy-benchmarks.ts`
- `packages/proxy/test/benchmark-compare.test.ts`
- `packages/proxy/test/benchmark-report.test.ts`

## Scope

- Add focused tests for malformed `medianRoundAvgMs` values in baseline and
  candidate reports.
- Update comparison validation so a present-but-non-finite
  `medianRoundAvgMs` fails with a role-specific, scenario-specific error.
- Preserve fallback to `avgMs` when `medianRoundAvgMs` is absent.
- Preserve valid comparison output, metadata display, duplicate-label
  validation, missing-scenario reporting, and old-report compatibility.

## Non-Goals

- Do not change benchmark scenario definitions, timing benchmark execution, or
  report generation semantics.
- Do not introduce thresholds, performance budgets, CI gates, dependencies, or
  committed benchmark JSON reports.
- Do not change production proxy runtime code.
- Do not change the valid report JSON shape.

## Acceptance Criteria

- [x] Present non-finite baseline `medianRoundAvgMs` values produce a clear
  validation error.
- [x] Present non-finite candidate `medianRoundAvgMs` values produce a clear
  validation error.
- [x] Reports without `medianRoundAvgMs` still compare using `avgMs`.
- [x] Existing benchmark comparison and report formatting tests remain green.
- [x] No production proxy runtime code changes are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/benchmark-report.test.ts`
- `pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-a.json reports/proxy-benchmark-b.json` if sample ignored reports already exist locally; otherwise skip with residual risk noted
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use deterministic unit tests; do not run the timing benchmark for this task.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is local benchmark tooling validation and tests only.
Separate review is not required unless production proxy code, benchmark
scenario semantics, dependencies, or CI gates change.

## Handoff Notes

- changed files
  - `scripts/compare-proxy-benchmarks.ts`
  - `packages/proxy/test/benchmark-compare.test.ts`
  - `.agents/tasks/done/052-validate-benchmark-comparison-timing-fields.md`
  - `.agents/NEXT.md`
- summary
  - Added focused tests for present non-finite baseline and candidate
    `medianRoundAvgMs` values.
  - Confirmed both tests failed before the fix because comparison silently
    ignored malformed medians and fell back to `avgMs`.
  - Added validation alongside existing scenario label, duplicate, and finite
    `avgMs` checks so malformed medians fail with role-specific,
    scenario-specific errors.
  - Preserved old-report compatibility because absent `medianRoundAvgMs` still
    falls back to `avgMs`.
- tests run
  - FAIL before fix: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts -t "non-finite median"` with both new tests failing because no error was thrown.
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/benchmark-report.test.ts`
  - PASS: `pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-a.json reports/proxy-benchmark-b.json`
  - PASS: `pnpm.cmd run lint`
  - PASS: `pnpm.cmd run typecheck`
- skipped checks and residual risk
  - Did not run the timing benchmark because this task intentionally changes
    deterministic comparison validation only.
- self-check result
  - Scope stayed limited to benchmark comparison tooling and deterministic
    tests. No production proxy runtime code, benchmark scenarios, JSON report
    shape, dependencies, lockfiles, budgets, or CI gates changed.
- review requirement decision
  - Separate review is not required because the task is low-risk local tooling
    validation and no production or public runtime contracts changed.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update
  - Updated to point at `.agents/tasks/ready/053-document-generated-metadata-cache-cleanup.md`.
- commit hash
  - The task implementation commit is the commit containing this handoff.
- known gaps
  - None.
