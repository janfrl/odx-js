# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement `.agents/tasks/ready/059-cover-buffered-service-specific-response-hooks.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/059-cover-buffered-service-specific-response-hooks.md
- packages/proxy/src/api/odata.ts
- packages/proxy/test/integration.test.ts
- API.md
- docs/content/en/3.proxy/4.reference.md

Implement exactly `.agents/tasks/ready/059-cover-buffered-service-specific-response-hooks.md`.

Rules:
- Keep changes scoped to the task.
- Start with focused failing tests for buffered service-specific response hooks.
- Do not change stream proxy behavior in this task.
- Separate review is required after implementation because this touches public proxy hook behavior.
- Do not revert edits made by others.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Decide whether separate review is required using `.agents/WORKFLOW.md`.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
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
- exact next-chat prompt from `.agents/NEXT.md`
```
