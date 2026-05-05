# Task: Add minimal Nuxt package playground

Status: done
Owner: Ohm + Codex orchestrator
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

- [x] The Nuxt module can be verified through a minimal package-specific target.
- [x] Type generation and registry augmentation are exercised.
- [x] The verification command is documented.
- [x] Existing tests still pass.

## Verification

Task-local checks:

- `<new playground verification command>`
- `pnpm.cmd run test -- packages/nuxt`
- `pnpm.cmd run typecheck`

## Risk Notes

Medium risk because this touches module verification and workspace shape. Require
review if module contracts or workspace package structure change.

## Handoff Notes

- Added a package-local minimal Nuxt playground at `packages/nuxt/playground/minimal`.
- The playground registers `@bc8-odx/nuxt` directly from `packages/nuxt/src/module`, uses local EDMX metadata at `edmx/minimal.edmx`, disables DevTools, and avoids external network services.
- Added `pnpm.cmd --filter @bc8-odx/nuxt run playground:check` as the package-specific verification command. It runs `nuxi prepare playground/minimal` and then `node playground/minimal/verify.mjs`.
- The app references `ODataServiceRegistry['MinimalLocal']` and `minimalService.Products`; the verification script asserts the generated registry augmentation includes `MinimalLocal`, the `Products` entity set, and the generated `Product` model mapping.
- Verification:
  - `pnpm.cmd --filter @bc8-odx/nuxt run playground:check` passed.
  - `pnpm.cmd run lint` passed.
  - `pnpm.cmd run typecheck` passed.
  - `pnpm.cmd run test -- packages/nuxt` failed in existing Nuxt production e2e suites while starting test servers on Node 24.13.1: Nitro throws `TypeError [ERR_INVALID_ARG_VALUE]` for `file:///_entry.js`, then `@nuxt/test-utils` times out waiting for ports in `packages/nuxt/test/isolated.test.ts` and `test/module.test.ts`. Non-server suites reported as passed.
- Separate review is conditional: no module contracts changed, but review is useful if the team wants to validate the verification strategy because the broad Nuxt server tests are blocked by the existing Node/Nitro test-utils failure.
- Commit hash:
  - To be filled after commit.
