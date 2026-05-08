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

- changed files:
  - `packages/core/src/server.ts`
  - `packages/core/src/types.ts`
  - `packages/proxy/src/api/config.ts`
  - `packages/proxy/src/api/schema.ts`
  - `packages/proxy/src/utils/metadata-refresh.ts`
  - `packages/proxy/test/explorer-policy.test.ts`
  - `packages/explorer/composables/useODataState.ts`
  - `packages/explorer/composables/useSchemaExplorer.ts`
  - `packages/explorer/test/state.test.ts`
  - `.agents/NEXT.md`
  - `.agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md`
- summary:
  - Added content-based EDMX parser helpers so runtime schema reads can parse cached XML without creating temporary files.
  - Added runtime metadata cache snapshot/state helpers and sidecar state writes for refresh results.
  - Reworked `/__odx__/schema` and `/__odx__/config` to read entity/version/status information from local EDMX files or the runtime metadata cache instead of generated SDK files or production `.nuxt` writes.
  - Added explicit `available`, `stale`, and `missing` metadata status payloads for schema/config responses.
  - Kept `/__odx__/types` production blocking and development/build artifact semantics unchanged.
  - Updated Explorer state health handling so stale cached metadata is shown as degraded and missing metadata can surface as offline.
- tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` - pass outside sandbox.
  - `pnpm.cmd exec vitest run packages/explorer/test/state.test.ts` - initial direct root invocation failed with an existing Nuxt package-resolution issue; package-level Explorer verify was used instead.
  - `pnpm.cmd exec vitest run packages/proxy/test` - pass outside sandbox; 11 files, 157 passed, 1 skipped.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass outside sandbox.
  - `pnpm.cmd --filter @bc8-odx/explorer run verify` - pass outside sandbox after fixing the focused stale-health test.
  - `pnpm.cmd run lint` - pass outside sandbox.
  - `pnpm.cmd run typecheck` - pass outside sandbox.
  - `git diff --check` - pass.
- skipped checks and residual risk:
  - No required checks skipped.
  - No live SAP BTP destination, XSUAA, Connectivity, or customer backend smoke test was performed.
- self-check result:
  - Scope matches task 081.
  - Normal OData proxy response paths were not changed.
  - No db0, evlog, or broad Explorer UI redesign was added.
  - Production schema/config reads no longer require generated SDK imports or ad hoc production `.nuxt` writes.
  - Local EDMX file behavior remains covered.
- review requirement decision:
  - Separate review required because task 081 is high risk and changes production Explorer runtime API/schema visibility behavior.
- task state movement:
  - Move this task from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Updated to request a fresh Reviewer for completed task 081 before continuing to task 082.
- commit hash:
  - Recorded in the final Implementer response after the task commit is created.
- known gaps:
  - Metadata staleness is based on persisted refresh state when available; existing legacy cache files without sidecar state are treated as available cache entries.

## Integration Fix Notes

- addressed review finding:
  - Sanitized runtime metadata fallback stale reasons before persisting cache
    state so production `/__odx__/config` and `/__odx__/schema` keep stale
    status without exposing backend metadata URLs or hostnames.
  - Preserved actionable stale status and status-code reasons such as
    `Status: 503`.
  - Added a regression test for invalid metadata fetched through an internal
    metadata URL followed by cache fallback, then verified production config and
    schema responses do not serialize that URL or hostname.
- verification:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
    pass outside sandbox; 1 file, 17 tests.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass outside sandbox; 11
    proxy test files passed, 158 tests passed, 1 skipped, standalone proxy
    example passed.
  - `pnpm.cmd run lint` - pass.
  - `pnpm.cmd run typecheck` - pass.
  - `git diff --check` - pass with Git line-ending warnings only.
- review requirement:
  - Focused re-review is required because the original task is high risk and
    the fix changes production Explorer runtime metadata error exposure.
