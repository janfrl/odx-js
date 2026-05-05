# Task: Add core and proxy standalone examples

Status: done
Owner: Kepler + Codex orchestrator
Created: 2026-05-05
Risk: medium
Review: conditional - required if public package contracts change

## Objective

Show `@bc8-odx/core` and `@bc8-odx/proxy` working independently of Nuxt.

## Context

Package isolation should prove that core utilities and proxy handlers are useful
outside the full app/playground path.

Relevant files:

- `.agents/PACKAGE_ISOLATION.md`
- `packages/core/src/**`
- `packages/proxy/src/**`
- `packages/proxy/test/fixtures/**`
- `package.json`

## Scope

- Add a small framework-free core example using existing EDMX/response fixtures.
- Add a standalone H3 proxy example using `createODataHandler(config)`.
- Add clear local run scripts.
- Reuse existing fixtures where practical.

## Non-Goals

- Do not build a new UI.
- Do not require SAP/BTP services.
- Do not change public package contracts unless a blocker is found.

## Acceptance Criteria

- [x] Core can be demonstrated without Nuxt.
- [x] Proxy can be demonstrated as standalone H3 server behavior.
- [x] Examples have local verification commands.
- [x] Existing tests still pass.

## Verification

Task-local checks:

- `<new example command>`
- `pnpm.cmd run test -- packages/core packages/proxy`
- `pnpm.cmd run typecheck`

## Risk Notes

Medium risk because examples may affect scripts and package boundaries. Require
review if public contracts change.

## Handoff Notes

Implemented standalone examples without changing public package contracts:

- `examples/core-standalone.ts` demonstrates `@bc8-odx/core` and
  `@bc8-odx/core/server` outside Nuxt by parsing the basic EDMX fixture,
  stringifying an OData query, flattening local V2-shaped mock data, and calling
  `$odata` with a framework-free client function.
- `examples/proxy-standalone.ts` starts the existing H3 backend fixture, mounts
  `createODataHandler(config)` in a standalone H3 server, performs local proxied
  requests, and closes both servers.
- Added root scripts:
  - `pnpm.cmd run example:core`
  - `pnpm.cmd run example:proxy`
  - `pnpm.cmd run examples`

Verification results:

- `pnpm.cmd run example:core` passed.
- `pnpm.cmd run example:proxy` passed.
- `pnpm.cmd run examples` passed.
- `pnpm.cmd run test -- packages/core packages/proxy` did not stay scoped in
  this workspace invocation and also ran Nuxt suites; core/proxy package tests
  passed, but Nuxt startup failed with `GetPortError` and Node 24
  `ERR_INVALID_ARG_VALUE: Received 'file:///_entry.js'`.
- `pnpm.cmd exec vitest run packages/core packages/proxy` passed:
  11 files passed, 1 skipped; 59 tests passed, 1 skipped.
- `pnpm.cmd run lint` passed.
- `pnpm.cmd run typecheck` passed.

Self-check:

- Scope stayed limited to standalone examples, root scripts needed to run them,
  and this task handoff note.
- No public core or proxy package contract changes were made.
- Separate review is optional under the task policy because no public contracts
  changed; useful mainly to confirm the example shape and script naming.

Commit hash:

- To be filled after commit.
