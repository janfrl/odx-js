# Task: Expand BTP destination edge tests

Status: done
Owner: Dewey + Jason + Codex orchestrator
Created: 2026-05-05
Risk: high
Review: required

## Objective

Increase confidence in BTP destination resolution with local tests for edge
cases that do not require a real SAP BTP account.

## Context

`resolveBtpDestination()` handles VCAP/default-env loading, destination service
token calls, principal propagation, on-premise connectivity, local fallback, and
production error behavior. Existing tests cover the main happy paths but leave
edge cases under-specified.

Relevant files:

- `packages/proxy/src/utils/btp-destination.ts`
- `packages/proxy/test/btp-destination.test.ts`
- `packages/proxy/src/plugins/btp-auth.ts`
- `packages/proxy/src/utils/target.ts`

## Scope

- Add failing tests first for selected edge cases.
- Prefer cases that can be verified with mocks only, such as:
  - malformed `VCAP_SERVICES`
  - `default-env.json` fallback loading
  - production failure behavior when Destination Service calls fail
  - cache key behavior for technical vs user-token lookups
  - on-premise connectivity defaults when proxy host/port are absent
- Fix implementation only when a new test proves a real bug.

## Non-Goals

- Do not require real SAP/BTP services.
- Do not change authentication semantics without a failing test and separate
  review.
- Do not log or store real credentials in tests.

## Acceptance Criteria

- [ ] New local tests cover at least three meaningful BTP destination edge cases.
- [ ] Any implementation changes are test-first and narrowly scoped.
- [ ] Existing BTP destination happy-path tests still pass.
- [ ] Security/privacy implications are recorded in handoff notes.
- [ ] Separate review is requested after implementation.

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

High risk because BTP destination resolution touches authentication,
credentials, principal propagation, and on-premise connectivity. Separate review
is required.

## Handoff Notes

Implemented 2026-05-05 by Implementer worker.

Changed files:

- `packages/proxy/test/btp-destination.test.ts`
- `packages/proxy/src/utils/btp-destination.ts`
- `.agents/tasks/ready/015-expand-btp-destination-edge-tests.md`

Failing-test evidence before implementation fix:

- Added edge tests first, then ran
  `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`.
- Initial isolated result: 10 tests run, 9 passed, 1 failed.
- Failing case:
  `does not reuse cached user-token destination data across different bearer tokens`.
- Failure proved that the second bearer-token lookup received the first user's
  cached destination URL/auth token because the cache key only distinguished
  `service:user` from `service:technical`.

Implemented test coverage:

- `default-env.json` fallback binding loading when `VCAP_SERVICES` is absent.
- Production failure behavior when the Destination Service token call fails.
- Technical vs user-token cache separation.
- Different bearer tokens for the same destination do not share cached
  user-specific destination data.
- On-premise connectivity proxy host/port defaults with user-token forwarding.
- Malformed `VCAP_SERVICES` surfaces without calling external services.

Implementation change:

- Narrowly changed the BTP destination cache key for user-token lookups to
  include a SHA-256 fingerprint of the normalized bearer token.
- Technical destination cache keys remain service-scoped.
- Raw bearer tokens are not stored in cache keys.

Verification:

- PASS: `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts`
  (10 tests passed).
- PASS: `pnpm.cmd run typecheck`.
- Not run: `pnpm.cmd run lint`; task-local required checks passed, and the
  change surface is limited to destination tests plus a small cache-key fix.

Security/privacy implications:

- This task touches BTP destination resolution, principal propagation, and
  auth token handling, so separate security-focused review is required.
- The fix reduces cross-user token/destination leakage risk by preventing
  different bearer tokens from sharing a single `service:user` cache entry.
- Tests use mock tokens, mock service bindings, and local fixtures only. No
  real SAP/BTP services, real credentials, or tenant endpoints were used.
- Cache keys now contain a non-reversible hash of the normalized user token
  rather than the raw bearer token.

Known gaps:

- No behavior change was made for malformed `VCAP_SERVICES`; the new test
  documents current fail-fast behavior and verifies no external calls occur.
- `lint` remains a broad checkpoint check for the orchestrator/reviewer if
  required.

Review:

- Required by task and workflow because BTP destination resolution is
  authentication/security-sensitive.
- Separate reviewer approved the change with no findings. Reviewer confirmed
  raw bearer tokens are not stored in cache keys and task-scoped diff does not
  touch benchmark files.
- Orchestrator re-ran `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts packages/proxy/test/performance.test.ts`,
  `pnpm.cmd run lint`, and `pnpm.cmd run typecheck` before moving the task to
  done.
- Residual risk:
  - Destination cache still has no expiry/eviction; this task improves
    principal-propagation isolation but does not address cache lifecycle.
- Commit hash:
  - To be filled after commit.
