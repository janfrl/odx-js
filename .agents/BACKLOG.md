# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Encode Explorer internal endpoint query parameters for service and entity
  names containing query separator characters.
- Reject duplicate scenario labels in proxy benchmark comparison reports.
- Clarify package verification docs around the aggregate command and generated
  docs artifact drift.
- Run a release confidence checkpoint after the current ready queue completes.

## Next

- Continue Explorer improvements only through narrow, test-backed state fixes
  unless UI changes are explicitly needed and browser-verified.
- Consider runtime performance optimizations only after benchmark tooling keeps
  malformed reports visible and checkpoint checks remain green.
- Batch a full checkpoint after tasks 046-048 are complete.

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
