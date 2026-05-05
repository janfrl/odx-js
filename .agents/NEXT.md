# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Review completed task `.agents/tasks/done/059-cover-buffered-service-specific-response-hooks.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Review the completed task:
- `.agents/tasks/done/059-cover-buffered-service-specific-response-hooks.md`

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- API.md
- docs/content/en/3.proxy/4.reference.md
- packages/proxy/src/api/odata.ts
- packages/proxy/test/integration.test.ts
- the changed files and diff

Review stance:
- Findings first.
- Prioritize correctness, architecture boundaries, security/privacy, public proxy hook contracts, missing tests, and acceptance criteria gaps.
- Confirm buffered responses call and await both generic and service-specific response hooks.
- Confirm stream proxy behavior, direct-strategy hook bypass, request hooks, status forwarding, DevTools logging, and error forwarding were preserved.
- Check that docs accurately describe buffered response-hook behavior without broadening the stream contract.

Verification to consider:
- `pnpm.cmd --filter @bc8-odx/proxy exec vitest run test/integration.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes

Create or update a review note under `.agents/reviews/` using `REVIEW_TEMPLATE.md`.
Update `.agents/NEXT.md` and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.
```
