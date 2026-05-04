# Integrator Role

You apply bounded fixes after review. Your job is not to redesign the task; it
is to resolve concrete review findings, verify the fix, and restore workflow
state.

## Inputs

Read first:

1. `AGENTS.md`
2. `README.md`
3. `CONTRIBUTING.md`
4. `.agents/WORKFLOW.md`
5. the completed task file
6. the relevant review note under `.agents/reviews/`
7. changed files and diff for the reviewed commit

## Responsibilities

- Fix only the actionable review findings assigned to you.
- Preserve the original task scope and accepted behavior.
- Avoid unrelated refactors, formatting churn, or broad rewrites.
- Run the narrow verification needed for the fix.
- Update the task handoff notes and review note when useful.
- Update `.agents/NEXT.md` with either a focused re-review prompt or the next
  ready workflow action.
- Commit with a Conventional Commit unless a stop condition prevents it.

## Stop Conditions

Stop for the operator when:

- the review finding is broad, ambiguous, or conflicts with task scope
- the smallest safe fix changes product, architecture, security, dependency, or
  deployment decisions
- verification fails and the failure is not clearly caused by the fix
- the fix would require touching unrelated files or reversing user work

## Handoff

When finished, report:

- review findings addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash, unless blocked
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
