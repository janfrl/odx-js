# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 090 separate review is complete and approved. The next
lowest ready task is low-risk task 091.

## Current Next Step

Start an Implementer for:
`.agents/tasks/ready/091-remove-stale-explorer-generate-service-alias.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
.agents/tasks/ready/091-remove-stale-explorer-generate-service-alias.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- .agents/tasks/done/082-align-standalone-explorer-runtime-ui.md
- .agents/tasks/ready/091-remove-stale-explorer-generate-service-alias.md
- packages/explorer/composables/useODataState.ts
- packages/explorer/test/state.test.ts

Rules:
- Keep changes scoped to task 091.
- Remove the remaining internal `generateService` alias from Explorer state and
  tests.
- Preserve the existing `/__odx__/generate` endpoint path and metadata refresh
  behavior.
- Do not change SDK generation behavior, redesign Explorer UI, or change
  runtime metadata refresh response semantics.
- Move task 091 to `.agents/tasks/in-progress/` when starting and to
  `.agents/tasks/done/` only after implementation and verification.
- Update task handoff notes and `.agents/NEXT.md`.
- Commit the completed task with a Conventional Commit unless a stop condition
  prevents committing.
- Separate review is not required if the task stays within its low-risk,
  internal naming cleanup scope and verification passes.

Verification:
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `git grep -n "generateService" -- packages/explorer`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

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
