# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Prioritize production Explorer runtime hardening before broader benchmark or
  polish work:
  - endpoint policy and config redaction
  - log storage abstraction and redaction
  - db0-backed Explorer traffic history
  - runtime metadata refresh separated from SDK generation
  - schema/config endpoints backed by runtime metadata cache

## Next

- Continue the older benchmark and package-polish queue after the production
  Explorer runtime sequence has a safe endpoint and storage foundation.
- Continue Explorer improvements only through narrow, test-backed state fixes
  unless UI changes are explicitly needed and browser-verified.
- Revisit stream proxy response-hook behavior only after the expected contract
  is clear from public docs or focused tests.
- Consider runtime performance optimizations only after benchmark tooling keeps
  malformed reports visible and checkpoint checks remain green.
- Plan the next small stability or package-isolation queue after the task
  058-062 checkpoint completes.

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
