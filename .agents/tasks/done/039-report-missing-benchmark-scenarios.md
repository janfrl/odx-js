# Task: Report missing benchmark scenarios

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark comparisons explicitly report scenarios that exist in only
one input report.

## Context

Proxy benchmark reports now include metadata, round medians, standard
deviation, and relative overhead fields. The compare helper should also make it
obvious when two reports do not contain the same scenario set, otherwise a
local comparison can look cleaner than it is.

Relevant files:

- `scripts/compare-proxy-benchmarks.ts`
- `packages/proxy/test/benchmark-compare.test.ts`
- `packages/proxy/README.md`
- `.agents/tasks/done/025-add-proxy-benchmark-compare-helper.md`
- `.agents/tasks/done/034-add-proxy-benchmark-report-metadata.md`

## Scope

- Add focused compare-helper tests for:
  - a baseline-only scenario
  - a candidate-only scenario
  - normal matching scenarios still producing timing deltas
- Update the compare helper output to include concise missing-scenario lines.
- Keep old benchmark report compatibility.
- Update `packages/proxy/README.md` only if command output examples or wording
  become inaccurate.

## Non-Goals

- Do not add performance budgets, thresholds, or pass/fail gates.
- Do not change benchmark scenario definitions or defaults.
- Do not optimize production proxy code.
- Do not require benchmark JSON reports to be committed.
- Do not add dependencies.

## Acceptance Criteria

- [x] Compare-helper tests cover baseline-only and candidate-only scenarios.
- [x] Compare output names scenarios missing from either report.
- [x] Matching scenarios still show timing deltas as before.
- [x] Reports without metadata remain accepted.
- [x] No production proxy code changes are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts`
- `pnpm.cmd run bench:proxy:compare -- <two local fixture reports if created>`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Prefer inline temporary reports in tests. If manual reports are generated,
  place them under gitignored `reports/`.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is local benchmark tooling and tests only. Separate
review is not required unless production proxy code, CI gating, dependencies,
or benchmark scenario semantics change.

## Handoff Notes

- changed files:
  - `scripts/compare-proxy-benchmarks.ts`
  - `packages/proxy/test/benchmark-compare.test.ts`
  - `.agents/tasks/done/039-report-missing-benchmark-scenarios.md`
- summary:
  - Replaced the old strict scenario-set rejection expectation with focused
    tests for baseline-only and candidate-only scenarios.
  - Confirmed those tests failed before implementation because the helper
    threw on scenario mismatches.
  - Updated the comparison formatter to compare matching scenario labels and
    append concise `missing from candidate` / `missing from baseline` lines for
    unmatched scenarios.
  - Kept malformed report validation, finite timing validation, metadata
    output, old report compatibility, and matching timing deltas intact.
- tests run:
  - FAIL before fix: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts`
    (2 expected missing-scenario failures).
  - PASS after fix: `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts`
    (7 tests passed).
  - PASS: `pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-a.json reports/proxy-benchmark-b.json`.
  - PASS: `pnpm.cmd run lint`.
  - PASS: `pnpm.cmd run typecheck`.
- skipped checks and residual risk:
  - No listed checks were skipped.
- self-check result:
  - Scope stayed in benchmark comparison tooling and tests. No production
    proxy code, benchmark scenario definitions, dependencies, CI gates,
    thresholds, or committed benchmark JSON reports changed.
- review requirement decision:
  - Separate review is not required because this is low-risk local benchmark
    tooling with focused test coverage and no production proxy code changes.
- task state movement:
  - Moved this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Left unchanged because task 040 is already in progress with a delegated
    worker.
- commit hash:
  - pending commit.
- known gaps:
  - The manual CLI run used existing ignored local reports whose scenario sets
    matched; missing-scenario output is covered by inline unit tests.
