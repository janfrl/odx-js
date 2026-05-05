# Task: Include core tests in package verify

Status: ready
Owner: unassigned
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
