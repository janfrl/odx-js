# Task: Add proxy benchmark compare tests

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Add focused automated tests for the local proxy benchmark comparison helper so
future tooling changes can be made without manually checking every failure
path.

## Context

Task 025 added `scripts/compare-proxy-benchmarks.ts` and manual verification
for valid and invalid inputs. The helper is local tooling, but it now has enough
parsing and validation behavior to deserve a small test suite.

Relevant files:

- `scripts/compare-proxy-benchmarks.ts`
- `packages/proxy/test/performance.test.ts`
- `packages/proxy/README.md`
- `.agents/tasks/done/025-add-proxy-benchmark-compare-helper.md`

## Scope

- Refactor `scripts/compare-proxy-benchmarks.ts` only as needed to make its
  parsing/comparison behavior testable without executing the CLI on import.
- Add focused tests under `test/` or another existing test location that cover:
  - a valid comparison with matching scenario labels
  - missing candidate scenario labels
  - malformed report shape
  - missing or non-finite `avgMs`
- Preserve the existing CLI command and output shape.
- Preserve invalid-input non-zero CLI behavior.

## Non-Goals

- Do not change benchmark scenario definitions or production proxy code.
- Do not add performance budgets, thresholds, or pass/fail gates.
- Do not generate benchmark reports during normal tests.
- Do not add dependencies.

## Acceptance Criteria

- [ ] The compare helper has automated tests for valid reports.
- [ ] The compare helper has automated tests for representative invalid
  reports.
- [ ] The CLI still works as `pnpm.cmd run bench:proxy:compare -- <a> <b>`.
- [ ] Existing benchmark behavior is unchanged.
- [ ] No generated benchmark reports are committed.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run test`
- `pnpm.cmd run bench:proxy:compare -- reports/does-not-exist.json reports/does-not-exist.json`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- none

Setup/data prerequisites:

- The invalid-input CLI verification is expected to exit non-zero; record the
  useful error message in Handoff Notes.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is test coverage and local benchmark tooling only.
Separate review is not required unless the implementation changes production
runtime code, benchmark semantics, or dependency wiring.

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
