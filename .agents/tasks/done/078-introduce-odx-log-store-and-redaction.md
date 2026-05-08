# Task: Introduce ODX log store and redaction

Status: done
Owner: Codex
Created: 2026-05-07
Risk: high
Review: required

## Objective

Replace direct in-memory traffic log access with a small ODX log storage
interface and a redaction model, while preserving the current memory-backed
development behavior.

## Context

Persistent Explorer logs should not be added until ODX has a narrow storage
boundary and a safe payload model. The current in-memory log utilities live in
`@bc8-odx/core` and can include request headers, request bodies, response
bodies, and traces.

Relevant files:

- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md`
- `SECURITY.md`
- `packages/core/src/dev-logs.ts`
- `packages/core/src/index.ts`
- `packages/proxy/src/utils/trace.ts`
- `packages/proxy/src/api/logs.ts`
- `packages/proxy/src/api/odata.ts`
- `packages/proxy/test/integration.test.ts`
- `packages/proxy/test/rules.test.ts`
- `packages/proxy/test/performance.test.ts`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/test/state.test.ts`

## Scope

- Define an `OdxLogStore`-style interface for append, update, list, get, clear,
  and retention-friendly queries.
- Keep a memory implementation as the default for development and tests.
- Add redaction utilities for sensitive headers and bounded payload storage.
- Ensure disabled DevTools/production defaults do not persist payload logs
  unless explicitly enabled by policy.
- Preserve existing Explorer logs behavior in local development.
- Add tests for redaction, store behavior, and compatibility with existing
  proxy trace updates.

## Non-Goals

- Do not add db0 in this task.
- Do not add evlog.
- Do not change schema refresh or TypeScript SDK generation.
- Do not add a production database migration.
- Do not redesign Explorer logs UI.

## Acceptance Criteria

- [x] Existing local Explorer traffic logs still work with the memory store.
- [x] Sensitive headers such as authorization, cookie, set-cookie, API keys,
  SAP session tokens, and CSRF tokens are redacted before storage.
- [x] Large request/response bodies are bounded or omitted according to a
  documented policy.
- [x] Store operations are covered by focused tests.
- [x] Public/core exports remain intentional and documented.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this touches request/response logging, sensitive data
handling, and shared runtime contracts. Secure Teamflow is required. Separate
review is required.

## Handoff Notes

- changed files: `ARCHITECTURE.md`, `API.md`, `SECURITY.md`,
  `DEPLOYMENT.md`, `packages/core/src/dev-logs.ts`,
  `packages/core/src/types.ts`, `packages/nuxt/src/config.ts`,
  `packages/nuxt/src/module.ts`, `packages/proxy/src/api/logs.ts`,
  `packages/proxy/src/api/odata.ts`, `packages/proxy/src/index.ts`,
  `packages/proxy/src/utils/trace.ts`,
  `packages/proxy/test/dev-logs.test.ts`,
  `packages/proxy/test/explorer-policy.test.ts`,
  `packages/proxy/test/integration.test.ts`,
  `packages/proxy/test/rules.test.ts`, `.agents/NEXT.md`, and this task file.
- summary: Introduced the core `OdxLogStore` boundary, async-compatible store
  method contracts, default `OdxMemoryLogStore`, store replacement helpers,
  redaction helpers, bounded payload sanitization, and retention-friendly
  query/clear options. Proxy tracing now writes through the store boundary,
  redacts sensitive request headers before storage, bounds request/response
  bodies, supports `devtools.logPayloads` and `devtools.maxPayloadBytes`, and
  preserves hook-updated request header logging. The `/__odx__/logs`
  development endpoint now passes query and bounded clear options to the store.
  Production `/__odx__/logs` remains disabled and does not expose or clear
  stored traffic history.
- tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/dev-logs.test.ts packages/proxy/test/rules.test.ts packages/proxy/test/explorer-policy.test.ts packages/proxy/test/integration.test.ts`
  - `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
  - `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts`
  - `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - `pnpm.cmd --filter @bc8-odx/explorer run verify`
  - `pnpm.cmd --filter @bc8-odx/core run verify`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run typecheck`
  - `git diff --check`
- skipped checks and residual risk: No task-listed checks were skipped. Initial
  sandboxed `pnpm.cmd exec vitest ...` could not resolve `vitest`, and
  sandboxed package verify runs hit Windows `spawn EPERM` while starting
  esbuild; the same commands passed when rerun outside the sandbox with
  approval. No live SAP BTP/AppRouter smoke test was performed because task 078
  does not change AppRouter or deployment routing.
- self-check result: Scope stayed on task 078. No db0, evlog, metadata
  refresh, SDK generation, database migration, or Explorer UI redesign was
  added. Existing local Explorer traffic-log ergonomics are preserved through
  the memory store and compatibility helper exports.
- review requirement decision: Separate review is required because this changes
  request/response logging, redaction, payload retention, production log policy
  behavior, shared core exports, and internal Explorer endpoint behavior.
- task state movement: Attempted `Move-Item` from `ready/` to `in-progress/`,
  but Windows returned access denied. The task was moved from `ready/` to
  `done/` through the final patch after implementation and verification.
- `.agents/NEXT.md` update: Updated to request a fresh Reviewer for this
  completed high-risk task before continuing to task 079.
- commit hash: `c9ef7aa865ad2c6147af8581bb19dbd054bcbeeb`.
- known gaps: Production traffic history remains intentionally disabled.
  Persistent storage, db0 adapter wiring, production retention configuration,
  and production clear semantics remain task 079 or later work.
