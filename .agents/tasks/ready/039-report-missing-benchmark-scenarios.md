# Task: Report missing benchmark scenarios

Status: ready
Owner: unassigned
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

- [ ] Compare-helper tests cover baseline-only and candidate-only scenarios.
- [ ] Compare output names scenarios missing from either report.
- [ ] Matching scenarios still show timing deltas as before.
- [ ] Reports without metadata remain accepted.
- [ ] No production proxy code changes are included.

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

