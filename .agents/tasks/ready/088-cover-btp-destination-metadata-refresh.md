# Task: Cover BTP destination metadata refresh

Status: ready
Owner: unassigned
Created: 2026-05-08
Risk: high
Review: required

## Objective

Add focused local coverage for production runtime metadata refresh through BTP
Destination resolution so the deployed Explorer path is verified without a live
SAP BTP environment.

## Context

Task 080 made production `/__odx__/generate` refresh runtime metadata through
the production-compatible target resolution path. Its review approved the direct
service auth fix, but left a test gap: a production destination/auth/header
scenario with a mocked BTP destination response, including stale fallback when
destination resolution fails.

Relevant files:

- `.agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `packages/proxy/src/utils/metadata-refresh.ts`
- `packages/proxy/src/utils/target.ts`
- `packages/proxy/src/utils/btp-destination.ts`
- `packages/proxy/src/api/generate.ts`
- `packages/proxy/test/explorer-policy.test.ts`
- `packages/proxy/test/btp-destination.test.ts`

## Scope

Include:

- Add deterministic tests for a production destination-backed service invoking
  `/__odx__/generate?service=<name>`.
- Verify the refresh request uses the resolved destination URL and destination
  auth semantics instead of falling back to service/global configured auth.
- Verify useful headers such as `Accept: application/xml, text/xml, */*` are
  sent while restricted or sensitive incoming headers remain governed by the
  existing proxy header preparation rules.
- Verify stale-cache fallback when destination resolution or metadata fetch
  fails, without invoking SDK generation in production.
- Keep the tests local by mocking BTP bindings, destination responses, and/or
  metadata servers.

## Non-Goals

- Do not require a live SAP BTP account, Destination service, Connectivity
  service, XSUAA tenant, or customer backend.
- Do not redesign BTP destination resolution.
- Do not change direct-service metadata refresh behavior except to preserve
  existing tested semantics.
- Do not document new operator guidance unless implementation changes a
  durable contract.

## Acceptance Criteria

- [ ] A production destination-backed metadata refresh test proves `$metadata`
      is fetched from the resolved destination target.
- [ ] The test proves destination-provided auth wins and service/global auth is
      not leaked into the metadata refresh request.
- [ ] A production stale-cache fallback test covers destination or metadata
      failure and confirms the response remains metadata refresh only.
- [ ] Tests do not depend on live BTP services or external network access.
- [ ] Existing BTP destination and Explorer policy tests remain green.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`
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

High risk because this verifies and may expose defects in production metadata
refresh, BTP destination auth, header handling, and stale-cache behavior.
Separate review is required if any runtime code changes, and remains preferred
even for test-only coverage because the covered behavior is deployment
sensitive.

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
