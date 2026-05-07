# Task: Harden production Explorer endpoints and config

Status: done
Owner: Codex
Created: 2026-05-07
Risk: high
Review: required

## Objective

Make the `/__odx__` Explorer API surface explicit and safe enough to support a
deployed standalone Explorer before adding persistent logs or metadata refresh.

## Context

The Explorer UI is used both as a Nuxt DevTools iframe in development and as a
standalone app in BTP. The deployed standalone app needs runtime APIs, but
those APIs must not leak secrets or expose operational actions without policy.

Relevant files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `packages/core/src/types.ts`
- `packages/nuxt/src/config.ts`
- `packages/proxy/src/nitro.ts`
- `packages/proxy/src/api/config.ts`
- `packages/proxy/src/api/logs.ts`
- `packages/proxy/src/api/generate.ts`
- `packages/proxy/src/api/schema.ts`
- `packages/proxy/src/api/types.ts`
- `packages/proxy/src/api/me.ts`
- `packages/proxy/src/plugins/auth-btp.ts`
- `packages/explorer/composables/useODataState.ts`

## Scope

- Add or refine an explicit Explorer runtime policy/config shape for internal
  `/__odx__` endpoints.
- Ensure production `/__odx__` endpoints are authenticated and have a clear
  authorization policy before they return operational data.
- Sanitize `/__odx__/config` responses so production responses do not expose
  secrets, service auth, outbound headers, raw rules, or other sensitive
  deployment details.
- Preserve local development ergonomics for the embedded DevTools Explorer.
- Add focused tests for production config redaction and endpoint policy.
- Update root docs where the production Explorer API contract changes.

## Non-Goals

- Do not add db0, evlog, or any persistence dependency in this task.
- Do not implement metadata refresh or change TypeScript SDK generation.
- Do not redesign Explorer UI.
- Do not change OData proxy behavior under the configured public `basePath`.
- Do not expose new public APIs outside the internal Explorer surface.

## Acceptance Criteria

- [x] Production `/__odx__/config` returns only sanitized service information.
- [x] Tests prove auth, headers, rules, and other sensitive fields are not
  exposed in production config responses.
- [x] Local development Explorer behavior is preserved.
- [x] The internal Explorer endpoint contract is documented.
- [x] Independent review is requested before continuing to persistence work.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

Deployment-sensitive checks, if implementation touches app router or MTA config:

- `pnpm.cmd --filter odx-approuter run verify`

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this changes auth, privacy, and internal production API
contracts. Secure Teamflow is required. Separate review is required.

## Handoff Notes

- changed files: `ARCHITECTURE.md`, `API.md`, `SECURITY.md`,
  `DEPLOYMENT.md`, `packages/core/src/types.ts`,
  `packages/proxy/src/utils/explorer-policy.ts`,
  `packages/proxy/src/api/config.ts`, `packages/proxy/src/api/logs.ts`,
  `packages/proxy/src/api/generate.ts`, `packages/proxy/src/api/schema.ts`,
  `packages/proxy/src/api/types.ts`, `packages/proxy/src/api/me.ts`,
  `packages/proxy/test/explorer-policy.test.ts`,
  `packages/explorer/composables/useODataState.ts`,
  `packages/explorer/test/state.test.ts`,
  `packages/approuter/xs-app.json`, and
  `packages/approuter/test/deployment-config.test.ts`.
- summary: Added a proxy-owned production Explorer endpoint policy, requiring
  production SAP security context for `/__odx__/*`; made production
  `/__odx__/config` whitelist sanitized service fields only; disabled
  production generation/types endpoints; blocked production raw schema XML and
  live schema fetches; made production logs return `[]` and reject clearing;
  sanitized production `/__odx__/me`; added the authenticated AppRouter
  `/__odx__/*` route; documented the internal endpoint contract.
- tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test`
  - `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - `pnpm.cmd --filter @bc8-odx/explorer run verify`
  - `pnpm.cmd --filter odx-approuter run verify`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run typecheck`
  - `git diff --check`
- skipped checks and residual risk: None. Some commands required elevated
  execution because sandboxed Windows process spawning returned `EPERM` for
  Vitest/esbuild; reruns passed.
- self-check result: Scope matches task 077 and architect memo. No db0, evlog,
  persistence, metadata refresh, SDK generation behavior changes, Explorer UI
  redesign, or public basePath proxy behavior changes were added.
- review requirement decision: Separate review is required because this changes
  auth, privacy, production configuration, deployment routing, and internal HTTP
  contracts.
- task state movement: Moved from `ready/` to `in-progress/` to `done/`.
- `.agents/NEXT.md` update: Updated to a Reviewer prompt for this task.
- commit hash: pending commit.
- known gaps: Production traffic history remains intentionally disabled until
  the later persistent log/redaction tasks define storage and retention policy.
