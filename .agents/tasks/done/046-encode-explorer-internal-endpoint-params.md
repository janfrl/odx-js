# Task: Encode Explorer internal endpoint params

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if internal endpoint contracts, server query parsing, or visible UI layout change

## Objective

Make Explorer internal endpoint calls preserve service and entity names that
contain query separator characters.

## Context

Read-only investigation found unencoded query parameters in Explorer URLs for
internal endpoints. Service or entity names containing `&`, `#`, spaces, or
`?` can be split or truncated before reaching `/__odx__/schema`,
`/__odx__/generate`, or `/__odx__/mockdata`.

Relevant docs and files:

- `ARCHITECTURE.md`
- `API.md`
- `DESIGN.md`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/composables/useSchemaExplorer.ts`
- `packages/explorer/components/tabs/TabServices.vue`
- `packages/explorer/test/state.test.ts`

Known unencoded URLs include:

- `/__odx__/schema?service=${name}`
- `/__odx__/generate?service=${name}`
- `/__odx__/mockdata?service=${service}&entitySet=${entitySet}`
- `/__odx__/schema?service=${selectedService.value.name}&raw=true`

## Scope

- Add focused failing tests first for service names and entity-set names that
  contain at least `&`, `#`, spaces, or `?`.
- Encode Explorer internal endpoint query values for schema health checks,
  entity schema fetches, schema explorer fetches, service generation, mock-data
  deletion, and raw metadata link construction.
- Prefer a small local helper if it reduces duplication across Explorer
  composables/components.
- Preserve endpoint paths, query parameter names, request methods, health-state
  behavior, generation stale handling, and mock-data delete behavior.

## Non-Goals

- Do not change server-side internal endpoint contracts or parameter names.
- Do not change public OData proxied entity URLs or query-builder encoding.
- Do not redesign Explorer UI or add visible controls.
- Do not touch proxy, Nuxt module, core package, dependencies, or lockfiles.
- Do not add browser verification unless visible UI behavior changes.

## Acceptance Criteria

- [x] Tests fail before the fix for at least one unencoded service or entity
  value containing a query separator.
- [x] Schema endpoint fetches encode service names in `useODataState.ts`.
- [x] Schema endpoint fetches encode service names in `useSchemaExplorer.ts`.
- [x] Generate endpoint fetches encode service names.
- [x] Mock-data delete requests encode both service and entity-set values.
- [x] Raw metadata links encode the service value while preserving `raw=true`.
- [x] Existing Explorer state tests remain green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use mocked `fetch` and package-local Explorer tests only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches Explorer internal endpoint calls used for
schema, generation, and mock-data operations. Separate review is not required
if the change is limited to client-side query-value encoding with focused tests
and preserves endpoint paths, parameter names, methods, and UI layout.

## Handoff Notes

- changed files:
  - `packages/explorer/composables/useODataState.ts`
  - `packages/explorer/composables/useSchemaExplorer.ts`
  - `packages/explorer/components/tabs/TabServices.vue`
  - `packages/explorer/test/state.test.ts`
  - `.agents/tasks/done/046-encode-explorer-internal-endpoint-params.md`
- summary:
  - Added focused Explorer tests for internal endpoint query values containing
    `&`, `#`, spaces, and `?`.
  - Confirmed the tests failed before the fix for schema health checks,
    generation, and mock-data deletion because raw query values were used.
  - Added shared internal endpoint URL builders and used them for schema
    health checks, entity schema fetches, schema explorer fetches, generation,
    mock-data deletion, and raw metadata link construction.
  - Preserved endpoint paths, query parameter names, request methods,
    health-state behavior, generation stale handling, mock-data delete
    behavior, and visible UI layout.
- tests run:
  - FAIL before fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "encodes"`
    (3 expected encoding failures; direct `useSchemaExplorer()` invocation was
    replaced with shared URL-builder coverage to avoid Nuxt UI setup coupling).
  - PASS after fix: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "encodes|raw metadata"`
    (4 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`
    (31 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer run verify`
    (31 tests passed).
  - PASS: `pnpm.cmd run typecheck`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No listed checks were skipped.
- self-check result:
  - Scope stayed in Explorer internal endpoint URL construction and tests. No
    server endpoint contract, public proxied OData URL, query-builder behavior,
    UI layout, proxy, Nuxt module, core package, dependency, or lockfile change
    was included.
- review requirement decision:
  - Separate review is not required because the change is limited to
    client-side query-value encoding with focused tests and preserves endpoint
    paths, parameter names, methods, and UI layout.
- task state movement:
  - Moved this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Left unchanged because task 047 is concurrently in progress and owns the
    next-action workflow update.
- commit hash:
  - pending commit.
- known gaps:
  - No browser verification was run because visible UI behavior did not change.
