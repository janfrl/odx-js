# Task: Separate runtime metadata refresh from SDK generation

Status: done
Owner: Codex
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

- [x] Production can refresh metadata without invoking `odata2ts`.
- [x] Development can still regenerate SDK/types for a service.
- [x] Refresh results include clear status, stale state, and timestamp/hash
  information.
- [x] Metadata fetching uses production-compatible service resolution.
- [x] Docs distinguish Refresh Metadata from Regenerate SDK.

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

- changed files: `ARCHITECTURE.md`, `API.md`, `DEPLOYMENT.md`,
  `SECURITY.md`, `packages/proxy/src/api/generate.ts`,
  `packages/proxy/src/utils/explorer-policy.ts`,
  `packages/proxy/src/utils/metadata-refresh.ts`,
  `packages/proxy/test/explorer-policy.test.ts`, `.agents/NEXT.md`, and this
  task file.
- summary: Split runtime metadata refresh into a proxy-owned
  `refreshRuntimeMetadata` utility and changed `/__odx__/generate` so
  production refreshes metadata cache state only. Production responses now use
  `operation: "metadata-refresh"`, `generated: false`, stale state,
  timestamp, hash, byte count, and metadata source fields, and they never call
  the injected Nuxt generator. Development still refreshes metadata first and
  then invokes the Nuxt generator when present, returning
  `operation: "sdk-generation"`. Non-production hosts without a generator keep
  returning `501`.
- tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
  - `pnpm.cmd exec vitest run packages/proxy/test`
  - `pnpm.cmd exec vitest run packages/nuxt/test/generate.test.ts`
  - `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - `pnpm.cmd --filter @bc8-odx/nuxt run playground:check`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run typecheck`
  - `git diff --check`
- skipped checks and residual risk: No requested check was skipped. Initial
  sandboxed `pnpm.cmd exec vitest ...` commands could not resolve `vitest`,
  sandboxed proxy verify hit Windows `spawn EPERM`, and sandboxed Nuxt
  playground check was denied while unlinking generated `.nuxt` files. The
  same commands passed when rerun outside the sandbox with approval. No live
  SAP BTP Destination, Connectivity, XSUAA, or customer backend smoke test was
  performed.
- self-check result: Scope stayed on task 080. No db0, evlog, Explorer UI
  redesign, normal data proxy behavior change, or production TypeScript
  generation was added. Runtime metadata fetching reuses proxy target
  resolution plus service/global headers, configured auth, incoming headers,
  and configured TLS rejection behavior. Stale cache fallback is preserved.
- review requirement decision: Separate review is required because this changes
  production internal endpoint behavior, metadata cache policy, auth/header/TLS
  handling for refresh, and generation boundaries.
- task state movement: `Move-Item` and `Copy-Item` from `ready/` to
  `in-progress/` were blocked by Windows access denied. The task was moved to
  `done/` through patches after implementation and verification.
- `.agents/NEXT.md` update: Updated to request a fresh Reviewer for task 080
  before continuing to task 081.
- commit hash: `464ae4c1764bc8cd1272b5753b5f985880dbfa46`.
- known gaps: Runtime metadata refresh is covered by local HTTP tests and file
  cache assertions, but not by a live SAP BTP Destination/Connectivity smoke
  test. The Explorer UI still uses the existing `generateService` action name;
  response semantics and docs now distinguish metadata refresh from SDK
  regeneration.

## Integration Notes

- focused review finding addressed: Production metadata refresh now preserves
  direct-service auth semantics by avoiding service/global configured
  Authorization fallback when the resolved proxy target has
  `strategy: "direct"` and no managed auth header. This keeps direct absolute
  URL refresh behavior aligned with normal direct proxy target resolution.
- regression coverage added: `packages/proxy/test/explorer-policy.test.ts`
  now covers a production direct absolute-url service with both global and
  service auth configured and asserts the `$metadata` request does not send the
  configured Authorization header.
- production SDK-generation separation remains intact: production
  `/__odx__/generate` still returns `operation: "metadata-refresh"`, does not
  invoke the injected Nuxt generator, and does not write generated TypeScript
  SDK files.
- integration verification:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
  - `pnpm.cmd exec vitest run packages/proxy/test`
  - `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - `git diff --check`
- focused re-review required: Yes, because task 080 is high-risk production
  runtime auth behavior and the original review decision was needs changes.
