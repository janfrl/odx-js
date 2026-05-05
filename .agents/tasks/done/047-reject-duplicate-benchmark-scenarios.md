# Task: Reject duplicate benchmark scenarios

Status: done
Owner: Codex
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

- [x] Duplicate baseline scenario labels produce a role-specific error.
- [x] Duplicate candidate scenario labels produce a role-specific error.
- [x] Existing benchmark comparison tests remain green.
- [x] Existing benchmark report formatting tests remain green.
- [x] No production proxy code changes are included.

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

- changed files:
  - `scripts/compare-proxy-benchmarks.ts`
  - `packages/proxy/test/benchmark-compare.test.ts`
  - `.agents/tasks/done/047-reject-duplicate-benchmark-scenarios.md`
  - `.agents/NEXT.md`
- summary:
  - Added focused duplicate-label tests for baseline and candidate benchmark
    reports.
  - Confirmed those tests failed before implementation because duplicate
    labels were silently overwritten by the comparison map.
  - Added minimal `scenarioMap` validation that rejects a duplicate scenario
    label with a role-specific error before inserting it into the map.
  - Preserved valid comparison output, missing-scenario reporting, old-report
    compatibility, metadata display, and timing-basis behavior.
- tests run:
  - FAIL before fix: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/benchmark-report.test.ts`
    (2 expected duplicate-label failures; 11 tests passed).
  - PASS after fix: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/benchmark-report.test.ts`
    (2 files passed, 13 tests passed).
  - PASS: `pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-a.json reports/proxy-benchmark-b.json`.
  - PASS: `pnpm.cmd run lint`.
  - PASS: `pnpm.cmd run typecheck`.
- skipped checks and residual risk:
  - No requested checks were skipped. The manual CLI comparison used existing
    ignored local reports under `reports/`.
- self-check result:
  - Scope stayed in benchmark comparison helper validation and focused tests.
    No production proxy code, benchmark scenario definitions, dependencies,
    CI gates, thresholds, lockfiles, or committed benchmark JSON reports
    changed.
- review requirement decision:
  - Separate review is not required because this is low-risk local benchmark
    tooling validation with focused tests and no production proxy code changes.
- task state movement:
  - Moved this task from `.agents/tasks/ready/` to `.agents/tasks/in-progress/`
    when starting, then to `.agents/tasks/done/` after implementation and
    verification.
- `.agents/NEXT.md` update:
  - Updated to point at task 048 because task 046 has concurrent Explorer
    changes in the worktree and this implementation was instructed to avoid
    task 046.
- commit hash:
  - pending commit; report final hash in the chat summary.
- known gaps:
  - None for the scoped duplicate-label validation.
