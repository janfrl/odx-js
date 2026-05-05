# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Preserve non-200 successful backend statuses in buffered proxy responses.
- Add package-local verification commands for core, proxy, and Nuxt.
- Improve the Explorer Traffic Monitor empty state when filters hide existing
  logs.
- Add a local proxy benchmark comparison helper.

## Next

- Run separate review for public proxy HTTP behavior changes.
- Continue Explorer improvements through test-backed state and UI changes.
- Consider performance optimizations only after benchmark baselines are easy to
  compare across runs.
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
- Should the fixed 60-second BTP destination cache TTL become operator
  configurable, or remain an internal conservative default?
