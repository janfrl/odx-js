# Task: Add proxy benchmark compare tests

Status: done
Owner: Codex orchestrator
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

- changed files:
  - `scripts/compare-proxy-benchmarks.ts`
  - `packages/proxy/test/benchmark-compare.test.ts`
- summary:
  - Extracted testable benchmark report parsing and comparison helpers while
    preserving the existing CLI command and output shape.
  - Added focused proxy-package tests for valid deltas, missing candidate
    scenarios, malformed reports, and non-finite `avgMs` values.
- tests run:
  - `pnpm.cmd exec vitest run test` - passed, 17 files and 120 tests passed,
    1 file and 1 test skipped by existing suite behavior.
  - `pnpm.cmd run bench:proxy:compare -- reports/does-not-exist.json reports/does-not-exist.json`
    - exited non-zero as expected with `Could not read baseline report at
    reports/does-not-exist.json: ENOENT...`.
  - `pnpm.cmd run lint` - passed.
  - `pnpm.cmd run typecheck` - passed.
- skipped checks and residual risk:
  - none.
- self-check result:
  - Scope is limited to local benchmark comparison tooling and tests. No
    generated benchmark reports are committed.
- review requirement decision:
  - Separate review is not required because no production runtime behavior,
    benchmark scenario definitions, or dependency wiring changed.
- task state movement:
  - Move this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Point to `.agents/tasks/ready/029-add-docs-package-verify-script.md`.
- commit hash:
  - pending commit.
- known gaps:
  - none.
