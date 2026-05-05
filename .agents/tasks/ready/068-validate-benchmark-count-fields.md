# Task: Validate benchmark count fields

Status: ready
Owner: unassigned
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

- [ ] A focused test fails before implementation for at least one malformed
  count field.
- [ ] `formatBenchmarkReport()` and `createBenchmarkOutput()` reject invalid
  `iterations`, `rounds`, and `concurrency` values with scenario-specific
  errors.
- [ ] Valid benchmark report fixtures still format and serialize as before.
- [ ] No production runtime behavior or benchmark schema changes are included.

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
