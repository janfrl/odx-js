# Task: Add core and proxy standalone examples

Status: ready
Owner: unassigned
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

- [ ] Core can be demonstrated without Nuxt.
- [ ] Proxy can be demonstrated as standalone H3 server behavior.
- [ ] Examples have local verification commands.
- [ ] Existing tests still pass.

## Verification

Task-local checks:

- `<new example command>`
- `pnpm.cmd run test -- packages/core packages/proxy`
- `pnpm.cmd run typecheck`

## Risk Notes

Medium risk because examples may affect scripts and package boundaries. Require
review if public contracts change.

## Handoff Notes

To be completed by the implementer.
