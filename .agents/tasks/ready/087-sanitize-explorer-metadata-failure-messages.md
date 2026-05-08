# Task: Sanitize Explorer metadata failure messages

Status: ready
Owner: unassigned
Created: 2026-05-08
Risk: high
Review: required

## Objective

Ensure production Explorer metadata refresh, schema, and config responses never
expose backend metadata URLs, hostnames, or deployment paths through failure
messages or legacy metadata cache state.

## Context

Tasks 080 and 081 separated production metadata refresh from SDK generation and
moved schema/config reads onto runtime metadata cache state. The task 081 review
fixed one stale-cache fallback path, but its residual risk notes that legacy
metadata state files created before the fix could still contain raw stale
reasons until another refresh rewrites them. The no-cache refresh failure path
also still needs focused verification so `/__odx__/generate` does not return a
raw metadata URL in production error responses.

Relevant files:

- `.agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md`
- `.agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md`
- `SECURITY.md`
- `API.md`
- `packages/proxy/src/utils/metadata-refresh.ts`
- `packages/proxy/src/api/generate.ts`
- `packages/proxy/src/api/config.ts`
- `packages/proxy/src/api/schema.ts`
- `packages/proxy/test/explorer-policy.test.ts`

## Scope

Include:

- Sanitize metadata failure reasons before they are exposed by production
  Explorer runtime responses, including `/__odx__/generate` errors without a
  cache fallback.
- Sanitize stale reasons read from existing runtime metadata sidecar files
  before `/__odx__/config` or `/__odx__/schema` serialize them.
- Preserve actionable status-code reasons such as `Status: 503`.
- Add focused production tests that prove internal metadata URLs and hostnames
  are absent from generate/config/schema responses.
- Keep the fix in the proxy metadata/runtime API boundary.

## Non-Goals

- Do not change metadata cache file names or introduce a migration command.
- Do not change TypeScript SDK generation behavior.
- Do not change normal OData proxy responses.
- Do not add a live SAP BTP smoke test.
- Do not change Explorer UI copy unless a test requires a response shape
  compatibility fix.

## Acceptance Criteria

- [ ] Production `/__odx__/generate` failures without a cache fallback do not
      expose backend metadata URLs, hostnames, or local runtime paths.
- [ ] Production `/__odx__/config` and `/__odx__/schema` sanitize stale reasons
      loaded from legacy metadata state sidecar files.
- [ ] Status-code stale reasons remain visible enough to be actionable.
- [ ] Focused tests cover no-cache refresh failure and legacy sidecar stale
      reason exposure.
- [ ] Existing production metadata refresh and stale-cache fallback behavior
      remains intact.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Checkpoint or broad checks, if required:

- none

Setup/data prerequisites:

- none

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this touches production Explorer runtime API error exposure
and metadata cache privacy. Separate review is required under the workflow
review policy for security/privacy and production runtime API behavior.

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
