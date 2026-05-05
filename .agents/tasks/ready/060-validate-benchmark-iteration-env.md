# Task: Validate benchmark iteration env

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make proxy benchmark configuration reject invalid iteration and round env
values before timing loops run.

## Context

Task 054 made `ODX_PROXY_BENCHMARK_CONCURRENCY` strict, but
`ODX_PROXY_BENCHMARK_ITERATIONS` and `ODX_PROXY_BENCHMARK_ROUNDS` still use
permissive `Number.parseInt` parsing. Invalid values can produce misleading
reports or skip measurement work. The benchmark should fail fast with clear
configuration errors before timing code executes.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/054-validate-benchmark-concurrency-env.md`
- `packages/proxy/test/performance.test.ts`
- `packages/proxy/README.md`

## Scope

- Add focused tests for invalid `ODX_PROXY_BENCHMARK_ITERATIONS` and
  `ODX_PROXY_BENCHMARK_ROUNDS` values.
- Reject zero, negative, decimal, non-numeric, empty, and partially parsed
  values such as `5abc`.
- Preserve existing defaults when the env vars are absent.
- Preserve valid positive integer overrides.
- Keep validation deterministic and outside full timing benchmark execution.
- Update the proxy README wording only if the accepted env value rules need to
  be discoverable.

## Non-Goals

- Do not change benchmark scenario definitions, timing measurement semantics,
  report JSON shape, comparison tooling, production proxy runtime code,
  dependencies, lockfiles, CI gates, or performance budgets.
- Do not run the full timing benchmark as part of proving validation unless the
  implementer chooses an optional smoke check.
- Do not revisit concurrency validation except where shared helper extraction
  makes the implementation smaller and covered by existing tests.

## Acceptance Criteria

- [ ] Focused tests fail before implementation for invalid iteration and round
  env values.
- [ ] Invalid values fail with clear errors naming the relevant env var.
- [ ] Absent env vars keep existing defaults.
- [ ] Valid positive integer overrides still work.
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

Low risk because this is local benchmark tooling validation. Separate review is
not required unless production proxy code, benchmark scenario semantics,
dependencies, report JSON shape, CI gates, or performance budgets change.

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

