# Task: Introduce ODX log store and redaction

Status: ready
Owner: unassigned
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
- `.agents/tasks/ready/077-harden-production-explorer-endpoints-and-config.md`
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

- [ ] Existing local Explorer traffic logs still work with the memory store.
- [ ] Sensitive headers such as authorization, cookie, set-cookie, API keys,
  SAP session tokens, and CSRF tokens are redacted before storage.
- [ ] Large request/response bodies are bounded or omitted according to a
  documented policy.
- [ ] Store operations are covered by focused tests.
- [ ] Public/core exports remain intentional and documented.

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
