# Task: Normalize Nuxt service URL joins

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if public composable contracts or runtime config shape change

## Objective

Make `useOData` construct stable URLs when configured base paths, routes, or
direct service URLs include leading or trailing slashes.

## Context

`useOData` builds proxied and direct request URLs from public runtime config.
The current implementation concatenates strings directly, which can create
double slashes for common config shapes such as a direct service URL ending in
`/` or a route beginning with `/`. URL construction is a public composable
contract and should be covered with focused tests before changing behavior.

Relevant docs and files:

- `API.md`
- `ARCHITECTURE.md`
- `DOMAIN_MODEL.md`
- `packages/nuxt/src/runtime/composables/useOData.ts`
- `packages/nuxt/src/runtime/composables/useODataBasePath.ts`
- `packages/nuxt/test/composables.test.ts`

## Scope

- Add focused Nuxt composable tests for:
  - direct service URLs with trailing slashes
  - proxied routes with leading or trailing slashes
  - root `basePath` values with trailing slashes
- Normalize URL joins in the Nuxt runtime composable layer only.
- Preserve existing typed `useOData().Service.EntitySet` and
  `useOData('Service').entitySet()` behavior.
- Keep query serialization and OData key formatting behavior unchanged.

## Non-Goals

- Do not change proxy request parsing or `@bc8-odx/proxy` URL resolution.
- Do not change public runtime config field names or service strategy semantics.
- Do not redesign `useODataBasePath`.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Tests fail before the URL join fix for at least one double-slash case.
- [ ] Direct service URLs with trailing slashes produce a single slash before
  the entity set.
- [ ] Proxied URLs remain stable when `basePath` or `route` includes extra
  boundary slashes.
- [ ] Existing key-formatting and route-alias tests remain green.
- [ ] No proxy package behavior changes are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/nuxt/test/composables.test.ts`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Before editing, inspect `git status --short` and preserve any unrelated
  uncommitted edits in `packages/nuxt/test/composables.test.ts`.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches a public Nuxt composable URL contract. Separate
review is not required if the change is limited to URL normalization with
focused tests and does not alter runtime config shape, service strategy
semantics, or proxy behavior.

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

