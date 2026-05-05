# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement the lowest-numbered ready task:
`.agents/tasks/ready/029-add-docs-package-verify-script.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/029-add-docs-package-verify-script.md
- docs/package.json
- README.md
- scripts/extract-api-docs.ts
- docs/scripts/extract-metadata.ts

Rules:
- Implement exactly `.agents/tasks/ready/029-add-docs-package-verify-script.md`.
- Keep changes scoped to docs package verification and root documentation for the command.
- Do not redesign docs content, start a dev server, add dependencies, or require browser verification.
- Prefer existing metadata/API extraction checks and existing tests.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next concrete workflow action.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.
- Separate review is not required unless generated public docs content changes in a way that affects user-facing API documentation.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
