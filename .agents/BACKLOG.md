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

- Add local proxy performance benchmarks before optimizing.
- Design package-isolation playgrounds or examples so individual packages can
  be verified independently.
- Expand Explorer tests carefully without changing the UI unless a test proves
  a bug.
- Review high-risk proxy and process-execution changes independently.
- Batch a full checkpoint after the ready task queue is complete.

## Later

- Add broader integration coverage for BTP destination edge cases.
- Revisit production TLS defaults as a documented security decision.
- Consider performance optimizations only after baseline measurements exist.
- Implement selected package playgrounds/examples from the isolation design.

## Questions

- Should async proxy validation become the preferred documented validation API,
  or should the public docs restrict validators to synchronous callbacks?
- For DevTools logs, which data sources are acceptable to store verbatim during
  local development, and which source-aware cases should be excluded?
