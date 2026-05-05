# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement the lowest-numbered ready task:
`.agents/tasks/ready/026-preserve-buffer-proxy-204-empty-response.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/026-preserve-buffer-proxy-204-empty-response.md
- ARCHITECTURE.md
- API.md
- SECURITY.md

Rules:
- Implement exactly `.agents/tasks/ready/026-preserve-buffer-proxy-204-empty-response.md`.
- Keep changes scoped to the buffered proxy 204 regression.
- Add the integration test before changing implementation code.
- Do not change authentication, destination resolution, proxy rules, stream mode, or DevTools redaction.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the required reviewer prompt because this task requires separate review.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
