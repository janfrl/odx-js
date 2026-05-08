# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Tasks 077-087 are complete and reviewed. Task 088 is ready
for implementation and requires separate review after completion.

## Current Next Step

Start a fresh Implementer for task 088:
`.agents/tasks/ready/088-cover-btp-destination-metadata-refresh.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
.agents/tasks/ready/088-cover-btp-destination-metadata-refresh.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- SECURITY.md
- DEPLOYMENT.md
- .agents/tasks/ready/088-cover-btp-destination-metadata-refresh.md
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/src/utils/target.ts
- packages/proxy/src/utils/btp-destination.ts
- packages/proxy/src/api/generate.ts
- packages/proxy/test/explorer-policy.test.ts
- packages/proxy/test/btp-destination.test.ts

Rules:
- Keep changes scoped to task 088.
- Add deterministic local tests for production runtime metadata refresh through mocked BTP Destination resolution.
- Verify resolved destination URL and destination auth semantics are used instead of service/global configured auth.
- Verify useful metadata request headers are sent while restricted/sensitive incoming headers remain governed by existing proxy header preparation rules.
- Verify stale-cache fallback when destination resolution or metadata fetch fails, without invoking SDK generation in production.
- Do not require live SAP BTP services or external network access.
- Do not redesign BTP destination resolution unless a focused test exposes a defect that must be fixed for the task.
- Do not change direct-service metadata refresh behavior except to preserve existing tested semantics.
- Do not update durable docs unless implementation changes a durable contract.

Verification:
- Run `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`.
- Run `pnpm.cmd --filter @bc8-odx/proxy run verify`.
- Run `pnpm.cmd run lint`.
- Run `pnpm.cmd run typecheck`.
- Run `git diff --check`.

Before finishing:
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update the task Handoff Notes.
- Decide whether separate review is required using `.agents/WORKFLOW.md`.
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
