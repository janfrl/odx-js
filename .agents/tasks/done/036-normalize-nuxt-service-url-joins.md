# Task: Normalize Nuxt service URL joins

Status: done
Owner: Codex orchestrator
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

- changed files:
  - `packages/nuxt/test/composables.test.ts`
  - `packages/nuxt/src/runtime/composables/useOData.ts`
- summary:
  - Added focused composable tests for direct service URLs ending in `/` and
    proxied basePath/route values with boundary slashes.
  - Confirmed the new tests failed before the fix with double slashes.
  - Added local URL segment normalization in `useOData` for direct and proxied
    composable paths without changing runtime config shape, service strategy
    semantics, query serialization, key formatting, or proxy behavior.
- tests run:
  - Before fix: `pnpm.cmd exec vitest run packages/nuxt/test/composables.test.ts -t "normalizes"`
    failed for direct and proxied double-slash cases.
  - After fix: same focused command passed.
  - `pnpm.cmd exec vitest run packages/nuxt/test/composables.test.ts` - passed,
    19 tests.
  - `pnpm.cmd --filter @bc8-odx/nuxt run verify` - passed.
  - `pnpm.cmd run typecheck` - passed.
  - `pnpm.cmd run lint` - passed.
- skipped checks and residual risk:
  - none.
- self-check result:
  - Scope stayed in Nuxt composable URL construction and tests. No proxy
    package behavior, runtime config fields, service strategy semantics,
    dependencies, query serialization, or OData key formatting changed.
- review requirement decision:
  - Separate review is not required because the change is limited to URL
    normalization with focused tests and does not alter public config shape or
    proxy behavior.
- task state movement:
  - Move this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Point to `.agents/tasks/ready/037-reject-non-http-btp-destination-url.md`.
- commit hash:
  - pending commit.
- known gaps:
  - none.
