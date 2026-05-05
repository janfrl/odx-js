# Task: Validate BTP destination URL

Status: done
Owner: Codex Implementer
Created: 2026-05-05
Risk: high
Review: required

## Objective

Add focused coverage for malformed BTP destination payloads and make
destination resolution fail clearly when the Destination service returns no
usable backend URL.

## Context

`resolveBtpDestination` builds the backend target from
`destinationConfiguration.URL`. A malformed or incomplete Destination service
response should not silently produce an unusable destination object, especially
in production BTP deployments where the proxy boundary depends on correct
target resolution.

Relevant docs and files:

- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `packages/proxy/src/utils/btp-destination.ts`
- `packages/proxy/test/btp-destination.test.ts`
- `.agents/tasks/done/015-expand-btp-destination-edge-tests.md`
- `.agents/tasks/done/017-bound-btp-destination-cache-lifetime.md`

## Scope

- Add focused tests in `packages/proxy/test/btp-destination.test.ts` for a
  Destination service response with missing or blank `destinationConfiguration.URL`.
- Preserve existing local-development fallback behavior only if the tests prove
  it is still intentional and documented in the test name.
- Ensure production resolution throws a meaningful error that names the
  destination and the invalid URL condition.
- Keep cache keys free of raw bearer tokens.
- Update proxy package documentation only if the public troubleshooting guidance
  needs to mention malformed destinations.

## Non-Goals

- Do not redesign BTP destination resolution.
- Do not make the 60-second cache TTL configurable.
- Do not change auth token exchange, connectivity proxy handling, destination
  cache key hashing, proxy request handling, or Explorer UI.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Tests cover missing or blank destination `URL` payloads.
- [ ] Production mode fails with a clear destination-resolution error instead
  of returning an unusable destination.
- [ ] Existing BTP destination edge, connectivity, cache TTL, and token-hashing
  tests remain green.
- [ ] Development fallback behavior is either preserved with explicit coverage
  or intentionally changed with documentation.
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

High risk because this touches BTP destination resolution, an external
integration and deployment-sensitive proxy boundary. Separate review is
required by `.agents/WORKFLOW.md` and `SECURITY.md`.

## Handoff Notes

Implemented 2026-05-05 by Codex Implementer.

- changed files:
  - `packages/proxy/src/utils/btp-destination.ts`
  - `packages/proxy/test/btp-destination.test.ts`
  - `.agents/tasks/ready/032-validate-btp-destination-url.md`
  - `.agents/NEXT.md`
- failing-test evidence before implementation fix:
  - Added missing and blank `destinationConfiguration.URL` production tests
    first, then ran
    `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`.
  - Initial approved run failed as expected: 15 tests run, 13 passed, 2 failed.
  - Failing cases:
    - `throws in production when Destination Service omits the destination URL`
    - `throws in production when Destination Service returns a blank destination URL`
  - Both failures proved `resolveBtpDestination()` returned unusable
    destination objects with `url: undefined` or `url: "   "` instead of
    rejecting.
- summary:
  - Added focused coverage for missing and blank Destination service URL
    payloads in production mode.
  - Added explicit coverage that local development keeps the existing mock
    fallback when the Destination service omits the URL.
  - Validated `destinationConfiguration.URL` before creating/cacheing a
    resolved destination and fail with
    `invalid destination URL: destinationConfiguration.URL is missing or blank`.
  - Trimmed valid destination URLs before storing them in the resolved
    destination object.
  - Did not change auth token exchange, connectivity handling, cache TTL,
    cache key hashing, proxy request handling, Explorer UI, docs, or
    dependencies.
- tests run:
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
    (16 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify`
    (57 tests passed, 1 skipped, proxy standalone example passed).
  - PASS: `pnpm.cmd run typecheck`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No listed checks were skipped.
  - Residual risk is limited to real SAP BTP Destination service response
    variations not represented by local mocks; separate review remains
    required because this is deployment-sensitive BTP resolution behavior.
- self-check result:
  - Scope stayed limited to the task-owned BTP destination utility, its tests,
    workflow state, and next-action handoff.
  - Acceptance criteria are met.
  - No raw bearer tokens were added to cache keys or logs.
  - No real credentials, tenant endpoints, or external SAP/BTP services were
    used.
  - No unrelated files were changed.
- review requirement decision:
  - Separate security-focused review is required by the task, `.agents/WORKFLOW.md`,
    and `SECURITY.md` because the change touches BTP destination resolution.
- task state movement:
  - Moved to `.agents/tasks/done/032-validate-btp-destination-url.md`.
- `.agents/NEXT.md` update:
  - Updated to point at a fresh Reviewer prompt for this task.
- commit hash:
  - See final implementer summary for the committed hash.
- known gaps:
  - None beyond the residual risk noted above.
