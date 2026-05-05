# Task: Add deployment config consistency tests

Status: done
Owner: Implementer
Created: 2026-05-05
Completed: 2026-05-05
Risk: high
Review: required

## Objective

Add deterministic local coverage that keeps the AppRouter routes in sync with
the deployment configuration that provides their destinations.

## Context

`packages/approuter/xs-app.json` declares authenticated routes for the proxy
and Explorer UI. `mta.yaml` provides the destination names consumed by those
routes. A mismatch here would only surface during deployment or smoke testing,
so the repository should have a small static check before broader deployment
work.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `ARCHITECTURE.md`
- `DEPLOYMENT.md`
- `SECURITY.md`
- `mta.yaml`
- `packages/approuter/xs-app.json`
- `packages/approuter/package.json`
- `package.json`

## Scope

- Add a focused Vitest test or small package-local verification script that
  checks `packages/approuter/xs-app.json` route destinations are provided by
  the `odx-approuter` module destination entries in `mta.yaml`.
- Prefer parsing or narrowly extracting only the deployment fields needed for
  this invariant; do not add a dependency unless there is no reasonable local
  alternative.
- Add or update the smallest package/root script needed to run the check
  locally.
- Update `DEPLOYMENT.md` or package verification docs only if needed to make
  the new check discoverable.

## Non-Goals

- Do not change deployed route paths, auth type, destination forwarding,
  XSUAA scopes, service bindings, module names, or production deployment
  topology unless the new test exposes a concrete mismatch.
- Do not run `mbt build`, `cf deploy`, or Cloud Foundry commands.
- Do not add broad YAML tooling, CI gates, dependencies, or lockfile changes
  unless they are explicitly justified by the implementation.
- Do not modify proxy, Explorer, Nuxt, or core runtime code.

## Acceptance Criteria

- [x] Local verification fails clearly if an AppRouter route destination is not
  provided by `mta.yaml`.
- [x] Current `mta.yaml` and `packages/approuter/xs-app.json` pass the check.
- [x] The check is discoverable through a package-local or root verification
  command.
- [x] No deployment behavior changes are made unless required to fix a proven
  mismatch.
- [x] Separate review is requested after implementation.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/approuter/test/deployment-config.test.ts`
- `pnpm.cmd --filter odx-approuter run verify`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run test`
- `pnpm.cmd run verify:packages`

Setup/data prerequisites:

- Use local checked-in configuration files only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because deployment configuration and authenticated AppRouter
routing are deployment/security boundaries. Separate review is required even
if the implementation is test-only or script-only.

## Handoff Notes

- changed files: `packages/approuter/test/deployment-config.test.ts`,
  `packages/approuter/vitest.config.ts`, `packages/approuter/package.json`,
  `package.json`, `README.md`, `DEPLOYMENT.md`, `.agents/NEXT.md`, and this
  task file moved to `.agents/tasks/done/`.
- summary: Added a focused AppRouter Vitest check that reads checked-in
  `xs-app.json` and `mta.yaml`, extracts only `odx-approuter` destination
  entries, and fails with the missing route destination/source objects when an
  AppRouter route destination is not provided by the MTA module. Added an
  `odx-approuter` package `verify` script and included it in root
  `verify:packages`.
- tests run:
  - `pnpm.cmd exec vitest run packages/approuter/test/deployment-config.test.ts`
  - `pnpm.cmd --filter odx-approuter run verify`
  - `pnpm.cmd run typecheck`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run test`
  - `pnpm.cmd run verify:packages`
- skipped checks and residual risk: None. `pnpm.cmd` commands required
  escalation to read the local Corepack pnpm cache outside the workspace.
  `pnpm.cmd run test` and `pnpm.cmd run verify:packages` passed with existing
  Node dependency deprecation warnings about trailing slash exports.
- self-check result: Scope matches the task; no deployed route paths, auth
  types, destination forwarding, XSUAA scopes, bindings, module names, or
  production topology were changed; no dependencies or lockfile changes were
  added; docs were only updated for check discoverability; generated
  verification artifacts were cleaned up.
- review requirement decision: Separate review is required because the task
  touches deployment/runtime boundary verification and the task explicitly
  requires review.
- task state movement: moved from `.agents/tasks/ready/` to
  `.agents/tasks/done/`.
- `.agents/NEXT.md` update: updated to request an independent reviewer for
  `.agents/tasks/done/051-add-deployment-config-consistency-tests.md`.
- commit hash: pending commit; final hash reported in the implementation chat
  summary.
- known gaps: None known.
