# Task: Add aggregate package verification script

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Add a single root command that runs the existing package-local verification
scripts for core, proxy, Nuxt, Explorer, and docs.

## Context

Package-level verification commands now exist and are documented individually,
but checkpoint work still requires manually composing them. A root aggregate
script improves package isolation by making the package-local checks runnable
as one explicit command without replacing broader `lint`, `typecheck`, or
workspace `test` checks.

Relevant docs and files:

- `README.md`
- `package.json`
- `packages/core/package.json`
- `packages/proxy/package.json`
- `packages/nuxt/package.json`
- `packages/explorer/package.json`
- `docs/package.json`
- `.agents/PACKAGE_ISOLATION.md`
- `.agents/tasks/done/023-add-package-local-verify-scripts.md`
- `.agents/tasks/done/029-add-docs-package-verify-script.md`
- `.agents/tasks/done/031-include-core-tests-in-package-verify.md`

## Scope

- Add a root script, such as `verify:packages`, that runs the existing
  package-local verify scripts for:
  - `@bc8-odx/core`
  - `@bc8-odx/proxy`
  - `@bc8-odx/nuxt`
  - `@bc8-odx/explorer`
  - `docs`
- Update `README.md` package verification guidance only if needed to mention
  the aggregate command.
- Keep individual package `verify` scripts unchanged unless a mechanical
  script-name adjustment is strictly required.

## Non-Goals

- Do not replace `pnpm.cmd run lint`, `pnpm.cmd run typecheck`, or
  `pnpm.cmd run test`.
- Do not add new package playgrounds, examples, dependencies, CI config, or
  lockfile changes.
- Do not broaden docs/package behavior beyond command discoverability.

## Acceptance Criteria

- [ ] The root aggregate script runs all existing package-local verify scripts.
- [ ] Individual package-local verify commands remain available.
- [ ] README guidance clearly distinguishes package verification from broad
  workspace checks.
- [ ] No package runtime code changes are included.

## Verification

Task-local checks:

- `pnpm.cmd run verify:packages`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use existing local package fixtures and playgrounds only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is developer tooling and documentation. Separate review
is not required unless package runtime behavior, dependencies, lockfiles, or CI
configuration change.

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

