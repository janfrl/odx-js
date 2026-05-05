# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Coordinate the workflow after approving the completed high-risk review:

`.agents/reviews/032-validate-btp-destination-url-review.md`

Note: the expected next ready task,
`.agents/tasks/ready/035-add-docs-package-readme-verification-notes.md`, is
already completed at `.agents/tasks/done/035-add-docs-package-readme-verification-notes.md`
by concurrent work. Preserve those edits and reconcile the next action from the
current repository state.

## Prompt For Next Chat

```txt
You are the Orchestrator for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/orchestrator.md
- .agents/NEXT.md
- .agents/reviews/032-validate-btp-destination-url-review.md
- .agents/tasks/done/032-validate-btp-destination-url.md
- .agents/tasks/done/035-add-docs-package-readme-verification-notes.md, if present

Coordinate the next workflow step from the current repository state.

Rules:
- Do not revert edits made by others.
- Treat task 032 as independently reviewed and approved.
- Notice that task 035 appears to have been moved from ready to done by concurrent work; preserve it and verify whether that work needs follow-up.
- If no ready tasks remain after reconciling concurrent work, use the Planner prompt from `.agents/WORKFLOW.md`.
- Keep `.agents/NEXT.md` current and create a Conventional Commit only for your own coherent workflow changes unless existing staged work is intentionally part of your action.

When done, summarize:
- role chats or sub-agents run
- commits created or reviewed
- current `.agents/NEXT.md` action
- blockers or human decisions needed
- exact next-chat prompt from `.agents/NEXT.md`
```
