# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement `.agents/tasks/ready/019-harden-explorer-query-builder-serialization.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/019-harden-explorer-query-builder-serialization.md
- DESIGN.md
- DOMAIN_MODEL.md

Rules:
- Implement exactly `.agents/tasks/ready/019-harden-explorer-query-builder-serialization.md`.
- Add failing Explorer state tests first for string literal escaping, function filters, and numeric values.
- Keep behavior local to Explorer unless a proven reusable OData concern belongs in `@bc8-odx/core`.
- Preserve existing manual `queryInput` behavior.
- Do not rewrite the query builder UI or implement a full OData expression grammar.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine.
- Run the verification steps listed in the task, or explain why they could not be run.
- Request separate review only if core query contracts, public composable contracts, or proxy/server behavior change.
- Move the task to `.agents/tasks/done/` only after implementation and verification.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
