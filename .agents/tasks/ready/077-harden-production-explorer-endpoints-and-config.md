# Task: Harden production Explorer endpoints and config

Status: ready
Owner: unassigned
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

- [ ] Production `/__odx__/config` returns only sanitized service information.
- [ ] Tests prove auth, headers, rules, and other sensitive fields are not
  exposed in production config responses.
- [ ] Local development Explorer behavior is preserved.
- [ ] The internal Explorer endpoint contract is documented.
- [ ] Independent review is requested before continuing to persistence work.

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
