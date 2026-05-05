# Task: Include core tests in package verify

Status: done
Owner: Codex orchestrator
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make the `@bc8-odx/core` package-local `verify` script run focused core tests
as well as the standalone framework-free example.

## Context

Package-local verification is now documented for all packages, but the core
package verify command currently exercises only `examples/core-standalone.ts`.
Core already has package tests for parsing and utility behavior, so the package
isolation story should include those tests without requiring the full workspace
test run.

Relevant docs and files:

- `README.md`
- `ARCHITECTURE.md`
- `packages/core/package.json`
- `packages/core/README.md`
- `packages/core/test/`
- `examples/core-standalone.ts`
- `.agents/PACKAGE_ISOLATION.md`

## Scope

- Update `packages/core/package.json` so `pnpm.cmd --filter @bc8-odx/core run
  verify` runs the focused core Vitest tests and then the standalone example.
- Update `packages/core/README.md` if its verification text needs to mention
  both checks.
- Update the root README package verification table only if the current wording
  becomes inaccurate.
- Keep the existing root `example:core` script working.

## Non-Goals

- Do not change core runtime behavior.
- Do not add new core tests unless an existing test command cannot be scoped
  cleanly without one.
- Do not change proxy, Nuxt, Explorer, docs, or playground verification.
- Do not add dependencies.

## Acceptance Criteria

- [ ] The core package `verify` script runs focused `packages/core` tests.
- [ ] The same `verify` script still runs the standalone core example.
- [ ] Documentation accurately describes what the core verify command checks.
- [ ] Existing root example commands remain valid.
- [ ] No generated artifacts are committed.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/core run verify`
- `pnpm.cmd run example:core`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use existing local core tests and examples only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this changes package-local verification and documentation
only. Separate review is not required unless implementation changes runtime
core behavior or shared workspace script semantics.

## Handoff Notes

- changed files:
  - `packages/core/package.json`
  - `packages/core/README.md`
  - `README.md`
- summary:
  - Updated the core package-local `verify` script to run focused core Vitest
    tests before the standalone framework-free example.
  - Updated core and root README verification wording to describe both checks.
- tests run:
  - `pnpm.cmd --filter @bc8-odx/core run verify` - passed, including 5 core
    test files / 23 tests and the standalone example.
  - `pnpm.cmd run example:core` - passed.
  - `pnpm.cmd run lint` - passed.
- skipped checks and residual risk:
  - `pnpm.cmd run typecheck` skipped because the task is package script/docs
    wiring only and task-local verification plus lint passed.
- self-check result:
  - Scope stayed limited to core package verification and documentation. No
    core runtime, proxy, Nuxt, Explorer, docs package, dependencies, or root
    example command behavior changed.
- review requirement decision:
  - Separate review is not required because this is low-risk package-local
    verification and documentation work.
- task state movement:
  - Move this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Point to `.agents/tasks/ready/032-validate-btp-destination-url.md`.
- commit hash:
  - pending commit.
- known gaps:
  - none.
