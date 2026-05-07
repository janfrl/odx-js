# Task: Use runtime metadata cache for schema and config

Status: ready
Owner: unassigned
Created: 2026-05-07
Risk: high
Review: required

## Objective

Make `/__odx__/schema` and `/__odx__/config` read schema information from the
runtime metadata cache instead of relying on `.nuxt` generated files or ad hoc
filesystem writes.

## Context

The deployed Explorer needs schema and service health views to work after
deployment. Runtime schema reads should use the metadata refresh/cache
boundary, not `.nuxt/odx/temp` as a production write location.

Relevant files:

- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
- `packages/proxy/src/api/config.ts`
- `packages/proxy/src/api/schema.ts`
- `packages/proxy/src/api/types.ts`
- `packages/core/src/server/*`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/composables/useSchemaExplorer.ts`
- `packages/explorer/test/state.test.ts`

## Scope

- Read parsed schema/config entity information from the runtime metadata cache.
- Keep local EDMX file support for development and fixtures.
- Avoid writing to `.nuxt` from production schema/config endpoints.
- Make stale/missing metadata states explicit in API responses.
- Keep `/__odx__/types` development/build-artifact semantics clear, or hide it
  from production config if generated types are unavailable.
- Add tests for cached metadata, stale metadata, missing metadata, and local
  EDMX behavior.

## Non-Goals

- Do not implement db0 log storage.
- Do not regenerate SDK/types in production.
- Do not change normal OData proxy responses.
- Do not add broad Explorer UI redesign.

## Acceptance Criteria

- [ ] Schema endpoint works from runtime metadata cache in production mode.
- [ ] Config endpoint reports sanitized entity/schema state from the same cache.
- [ ] Production schema/config endpoints do not require `.nuxt/odx/temp` writes.
- [ ] Missing or stale metadata returns actionable status for Explorer.
- [ ] Generated types are clearly treated as development/build artifacts.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this changes internal runtime APIs, metadata cache behavior,
and production schema visibility. Secure Teamflow is required. Separate review
is required.

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
