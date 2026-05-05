# Task: Add deployment config consistency tests

Status: ready
Owner: unassigned
Created: 2026-05-05
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

- [ ] Local verification fails clearly if an AppRouter route destination is not
  provided by `mta.yaml`.
- [ ] Current `mta.yaml` and `packages/approuter/xs-app.json` pass the check.
- [ ] The check is discoverable through a package-local or root verification
  command.
- [ ] No deployment behavior changes are made unless required to fix a proven
  mismatch.
- [ ] Separate review is requested after implementation.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run <new-or-existing-deployment-config-test>`
- `<new package-local or root verification command>`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run test` if a root test file or shared test configuration changes.

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
