# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Normalize Nuxt composable URL joins for slashed base paths, routes, and
  direct service URLs.
- Reject non-HTTP(S) BTP destination URLs before production proxy target
  resolution.
- Clear stale Explorer selected entity state after service config refreshes.
- Report missing scenarios in proxy benchmark comparisons.
- Cover configured Nuxt service routes for mutation helpers.

## Next

- Run separate review for BTP destination correctness changes from task 037.
- Continue Explorer improvements only through narrow, test-backed state or UI
  fixes.
- Consider performance optimizations only after benchmark comparison output
  calls out missing scenarios and enough local run context for fair comparison.
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
