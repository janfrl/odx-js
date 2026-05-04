# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Run a Reviewer for
`.agents/tasks/done/002-audit-devtools-log-data-exposure.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX.

Review the completed task:
.agents/tasks/done/002-audit-devtools-log-data-exposure.md

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- SECURITY.md
- .agents/tasks/done/002-audit-devtools-log-data-exposure.md
- packages/proxy/src/api/odata.ts
- packages/proxy/test/integration.test.ts
- the diff for the latest implementation commit

Review stance:
- Findings first.
- Prioritize correctness, security/privacy, proxy behavior, missing tests, and acceptance criteria gaps.
- Verify that the implementation does not introduce broad header-name redaction.
- Verify that outbound proxy authorization behavior is unchanged.
- Verify that ODX-managed auth values are omitted only from the DevTools log copy.

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes
- exact next-chat prompt from .agents/NEXT.md after updating workflow state

Create or update a review note under .agents/reviews/ using REVIEW_TEMPLATE.md.
Update .agents/NEXT.md and commit the review note and workflow state changes.
```
