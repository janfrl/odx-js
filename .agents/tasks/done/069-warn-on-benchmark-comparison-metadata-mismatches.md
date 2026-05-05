# Task: Warn on benchmark comparison metadata mismatches

Status: done
Owner: Codex
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

- [x] A focused test fails before implementation for at least one metadata
  mismatch warning.
- [x] Comparison output includes clear warnings for mismatched shared metadata
  fields.
- [x] Old reports without metadata remain compatible and do not produce noisy
  warnings for absent fields.
- [x] Existing benchmark comparison tests remain green.

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

- Changed files:
  - `.agents/tasks/done/069-warn-on-benchmark-comparison-metadata-mismatches.md`
  - `.agents/NEXT.md`
  - `scripts/compare-proxy-benchmarks.ts`
  - `packages/proxy/test/benchmark-compare.test.ts`
- Summary:
  - Added benchmark comparison warnings for shared metadata fields that differ
    between baseline and candidate reports.
  - Covered `node`, `platform`, `arch`, `iterations`, `rounds`,
    `warmupIterations`, and `defaultConcurrency`.
  - Preserved old-report compatibility by warning only when both reports include
    the compared metadata field.
- Failing-first proof:
  - Added `warns when shared benchmark metadata fields differ`.
  - Initial `pnpm.cmd exec vitest run packages\proxy\test\benchmark-compare.test.ts`
    failed with `1 failed | 11 passed`; the failing assertion expected
    `warning: metadata mismatch: node baseline=v24.13.1 candidate=v24.14.0`.
- Tests run:
  - `pnpm.cmd exec vitest run packages\proxy\test\benchmark-compare.test.ts`
    - passed, 12 tests.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify`
    - passed, 9 test files, 120 passed, 1 skipped, plus standalone proxy example.
  - `pnpm.cmd run lint`
    - passed.
  - `pnpm.cmd run typecheck`
    - passed.
  - `git diff --check`
    - passed; Git reported expected LF-to-CRLF working-copy warnings for edited
      files.
- Skipped checks and residual risk:
  - None.
- Self-check result:
  - Scope matches task 069, no production runtime, dependencies, lockfiles,
    generated files, or unrelated files changed.
  - Existing comparison rows, missing-scenario reporting, duplicate-label
    validation, and timing-field validation were left intact and verified by the
    existing focused tests.
- Review requirement decision:
  - Separate review not required. This remains low-risk benchmark tooling output
    behavior and does not alter report generation, production runtime, public
    APIs, dependencies, CI gates, or parsing compatibility.
- Task state movement:
  - Moved from `ready/` to `in-progress/` when starting.
  - Moved to `done/` after implementation and verification.
- `.agents/NEXT.md` update:
  - Updated to task 070, `Test deterministic benchmark summary math`.
- Commit hash:
  - Commit containing this handoff.
- Known gaps:
  - None.
