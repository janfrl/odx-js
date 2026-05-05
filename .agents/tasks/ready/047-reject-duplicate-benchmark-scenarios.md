# Task: Reject duplicate benchmark scenarios

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark comparison reports fail clearly when a benchmark JSON file
contains duplicate scenario labels.

## Context

Proxy benchmark comparison currently maps scenarios by label. If a report
contains duplicate labels, the later entry silently overwrites the earlier one,
which can hide malformed benchmark output and make performance comparisons
misleading.

Relevant files:

- `scripts/compare-proxy-benchmarks.ts`
- `packages/proxy/test/benchmark-compare.test.ts`
- `packages/proxy/test/benchmark-report.test.ts`
- `.agents/tasks/done/039-report-missing-benchmark-scenarios.md`
- `.agents/tasks/done/043-test-proxy-benchmark-report-formatting.md`

## Scope

- Add focused tests proving duplicate labels in the baseline or candidate
  report throw a clear error.
- Update only the benchmark comparison helper validation needed to reject
  duplicate labels.
- Preserve existing comparison output for valid reports, missing-scenario
  reporting, old-report compatibility, metadata display, and timing-basis
  behavior.

## Non-Goals

- Do not change benchmark scenario definitions or labels emitted by
  `packages/proxy/test/performance.test.ts`.
- Do not change production proxy runtime code.
- Do not add benchmark thresholds, budgets, CI gates, dependencies, or
  committed benchmark JSON reports.
- Do not change the valid report JSON shape.

## Acceptance Criteria

- [ ] Duplicate baseline scenario labels produce a role-specific error.
- [ ] Duplicate candidate scenario labels produce a role-specific error.
- [ ] Existing benchmark comparison tests remain green.
- [ ] Existing benchmark report formatting tests remain green.
- [ ] No production proxy code changes are included.

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
