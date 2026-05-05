# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Review `.agents/tasks/done/051-add-deployment-config-consistency-tests.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/051-add-deployment-config-consistency-tests.md

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- ARCHITECTURE.md
- DEPLOYMENT.md
- SECURITY.md
- .agents/decisions/
- .agents/tasks/done/051-add-deployment-config-consistency-tests.md
- mta.yaml
- packages/approuter/xs-app.json
- packages/approuter/package.json
- package.json
- the changed files and diff

Review stance:
- Findings first.
- Prioritize correctness, architecture boundaries, security/privacy, authorization, public contracts, missing tests, and acceptance criteria gaps.
- Check that the implementation matches the task and does not include unrelated scope.
- Check that durable decisions are documented.

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes

Create or update a review note under .agents/reviews/ using REVIEW_TEMPLATE.md.
Update .agents/NEXT.md and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.

When done, summarize:
- findings
- acceptance criteria status
- verification reviewed
- approval decision
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```
