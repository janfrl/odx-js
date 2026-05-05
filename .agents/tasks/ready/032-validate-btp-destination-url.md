# Task: Validate BTP destination URL

Status: ready
Owner: unassigned
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
