# Task: Reject malformed benchmark report timing fields

Status: ready
Owner: unassigned
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

- [ ] A focused test fails before implementation for at least one non-finite
  displayed timing field.
- [ ] Formatting/output rejects `NaN`, `Infinity`, and `-Infinity` timing
  values with scenario-specific errors.
- [ ] Valid benchmark report fixtures still format and serialize exactly as
  expected, except for intentional error handling tests.
- [ ] No production runtime behavior or report schema changes are included.

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

