# Task: Reject duplicate benchmark output scenarios

Status: ready
Owner: unassigned
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

- [ ] A focused test fails before implementation for duplicate labels in report
  creation.
- [ ] `formatBenchmarkReport()` and `createBenchmarkOutput()` reject duplicate
  scenario labels with a specific error.
- [ ] Existing valid benchmark report fixtures still format and serialize as
  before.
- [ ] No production runtime behavior or valid report schema changes are
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
