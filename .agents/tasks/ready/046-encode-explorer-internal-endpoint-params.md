# Task: Encode Explorer internal endpoint params

Status: ready
Owner: unassigned
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

- [ ] Tests fail before the fix for at least one unencoded service or entity
  value containing a query separator.
- [ ] Schema endpoint fetches encode service names in `useODataState.ts`.
- [ ] Schema endpoint fetches encode service names in `useSchemaExplorer.ts`.
- [ ] Generate endpoint fetches encode service names.
- [ ] Mock-data delete requests encode both service and entity-set values.
- [ ] Raw metadata links encode the service value while preserving `raw=true`.
- [ ] Existing Explorer state tests remain green.

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
