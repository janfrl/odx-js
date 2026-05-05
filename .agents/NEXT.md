# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement the lowest-numbered ready task:
`.agents/tasks/ready/027-exclude-pending-logs-from-status-filters.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/027-exclude-pending-logs-from-status-filters.md
- DESIGN.md
- packages/explorer/composables/useODataState.ts
- packages/explorer/test/state.test.ts

Rules:
- Implement exactly `.agents/tasks/ready/027-exclude-pending-logs-from-status-filters.md`.
- Keep changes scoped to Explorer Traffic Monitor status filter behavior.
- Add focused state tests before changing implementation code.
- Do not change proxy logging behavior, `/__odx__/logs` payloads, or displayed sensitive fields.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next concrete workflow action.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.
- Separate review is not required unless proxy logging, endpoint contracts, or displayed sensitive data changes.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
