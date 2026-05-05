# Task: Verify non-identifier service names in minimal Nuxt playground

Status: ready
Owner: unassigned
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

- [ ] `verify.mjs` has a failing-first assertion for a quoted non-identifier
  registry key.
- [ ] The minimal Nuxt playground includes a non-identifier service name using
  existing local fixtures.
- [ ] The app or verification path demonstrates bracket-notation or literal
  `useOData('Sales-Order')` access.
- [ ] Existing minimal playground behavior remains covered.
- [ ] Nuxt package verification remains green.

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

