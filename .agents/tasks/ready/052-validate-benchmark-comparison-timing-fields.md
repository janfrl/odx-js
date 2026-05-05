# Task: Validate benchmark comparison timing fields

Status: ready
Owner: unassigned
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

- [ ] Present non-finite baseline `medianRoundAvgMs` values produce a clear
  validation error.
- [ ] Present non-finite candidate `medianRoundAvgMs` values produce a clear
  validation error.
- [ ] Reports without `medianRoundAvgMs` still compare using `avgMs`.
- [ ] Existing benchmark comparison and report formatting tests remain green.
- [ ] No production proxy runtime code changes are included.

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
