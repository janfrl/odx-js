# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Preserve ordinary entity properties named `value` in core OData flattening.
- Normalize proxy `basePath` parsing at slash boundaries.
- Add fast unit coverage for proxy benchmark report formatting/output shape.
- Add an aggregate root command for existing package-local verification.
- Clear stale Explorer traffic-log service filters after config refreshes.

## Next

- Continue Explorer improvements only through narrow, test-backed state fixes
  unless UI changes are explicitly needed and browser-verified.
- Consider runtime performance optimizations only after benchmark report
  formatting/output has fast tests and benchmark comparisons remain clear.
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
