# Task: Add proxy benchmark compare helper

Status: ready
Owner: unassigned
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
