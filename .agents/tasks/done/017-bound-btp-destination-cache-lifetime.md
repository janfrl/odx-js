# Task: Bound BTP destination cache lifetime

Status: done
Owner: Codex orchestrator
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

Implemented 2026-05-05 by Implementer worker.

- changed files:
  - `packages/proxy/src/utils/btp-destination.ts`
  - `packages/proxy/test/btp-destination.test.ts`
  - `.agents/tasks/ready/017-bound-btp-destination-cache-lifetime.md`
- failing-test evidence before implementation fix:
  - Added TTL tests first, then ran
    `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`.
  - Initial sandboxed run was blocked by local Corepack directory permissions.
  - Approved rerun failed as expected: 13 tests run, 11 passed, 2 failed.
  - Failing cases:
    - `expires user-token destination cache entries after the bounded lifetime`
    - `expires technical destination cache entries after the bounded lifetime`
  - Both failures proved cached destination data was still reused after the
    intended bounded lifetime.
- summary:
  - Added a 60-second default TTL for BTP destination cache entries.
  - Cache entries now store an expiry timestamp and an unref'ed eviction timer.
  - Expired entries are deleted either when accessed after expiry or when their
    timer fires, so destination data does not remain process-resident
    indefinitely under normal runtime conditions.
  - Existing user-token cache keys continue to use a SHA-256 token fingerprint;
    raw bearer tokens are not stored in cache keys.
- tests run:
  - PASS: `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
    (13 tests passed).
  - PASS: `pnpm.cmd run typecheck`.
  - FAIL: `pnpm.cmd run lint` due to pre-existing unrelated Explorer lint error
    in `packages/explorer/composables/useODataState.ts`.
  - PASS: `pnpm.cmd exec eslint packages/proxy/src/utils/btp-destination.ts packages/proxy/test/btp-destination.test.ts`.
- skipped checks and residual risk:
  - No task-local checks were skipped.
  - Full lint remains blocked by an unrelated Explorer lint issue outside this
    task's ownership.
  - The TTL is fixed at 60 seconds; no operator-facing runtime option was added.
- self-check result:
  - Scope stayed limited to BTP destination cache TTL/expiry/eviction behavior
    and tests.
  - No SAP/BTP credentials, external calls, or new dependencies were added.
  - Destination auth data may still reside in memory for up to 60 seconds by
    design to preserve burst caching while bounding lifetime.
- review requirement decision:
  - Separate security-focused review is required by the task, `.agents/WORKFLOW.md`,
    and `SECURITY.md` because this touches BTP destination resolution and
    credential-bearing cache behavior.
- task state movement:
  - Not moved per operator instruction; orchestrator will integrate task state.
- `.agents/NEXT.md` update:
  - Not updated per operator instruction to avoid agent planning changes beyond
    this brief handoff note.
- commit hash:
  - No commit created per operator instruction.
- known gaps:
  - Broad lint has an unrelated existing Explorer failure that should be handled
    separately or by the orchestrator.

## Review Notes

Reviewed 2026-05-05 by independent Reviewer worker.

- decision: approved
- findings: none
- focused verification: PASS
  `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
- acceptance criteria:
  - user-token cache entries expire/refetch after TTL: pass
  - technical cache entries expire/refetch after TTL: pass
  - pre-TTL cache hits avoid duplicate Destination Service calls: pass
  - raw bearer tokens are not stored in cache keys or logged: pass
  - security implications and TTL choice recorded: pass
  - separate security-focused review requested/completed: pass
- residual risk:
  - reviewer did not rerun full typecheck or lint, but task-local test passed
    and implementer-reported typecheck passed.
