# Task: Add minimal Nuxt package playground

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if module contracts change

## Objective

Create a minimal package-specific Nuxt playground that proves `@bc8-odx/nuxt`
works without relying on the full root playground.

## Context

The root playground is useful but can hide package coupling. A minimal Nuxt
playground should verify module registration, local EDMX generation, and one
typed composable path with little extra surface area.

Relevant files:

- `.agents/PACKAGE_ISOLATION.md`
- `packages/nuxt/src/**`
- `packages/nuxt/test/fixtures/**`
- `playground/`
- `package.json`
- `pnpm-workspace.yaml`

## Scope

- Add the smallest practical Nuxt fixture/playground for the Nuxt module.
- Use a local EDMX service and one page or test fixture.
- Add a verification command.
- Keep it separate from Explorer UI work.

## Non-Goals

- Do not duplicate the full root playground.
- Do not redesign docs or Explorer.
- Do not require network services.

## Acceptance Criteria

- [ ] The Nuxt module can be verified through a minimal package-specific target.
- [ ] Type generation and registry augmentation are exercised.
- [ ] The verification command is documented.
- [ ] Existing tests still pass.

## Verification

Task-local checks:

- `<new playground verification command>`
- `pnpm.cmd run test -- packages/nuxt`
- `pnpm.cmd run typecheck`

## Risk Notes

Medium risk because this touches module verification and workspace shape. Require
review if module contracts or workspace package structure change.

## Handoff Notes

To be completed by the implementer.
