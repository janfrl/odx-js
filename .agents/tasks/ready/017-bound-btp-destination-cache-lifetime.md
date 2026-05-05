# Task: Bound BTP destination cache lifetime

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: high
Review: required

## Objective

Add a bounded cache lifetime and explicit test coverage for BTP destination
cache entries so user-token destination data cannot remain resident
indefinitely.

## Context

Task 015 fixed cross-user cache key isolation for `resolveBtpDestination()`.
Its residual risk noted that `packages/proxy/src/utils/btp-destination.ts`
still has no cache expiry or eviction. Destination data can include auth tokens,
connectivity tokens, and user-token-derived destination responses, so cache
lifecycle is security-sensitive.

Relevant docs:

- `SECURITY.md`
- `ARCHITECTURE.md`
- `.agents/tasks/done/015-expand-btp-destination-edge-tests.md`

## Scope

- Add tests first in `packages/proxy/test/btp-destination.test.ts` for cache
  expiry behavior.
- Implement a small TTL-based cache policy in
  `packages/proxy/src/utils/btp-destination.ts`.
- Prefer a conservative default TTL that is useful for request bursts but does
  not retain destination data for the whole process lifetime.
- Allow tests to control time deterministically with Vitest fake timers or an
  equivalent narrow helper.
- Keep cache keys free of raw bearer tokens.
- Document any public or operator-facing cache policy only if implementation
  introduces a durable option or behavior contributors need to know.

## Non-Goals

- Do not add a broad cache library or dependency.
- Do not change BTP destination request semantics beyond cache expiry.
- Do not require real SAP/BTP services.
- Do not add process-wide cache clearing endpoints.

## Acceptance Criteria

- [ ] User-token destination entries expire and are refetched after TTL.
- [ ] Technical destination entries expire and are refetched after TTL.
- [ ] Cache hits before TTL still avoid duplicate Destination Service calls.
- [ ] Raw bearer tokens are not stored in cache keys or logged.
- [ ] Security implications and TTL choice are recorded in handoff notes.
- [ ] Separate security-focused review is requested after implementation.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use mocks/local fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because BTP destination caching touches authentication, credential
material, principal propagation, and on-premise connectivity tokens. Separate
review is required by `.agents/WORKFLOW.md` and `SECURITY.md`.

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
