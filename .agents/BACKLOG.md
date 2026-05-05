# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Bound BTP destination cache lifetime after the user-token cache isolation
  fix.
- Improve Explorer Traffic Monitor filtering for larger local diagnostic
  sessions.
- Harden Explorer visual query builder serialization with focused tests.
- Add a discoverable Explorer package verification command.
- Make proxy benchmark output easier to compare across local runs.

## Next

- Run separate review for security-sensitive proxy/auth/cache work.
- Continue Explorer improvements through test-backed state and UI changes.
- Consider performance optimizations only after benchmark baselines are easy to
  compare.
- Batch a full checkpoint after the ready task queue is complete.

## Later

- Revisit production TLS defaults as a documented security decision.
- Add broader browser-level Explorer verification after package-level checks are
  stable.
- Revisit generated metadata cache policy and cleanup expectations.

## Questions

- Should async proxy validation become the preferred documented validation API,
  or should the public docs restrict validators to synchronous callbacks?
- For DevTools logs, which data sources are acceptable to store verbatim during
  local development, and which source-aware cases should be excluded?
- What default TTL should ODX use for BTP destination cache entries in long-lived
  production proxy processes?
