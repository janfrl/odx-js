# Task: Add aggregate package verification script

Status: done
Owner: Codex
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

- [x] The root aggregate script runs all existing package-local verify scripts.
- [x] Individual package-local verify commands remain available.
- [x] README guidance clearly distinguishes package verification from broad
  workspace checks.
- [x] No package runtime code changes are included.

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

- changed files:
  - `package.json`
  - `README.md`
  - `.agents/tasks/done/044-add-aggregate-package-verification-script.md`
  - `.agents/NEXT.md`
- summary:
  - Added root `verify:packages` script that runs existing package-local
    verification scripts for core, proxy, Nuxt, Explorer, and docs.
  - Added README package verification guidance for the aggregate command and
    explicitly distinguished it from broad `lint`, `typecheck`, and workspace
    `test`.
  - Left individual package `verify` scripts, runtime code, dependencies,
    lockfiles, CI config, and broad workspace checks unchanged.
- tests run:
  - PASS: `pnpm.cmd run verify:packages`
    (core, proxy, Nuxt, Explorer, and docs verify scripts passed; Nuxt emitted
    existing Node `DEP0155` dependency warnings).
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - `pnpm.cmd run typecheck` skipped because this task changes only package
    scripts, README guidance, and workflow notes; no typed source changed.
- self-check result:
  - Scope stayed in developer tooling/docs. The aggregate command reuses
    existing package-local scripts and does not replace `lint`, `typecheck`, or
    workspace `test`.
- review requirement decision:
  - Separate review is not required because this is low-risk tooling and
    documentation only.
- task state movement:
  - Moved this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Updated to Planner prompt because the ready queue is empty after this task.
- commit hash:
  - pending commit.
- known gaps:
  - `verify:packages` runs docs extraction, which can rewrite generated docs
    artifacts if API reference output is stale. No generated artifact changes
    are included in this task.
