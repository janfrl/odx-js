# Backlog

This backlog is intentionally lightweight. Move detailed implementation work
into task files under `.agents/tasks/ready/`.

Use `.agents/EPICS.md` to understand how backlog items group into larger
implementation phases.

## Now

- Restore the lint baseline so all standard checks are green.
- Redact sensitive header values from DevTools traffic logs.
- Fix async custom validation in proxy rules.
- Harden type generation process execution.
- Escape OData key literals in the Nuxt composable.

## Next

- Finish workflow adoption cleanup after the first implementation tasks land.
- Review high-risk proxy and process-execution changes independently.
- Batch a full checkpoint after the ready task queue is complete.

## Later

- Expand Explorer tests around traffic-log UI behavior.
- Add broader integration coverage for BTP destination edge cases.
- Revisit production TLS defaults as a documented security decision.

## Questions

- Should `.agents/skills/**` be linted as project Markdown, or treated as
  operational reference material outside the source lint target?
- Should async proxy validation become the preferred documented validation API,
  or should the public docs restrict validators to synchronous callbacks?
