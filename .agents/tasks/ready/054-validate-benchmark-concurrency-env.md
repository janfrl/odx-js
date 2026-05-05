# Task: Validate benchmark concurrency env

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark configuration reject zero, negative, non-integer, and
non-numeric concurrency values before any timing loops run.

## Context

Proxy benchmark output now includes concurrency metadata and stricter report
comparison validation. The benchmark runner still parses
`ODX_PROXY_BENCHMARK_CONCURRENCY` directly with `Number.parseInt`, which can
allow invalid values such as `0`, negative numbers, partial numeric strings, or
`NaN` into loop controls. The benchmark should fail fast with a clear message
instead of hanging or producing misleading timing output.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/034-add-proxy-benchmark-report-metadata.md`
- `.agents/tasks/done/052-validate-benchmark-comparison-timing-fields.md`
- `packages/proxy/test/performance.test.ts`
- `packages/proxy/README.md`

## Scope

- Add focused tests for benchmark concurrency env parsing that prove invalid
  values are rejected before benchmark measurement loops execute.
- Reject at least `0`, negative values, decimal values, non-numeric strings,
  empty strings, and partially parsed strings such as `5abc`.
- Preserve the existing default concurrency when the env var is absent.
- Preserve valid positive integer overrides.
- Keep changes limited to benchmark test/tooling code and narrow README wording
  only if the accepted env value rules need to be discoverable.

## Non-Goals

- Do not change benchmark scenario definitions, timing measurement semantics,
  report JSON shape, comparison tooling, production proxy runtime code,
  dependencies, lockfiles, CI gates, or performance budgets.
- Do not run the full timing benchmark as part of proving invalid env parsing
  unless the implementer chooses to run it as an optional smoke check.
- Do not introduce broad configuration abstractions unrelated to benchmark env
  parsing.

## Acceptance Criteria

- [ ] A focused test fails before implementation for invalid concurrency env
  values that currently reach loop controls.
- [ ] Invalid concurrency values fail with a clear error that names
  `ODX_PROXY_BENCHMARK_CONCURRENCY`.
- [ ] Absent concurrency env keeps the existing default.
- [ ] Valid positive integer concurrency env values still work.
- [ ] No production proxy runtime behavior or benchmark report schema changes
  are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use deterministic benchmark configuration tests; do not require running the
  timing benchmark with `ODX_PROXY_BENCHMARK=1`.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is local benchmark tooling validation and tests only.
Separate review is not required unless production proxy code, benchmark
scenario semantics, dependencies, report JSON shape, CI gates, or performance
budgets change.

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

