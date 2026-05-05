# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Restore the lint baseline so all standard checks are green.
- Verify and fix async custom validation in proxy rules with a failing test
  first.
- Verify and fix OData key literal escaping in the Nuxt composable with a
  failing test first.
- Audit DevTools log data exposure without broad header-name redaction.
- Verify whether type generation command construction is actually brittle
  before changing it.

## Next

- Fix or bound the Nuxt e2e startup failure on Node 24.
- Expand Explorer tests carefully without changing the UI unless a test proves
  a bug.
- Broaden proxy performance benchmarks before optimizing.
- Add local BTP destination edge-case tests.
- Review high-risk proxy and process-execution changes independently.
- Batch a full checkpoint after the ready task queue is complete.

## Later

- Revisit production TLS defaults as a documented security decision.
- Consider performance optimizations only after baseline measurements exist.
- Document or surface the new standalone package verification commands in
  durable user-facing docs after the example shape settles.

## Questions

- Should async proxy validation become the preferred documented validation API,
  or should the public docs restrict validators to synchronous callbacks?
- For DevTools logs, which data sources are acceptable to store verbatim during
  local development, and which source-aware cases should be excluded?
