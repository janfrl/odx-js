# Task: Separate runtime metadata refresh from SDK generation

Status: ready
Owner: unassigned
Created: 2026-05-07
Risk: high
Review: required

## Objective

Split production metadata refresh from development TypeScript SDK generation so
the deployed Explorer can refresh schemas without running code generation in
the Nitro runtime.

## Context

The current `/__odx__/generate` endpoint refreshes or reads metadata and then
calls the Nuxt type generator when the host provides one. That is useful in
development, but deployed runtime schema refresh should update metadata cache
state only. TypeScript SDK generation remains a build, dev, or CI workflow.

Relevant files:

- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `.agents/tasks/ready/077-harden-production-explorer-endpoints-and-config.md`
- `ARCHITECTURE.md`
- `API.md`
- `DEPLOYMENT.md`
- `SECURITY.md`
- `packages/nuxt/src/generate.ts`
- `packages/nuxt/src/runtime/server-middleware.ts`
- `packages/proxy/src/api/generate.ts`
- `packages/proxy/src/api/schema.ts`
- `packages/proxy/src/plugins/btp-auth.ts`
- `packages/proxy/src/utils/btp-destination.ts`
- `packages/proxy/src/utils/target.ts`
- `packages/explorer/composables/useODataState.ts`

## Scope

- Introduce a runtime metadata refresh operation that fetches `$metadata` and
  updates metadata cache state without running `odata2ts`.
- Keep development SDK regeneration available when the Nuxt generator is
  present.
- Make production behavior return clear metadata-refresh semantics rather than
  `SDK Generation not supported by host`.
- Use the same target/auth/header/TLS behavior expected for normal OData proxy
  access.
- Preserve stale-cache fallback behavior where a previous metadata document is
  available.
- Add focused tests for dev generation, production metadata refresh, and
  unsupported generation cases.

## Non-Goals

- Do not add db0 in this task unless task 079 has already introduced the
  storage dependency and this task only consumes its metadata-cache boundary.
- Do not regenerate TypeScript files in production.
- Do not redesign Explorer UI beyond response compatibility needed by tests.
- Do not change normal data proxy behavior.

## Acceptance Criteria

- [ ] Production can refresh metadata without invoking `odata2ts`.
- [ ] Development can still regenerate SDK/types for a service.
- [ ] Refresh results include clear status, stale state, and timestamp/hash
  information.
- [ ] Metadata fetching uses production-compatible service resolution.
- [ ] Docs distinguish Refresh Metadata from Regenerate SDK.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd exec vitest run packages/nuxt/test/generate.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/nuxt run playground:check`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this changes runtime metadata behavior, production endpoint
semantics, and generation boundaries. Secure Teamflow is required. Separate
review is required.

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
