# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 076 is complete and requires separate review before the
workflow continues.

## Current Next Step

Start a fresh Reviewer chat for
`.agents/tasks/done/076-skip-buffered-response-flattening-when-devtools-disabled.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/076-skip-buffered-response-flattening-when-devtools-disabled.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/tasks/done/076-skip-buffered-response-flattening-when-devtools-disabled.md
- .agents/tasks/done/022-preserve-buffer-proxy-success-status.md
- .agents/tasks/done/026-preserve-buffer-proxy-204-empty-response.md
- .agents/tasks/done/059-cover-buffered-service-specific-response-hooks.md
- .agents/tasks/done/071-skip-devtools-trace-allocation-when-disabled.md
- .agents/NEXT.md
- packages/proxy/src/api/odata.ts
- packages/proxy/src/utils/trace.ts
- packages/proxy/test/integration.test.ts
- packages/proxy/test/performance.test.ts

Review stance:
- Findings first, ordered by severity with file/line references.
- Prioritize correctness, runtime proxy behavior, acceptance criteria,
  regression coverage, enabled DevTools log shape, disabled DevTools logging
  behavior, status/204 handling, response hooks, error forwarding, stream mode,
  mock responses, and unrelated scope.
- Verify the implementation stayed narrow to the buffered proxy response
  logging path and `.agents` workflow state.

Rules:
- Do not edit Explorer UI, benchmark scenario definitions, public hook
  contracts beyond preserving them, dependencies, lockfiles, generated files,
  unrelated docs, or unrelated runtime behavior.
- Do not change core `flattenOData()` semantics.
- Do not change stream proxy response-hook behavior.
- Create or update a review note under `.agents/reviews/` using
  `.agents/reviews/REVIEW_TEMPLATE.md`.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat
  prompt.
- Commit the review note and workflow state changes with a Conventional Commit
  unless a stop condition prevents committing.

Suggested verification:
- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck` if the reviewer judges it necessary

When done, summarize:
- findings
- acceptance criteria status
- verification performed
- whether approved or needs changes
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```
