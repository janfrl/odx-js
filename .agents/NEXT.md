# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement the lowest-numbered ready task:
`.agents/tasks/ready/023-add-package-local-verify-scripts.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/023-add-package-local-verify-scripts.md
- packages/core/README.md
- packages/proxy/README.md
- packages/nuxt/README.md
- packages/explorer/README.md
- .agents/PACKAGE_ISOLATION.md

Rules:
- Implement exactly `.agents/tasks/ready/023-add-package-local-verify-scripts.md`.
- Keep changes scoped to package-local verify scripts and documentation.
- Do not add new tests, examples, playgrounds, dependencies, or runtime code.
- Preserve existing root verification commands.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.
- Separate review is not required unless runtime code, dependencies, or broad workspace scripts change.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
