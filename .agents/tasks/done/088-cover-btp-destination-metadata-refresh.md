# Task: Cover BTP destination metadata refresh

Status: done
Owner: Codex
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

- [x] A production destination-backed metadata refresh test proves `$metadata`
      is fetched from the resolved destination target.
- [x] The test proves destination-provided auth wins and service/global auth is
      not leaked into the metadata refresh request.
- [x] A production stale-cache fallback test covers destination or metadata
      failure and confirms the response remains metadata refresh only.
- [x] Tests do not depend on live BTP services or external network access.
- [x] Existing BTP destination and Explorer policy tests remain green.

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

- Changed files:
  - `packages/proxy/test/explorer-policy.test.ts`
  - `packages/proxy/src/utils/metadata-refresh.ts`
  - `packages/proxy/src/utils/target.ts`
  - `.agents/tasks/done/088-cover-btp-destination-metadata-refresh.md`
  - `.agents/NEXT.md`
- Summary:
  - Added deterministic local production Explorer metadata refresh coverage for
    a destination-backed service using local fixture servers for XSUAA,
    Destination service, and the destination OData metadata backend.
  - Verified `$metadata` is fetched from the resolved destination URL, the
    destination-provided bearer token overrides incoming/service/global auth,
    useful metadata headers are sent, and restricted proxy headers stay under
    `prepareProxyHeaders`.
  - Added stale-cache coverage for destination-backed metadata fetch failure and
    BTP destination resolution failure, with production responses remaining
    `operation: "metadata-refresh"` and `generated: false`.
  - Fixed a narrow metadata-refresh defect: runtime metadata refresh now opts
    out of the target resolver's local BTP fallback so destination resolution
    failures reach stale-cache fallback with the BTP failure reason instead of
    being hidden behind a local `/sap/opu/odata/sap` 404.
- Pre-fix failing result:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`
    failed after adding the destination-resolution stale-cache test because
    `staleReason` was `Status: 404 Cannot find any path matching
    [metadata-path]` instead of the BTP destination failure. This passed after
    the focused fix.
- Tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`
    - pass outside sandbox, 2 files, 43 tests.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass outside sandbox, 11
    files, 167 passed, 1 skipped, plus proxy standalone example.
  - `pnpm.cmd run lint` - pass.
  - `pnpm.cmd run typecheck` - pass.
  - `git diff --check` - pass, with Git CRLF working-copy warnings only.
- Skipped checks and residual risk:
  - No checks skipped.
  - No live SAP BTP Destination, Connectivity, XSUAA tenant, or customer
    backend smoke test was performed; coverage uses deterministic local
    fixtures as required.
- Self-check result:
  - Scope matches task 088. No Explorer UI, direct-service behavior, dependency,
    lockfile, generated file, or durable documentation changes were made.
  - Existing direct-service metadata refresh semantics remain covered and
    unchanged.
  - Security-sensitive auth/header behavior is covered by focused assertions.
- Review requirement decision:
  - Separate review is required because this is high-risk task 088 and the fix
    touches production BTP destination resolution behavior for runtime metadata
    refresh.
- Task state movement:
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start.
  - Moved to `.agents/tasks/done/` after implementation and verification.
- `.agents/NEXT.md` update:
  - Updated to request a fresh Reviewer for task 088.
- Commit hash:
  - Pending final commit; report the completed commit hash in the final
    response.
- Known gaps:
  - On-premise Connectivity proxy behavior remains out of scope for task 088.
  - No live BTP smoke test was run.
