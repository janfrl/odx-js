# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Preserve buffered proxy `204 No Content` semantics with a focused regression.
- Fix Explorer Traffic Monitor status filters so pending rows are not treated
  as successful traffic.
- Add automated coverage for the proxy benchmark comparison helper.
- Add a package-local docs verification command.
- Add relative overhead percentages to local proxy benchmark output.

## Next

- Run separate review for public proxy HTTP behavior changes from task 026.
- Continue Explorer improvements only through narrow, test-backed state or UI
  fixes.
- Consider performance optimizations only after benchmark output is easy to
  compare across runs.
- Batch a full checkpoint after the ready task queue is complete.

## Later

- Revisit production TLS defaults as a documented security decision.
- Add broader browser-level Explorer verification after package-level checks are
  stable.
- Revisit generated metadata cache policy and cleanup expectations.
- Revisit whether package isolation docs should be promoted from
  `.agents/PACKAGE_ISOLATION.md` into root or package documentation.

## Questions

- Should async proxy validation become the preferred documented validation API,
  or should the public docs restrict validators to synchronous callbacks?
- For DevTools logs, which data sources are acceptable to store verbatim during
  local development, and which source-aware cases should be excluded?
- Should the fixed 60-second BTP destination cache TTL become operator
  configurable, or remain an internal conservative default?
