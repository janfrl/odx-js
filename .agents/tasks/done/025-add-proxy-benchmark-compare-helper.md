# Task: Add proxy benchmark compare helper

Status: done
Owner: Codex orchestrator
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Add a small local helper for comparing two proxy benchmark JSON reports so
future performance work can reason about overhead changes without manual
spreadsheet work.

## Context

Task 021 added optional JSON output for `pnpm.cmd run bench:proxy`. The next
useful tooling step is a local comparison command that reads two generated
reports and summarizes scenario timing differences. This should stay
artifact-safe and must not add performance budgets or production runtime
changes.

Relevant files:

- `packages/proxy/test/performance.test.ts`
- `packages/proxy/README.md`
- `package.json`
- `.agents/tasks/done/021-record-proxy-benchmark-baseline-output.md`

## Scope

- Add a repository-local script, for example under `scripts/`, that accepts two
  proxy benchmark JSON file paths.
- Compare matching scenario labels and print a concise table or text summary
  with baseline average, candidate average, absolute delta, and percent delta.
- Handle missing files, invalid JSON, and missing scenario labels with clear
  non-zero failures.
- Add a root package script such as `bench:proxy:compare` if it keeps the
  command discoverable.
- Document a short example in `packages/proxy/README.md` or the root README.

## Non-Goals

- Do not add machine-specific performance budgets or fail thresholds.
- Do not change benchmark scenario definitions or production proxy code.
- Do not make normal test or benchmark runs create comparison artifacts.
- Do not add dependencies.

## Acceptance Criteria

- [ ] The helper compares two valid benchmark JSON reports.
- [ ] The helper reports matching scenario timing deltas clearly.
- [ ] Invalid input paths or malformed JSON fail with useful messages.
- [ ] Documentation shows how to generate two reports and compare them.
- [ ] Existing `pnpm.cmd run bench:proxy` behavior is unchanged.

## Verification

Task-local checks:

- Generate two local reports with `ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark-a.json pnpm.cmd run bench:proxy` and `ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark-b.json pnpm.cmd run bench:proxy`
- Run the new compare command against those two reports.
- Run one invalid-input scenario for the compare command.
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use local generated reports under gitignored `reports/`.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is local tooling and documentation only. Separate review
is not required unless benchmark semantics, production proxy code, or package
dependency wiring changes.

## Handoff Notes

Completed 2026-05-05 by Orchestrator.

- changed files:
  - `scripts/compare-proxy-benchmarks.ts`
  - `package.json`
  - `packages/proxy/README.md`
- summary:
  - Added `pnpm.cmd run bench:proxy:compare -- <baseline> <candidate>`.
  - The helper reads two proxy benchmark JSON reports, requires matching
    scenario labels, and prints baseline average, candidate average, absolute
    delta, and percent delta.
  - Invalid paths, malformed report shape, missing labels, and missing average
    timings fail with non-zero exit codes and clear messages.
  - Documented how to generate two gitignored reports under `reports/` and
    compare them.
- tests run:
  - PASS:
    `ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark-a.json pnpm.cmd run bench:proxy`.
  - PASS:
    `ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark-b.json pnpm.cmd run bench:proxy`.
  - PASS:
    `pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-a.json reports/proxy-benchmark-b.json`.
  - PASS expected failure:
    `pnpm.cmd run bench:proxy:compare -- reports/does-not-exist.json reports/proxy-benchmark-b.json`
    exited non-zero with a useful missing-file message.
  - PASS: `pnpm.cmd run lint`.
  - PASS: `pnpm.cmd run typecheck`.
- skipped checks and residual risk:
  - No task-local checks were skipped.
  - The generated `reports/` JSON files are intentionally gitignored and not
    committed.
- self-check result:
  - Scope stayed limited to local tooling and docs.
  - No production proxy code, benchmark scenario definitions, dependencies, or
    normal test behavior changed.
  - No budgets or thresholds were added.
- review requirement decision:
  - Separate review is not required because this is low-risk local tooling.
- task state movement:
  - Moved to `.agents/tasks/done/` by Orchestrator.
- `.agents/NEXT.md` update:
  - Updated to planner mode because no implementation tasks remain in
    `.agents/tasks/ready/`.
- commit hash:
  - Pending at handoff update time.
- known gaps:
  - None.
