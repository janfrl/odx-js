# Task: Verify non-identifier service names in minimal Nuxt playground

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: conditional - required if generation contracts or playground output layout change

## Objective

Extend the minimal Nuxt package playground so package-local verification proves
non-identifier service names work in generated registry usage and runtime
composable access.

## Context

Task 058 fixed generated registry declarations for service names that are not
legal TypeScript identifiers, and task 061 documented bracket-notation access.
The minimal Nuxt playground should verify that package-isolation surface
instead of relying only on unit tests.

This task is separate from task 063: it verifies service-name shape and
bracket-notation usage in the minimal playground, not URI encoding of entity
keys.

Relevant docs and files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/PACKAGE_ISOLATION.md`
- `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
- `.agents/tasks/done/061-document-service-name-type-generation-limits.md`
- `packages/nuxt/playground/minimal/nuxt.config.ts`
- `packages/nuxt/playground/minimal/app.vue`
- `packages/nuxt/playground/minimal/verify.mjs`

## Scope

- Update `verify.mjs` first so it asserts a quoted generated registry key such
  as `'Sales-Order'`; this should fail until the playground config and usage
  include that service.
- Add a minimal service named `Sales-Order` or an equivalent non-identifier
  service name to the minimal playground config using existing local fixtures.
- Update the minimal playground app to use bracket notation and/or
  `useOData('Sales-Order')` in a way that package verification can assert.
- Preserve the existing minimal playground service and verification coverage.
- Keep the playground small and package-local.

## Non-Goals

- Do not change generated declaration implementation, metadata output layout,
  model generation contracts, root playground behavior, production runtime
  code, Explorer UI, dependencies, lockfiles, or generated files.
- Do not add broad browser verification or visual changes.
- Do not test path separator service names.

## Acceptance Criteria

- [x] `verify.mjs` has a failing-first assertion for a quoted non-identifier
  registry key.
- [x] The minimal Nuxt playground includes a non-identifier service name using
  existing local fixtures.
- [x] The app or verification path demonstrates bracket-notation or literal
  `useOData('Sales-Order')` access.
- [x] Existing minimal playground behavior remains covered.
- [x] Nuxt package verification remains green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- none unless the implementation changes generation contracts or package
  output layout

Setup/data prerequisites:

- Use the existing minimal playground local fixtures.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is package-isolation verification using an existing
minimal playground. Separate review is not required if changes stay limited to
playground config, usage, and verification assertions.

Require independent review if the task changes generation contracts, generated
output layout, metadata cache behavior, runtime composable behavior, or public
documentation beyond narrow verification notes.

## Handoff Notes

- changed files
  - `packages/nuxt/playground/minimal/verify.mjs`
  - `packages/nuxt/playground/minimal/nuxt.config.ts`
  - `packages/nuxt/playground/minimal/app.vue`
  - `.agents/tasks/done/065-verify-non-identifier-service-names-in-minimal-nuxt-playground.md`
  - `.agents/NEXT.md`
- summary
  - Added a failing-first minimal playground verifier assertion for the quoted
    generated registry key `"Sales-Order"`.
  - Added a `Sales-Order` service to the minimal Nuxt playground using the
    existing `edmx/minimal.edmx` local fixture.
  - Added typed app usage for `ODataServiceRegistry['Sales-Order']`,
    `useOData('Sales-Order')`, and the service's `Products` entity set while
    preserving the existing `MinimalLocal` coverage.
- failing-first proof
  - FAIL before config/app update: `node packages\nuxt\playground\minimal\verify.mjs`
  - Failure output included:
    `Error: Expected generated registry to include: "Sales-Order": ODataService<"Products"`
- tests run
  - Initial sandboxed pnpm runs failed with `EPERM: operation not permitted,
    opendir 'C:\Users\janfr\AppData\Local\node\corepack\v1\pnpm'`; reran the
    required pnpm commands with escalation for Corepack cache access.
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt run verify`
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
  - PASS: `pnpm.cmd run typecheck`
  - PASS: `pnpm.cmd run lint`
  - PASS: `git diff --check`
- skipped checks and residual risk
  - No required checks were skipped.
  - Nuxt verification emitted existing Node `DEP0155` trailing slash pattern
    deprecation warnings from dependencies.
  - `docs/public/api-reference.json` exists in the worktree but was not
    modified by this task. `packages/explorer/.nuxtrc` was not present.
- self-check result
  - Scope stayed limited to the minimal Nuxt playground config, app usage, and
    verification assertions. No production generator/runtime code, Explorer UI,
    dependencies, lockfiles, generated files, metadata output layout, or model
    generation contracts were changed.
- review requirement decision
  - Separate review is not required because this is low-risk playground
    verification only, the required checks passed, and no generation contracts
    or output layout changed.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start.
  - Moved to `.agents/tasks/done/` after implementation and verification.
- `.agents/NEXT.md` update
  - Updated to point at
    `.agents/tasks/ready/066-protect-devtools-log-storage-from-external-mutation.md`.
- commit hash
  - Commit containing this handoff.
- known gaps
  - None.
