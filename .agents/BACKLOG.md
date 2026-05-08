# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Close the post-production-runtime cleanup queue from tasks 077-086:
  - sanitize metadata refresh and cache-state failure messages before Explorer
    responses expose them
  - add local BTP Destination coverage for production metadata refresh
  - make SQL log-store connector imports part of proxy verification
  - tighten AppRouter/MTA consistency checks for the standalone Explorer
  - remove stale Explorer `generateService` naming now that UI code uses
    Refresh Metadata semantics

## Next

- Continue the older benchmark and package-polish queue after the cleanup tasks
  087-091 complete or have bounded residual risk.
- Continue Explorer improvements only through narrow, test-backed state fixes
  unless UI changes are explicitly needed and browser-verified.
- Revisit stream proxy response-hook behavior only after the expected contract
  is clear from public docs or focused tests.
- Consider runtime performance optimizations only after benchmark tooling keeps
  malformed reports visible and checkpoint checks remain green.

## Later

- Revisit production TLS defaults as a documented security decision.
- Add broader browser-level Explorer verification after package-level checks are
  stable.
- Revisit whether package isolation docs should be promoted from
  `.agents/PACKAGE_ISOLATION.md` into root or package documentation.

## Questions

- Should async proxy validation become the preferred documented validation API,
  or should the public docs restrict validators to synchronous callbacks?
- For DevTools logs, which data sources are acceptable to store verbatim during
  local development, and which source-aware cases should be excluded?
- Should the fixed 60-second BTP destination cache TTL become operator
  configurable, or remain an internal conservative default?
- Which BTP SQL backing service should be the first documented db0 production
  connector target?
