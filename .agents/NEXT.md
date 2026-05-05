# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement ready task `.agents/tasks/ready/062-run-stability-and-hooks-checkpoint.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Implement exactly:
- `.agents/tasks/ready/062-run-stability-and-hooks-checkpoint.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- `.agents/tasks/ready/062-run-stability-and-hooks-checkpoint.md`
- `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
- `.agents/tasks/done/059-cover-buffered-service-specific-response-hooks.md`
- `.agents/tasks/done/060-validate-proxy-benchmark-iteration-env.md`
- `.agents/tasks/done/061-document-service-name-type-generation-limits.md`
- `.agents/reviews/059-cover-buffered-service-specific-response-hooks-review.md`

Rules:
- Run the checkpoint commands listed in task 062.
- Confirm task 059 has an approved review note.
- Confirm task states and `.agents/NEXT.md` are consistent.
- Do not implement unrelated fixes while running the checkpoint.
- Move task 062 to `.agents/tasks/done/` only after checkpoint verification is complete.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd run verify:packages`
- `pnpm.cmd run test`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`
- `git status --short`

Output:
- changed files
- checkpoint results
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
