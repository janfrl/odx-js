# Task: Reject non-http BTP destination URLs

Status: ready
Owner: unassigned
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

