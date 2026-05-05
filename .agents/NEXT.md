# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement the lowest-numbered ready task:
`.agents/tasks/ready/024-improve-explorer-filtered-empty-state.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/024-improve-explorer-filtered-empty-state.md
- DESIGN.md
- packages/explorer/components/tabs/TabLogs.vue
- packages/explorer/composables/useODataState.ts
- packages/explorer/test/state.test.ts

Rules:
- Implement exactly `.agents/tasks/ready/024-improve-explorer-filtered-empty-state.md`.
- Keep changes scoped to Explorer Traffic Monitor filtered-empty behavior and tests.
- Preserve the existing no-traffic empty state.
- Do not redesign the Traffic Monitor or change proxy logging behavior.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.
- Separate review is not required unless endpoint contracts, proxy logging, or broad Explorer layout behavior changes.

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
