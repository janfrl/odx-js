# Task: Reject non-http BTP destination URLs

Status: done
Owner: Codex Implementer
Created: 2026-05-05
Risk: high
Review: required

## Objective

Fail clearly when SAP BTP Destination Service returns a non-HTTP(S) backend URL
for production destination resolution.

## Context

Task 032 made missing or blank `destinationConfiguration.URL` fail before an
unusable destination is cached. The next narrow correctness gap is malformed
but non-empty URLs, such as `javascript:...`, `file:...`, or arbitrary text.
Production BTP resolution should only accept absolute HTTP(S) backend targets.

Relevant docs and files:

- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `packages/proxy/src/utils/btp-destination.ts`
- `packages/proxy/test/btp-destination.test.ts`
- `.agents/tasks/done/032-validate-btp-destination-url.md`
- `.agents/reviews/032-validate-btp-destination-url-review.md`

## Scope

- Add focused tests in `packages/proxy/test/btp-destination.test.ts` for
  production Destination service payloads whose `destinationConfiguration.URL`
  is non-empty but not an absolute `http:` or `https:` URL.
- Make `resolveBtpDestination` reject those payloads with a meaningful error
  that names the destination and invalid URL condition.
- Preserve development fallback behavior if Destination service fetch or
  validation fails outside production.
- Keep existing cache key hashing, cache TTL, connectivity handling, auth token
  exchange, and successful HTTP(S) destination behavior unchanged.

## Non-Goals

- Do not make BTP destination cache TTL configurable.
- Do not add allowlists, blocklists, tenant policy, or destination-level
  authorization rules.
- Do not change proxy request handling, Explorer UI, or Nuxt module config.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Tests cover at least two malformed non-empty destination URL cases.
- [ ] Production destination resolution rejects non-HTTP(S) URLs before caching.
- [ ] Error text clearly identifies an invalid destination URL.
- [ ] Existing BTP destination tests remain green.
- [ ] Separate review is requested after implementation.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local mocked `VCAP_SERVICES` and mocked `ofetch` only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this touches BTP destination resolution, a deployment and
external-integration boundary called out by `SECURITY.md`. Separate review is
required by `.agents/WORKFLOW.md`.

## Handoff Notes

Implemented 2026-05-05 by Codex Implementer.

- changed files:
  - `packages/proxy/src/utils/btp-destination.ts`
  - `packages/proxy/test/btp-destination.test.ts`
  - `.agents/tasks/done/037-reject-non-http-btp-destination-url.md`
  - `.agents/NEXT.md`
- failing-test evidence before implementation fix:
  - Added production tests for `javascript:alert(1)` and `not a url`
    Destination service payloads before changing runtime code.
  - First executable focused run:
    `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
    failed as expected with 18 tests run, 16 passed, 2 failed.
  - Failing cases:
    - `throws in production when Destination Service returns a javascript destination URL`
    - `throws in production when Destination Service returns arbitrary text as the destination URL`
  - Both failures proved `resolveBtpDestination()` resolved non-HTTP(S)
    destination objects instead of rejecting them.
- summary:
  - Added focused production coverage for non-empty non-HTTP(S) destination
    URLs from SAP BTP Destination Service payloads.
  - Added explicit local development fallback coverage for the new
    non-HTTP(S) validation path.
  - Added regression coverage that an invalid production destination URL is
    not cached by resolving the same service successfully after a valid
    follow-up Destination Service payload.
  - Added validation before resolved destinations are created or cached:
    `destinationConfiguration.URL` must parse as an absolute `http:` or
    `https:` URL.
  - Preserved existing cache key hashing, cache TTL, connectivity handling,
    auth token exchange, local fallback behavior, and successful HTTP(S)
    behavior.
  - Did not change proxy request handling, Explorer UI, Nuxt config,
    dependencies, lockfiles, or docs.
- tests run:
  - Initial sandboxed `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
    could not start because Corepack pnpm cache access under the user profile
    was blocked by sandbox permissions.
  - FAIL as expected before fix, with elevated pnpm access:
    `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
    (18 tests run, 16 passed, 2 failed).
  - PASS after fix:
    `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
    (18 tests passed).
  - PASS after adding development fallback coverage:
    `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
    (19 tests passed).
  - PASS after adding invalid-cache regression coverage:
    `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
    (20 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify`
    (62 tests passed, 1 skipped, proxy standalone example passed).
  - PASS: `pnpm.cmd run typecheck`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No listed checks were skipped.
  - Residual risk is limited to real SAP BTP Destination service response
    variants not represented by local mocks.
- self-check result:
  - Scope stayed limited to the assigned proxy utility, its tests, task state,
    and next-action handoff.
  - Acceptance criteria are met.
  - Non-HTTP(S) production payloads are rejected before caching because
    validation happens before `resolvedDestination` construction and
    `cacheDestination()`.
  - No raw bearer tokens were added to cache keys or logs.
  - No real credentials, tenant endpoints, or external SAP/BTP services were
    used.
  - Unrelated Explorer worktree changes were not modified or staged.
- review requirement decision:
  - Separate security-focused review is required by the task, `.agents/WORKFLOW.md`,
    and `SECURITY.md` because the change touches BTP destination resolution.
- task state movement:
  - Moved to `.agents/tasks/done/037-reject-non-http-btp-destination-url.md`.
- `.agents/NEXT.md` update:
  - Updated to point at a fresh Reviewer prompt for this task.
- commit hash:
  - See final implementer summary; amending this file changes the commit hash.
- known gaps:
  - None beyond the residual risk noted above.
