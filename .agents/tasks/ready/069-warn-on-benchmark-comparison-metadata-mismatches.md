# Task: Warn on benchmark comparison metadata mismatches

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make the proxy benchmark comparison output call out metadata mismatches that can
make two reports less directly comparable.

## Context

Benchmark reports include metadata such as Node version, platform, arch,
iterations, rounds, warmup iterations, and default concurrency. The comparison
helper currently prints available metadata but does not explicitly warn when
baseline and candidate reports differ on these fields.

Relevant files:

- `scripts/compare-proxy-benchmarks.ts`
- `packages/proxy/test/benchmark-compare.test.ts`
- `.agents/tasks/done/034-add-proxy-benchmark-report-metadata.md`
- `.agents/tasks/done/064-reject-malformed-benchmark-report-timing-fields.md`

## Scope

- Add failing tests first for baseline/candidate metadata mismatches.
- Emit concise warning lines in `formatComparison()` when both reports include
  a metadata field and the values differ.
- Cover at least Node version and one run-shape field such as `iterations`,
  `rounds`, or `defaultConcurrency`.
- Preserve compatibility for old reports without metadata.
- Preserve existing scenario comparison rows, missing-scenario reporting,
  duplicate-label validation, and timing-field validation.

## Non-Goals

- Do not reject mismatched metadata; this task should warn, not fail.
- Do not change benchmark report generation, timing measurement, scenario
  definitions, report schema, package scripts, dependencies, lockfiles, or
  generated files.
- Do not add broad machine fingerprinting beyond existing metadata fields.

## Acceptance Criteria

- [ ] A focused test fails before implementation for at least one metadata
  mismatch warning.
- [ ] Comparison output includes clear warnings for mismatched shared metadata
  fields.
- [ ] Old reports without metadata remain compatible and do not produce noisy
  warnings for absent fields.
- [ ] Existing benchmark comparison tests remain green.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use deterministic comparison fixtures; do not require real benchmark timing
  runs.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is benchmark-tooling-only output behavior. Separate
review is not required unless the implementation changes report parsing
compatibility, benchmark report generation, production runtime behavior,
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
