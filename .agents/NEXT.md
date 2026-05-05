# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Review the completed high-risk task:

`.agents/tasks/done/032-validate-btp-destination-url.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX.

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- .agents/tasks/done/032-validate-btp-destination-url.md
- packages/proxy/src/utils/btp-destination.ts
- packages/proxy/test/btp-destination.test.ts
- .agents/tasks/done/015-expand-btp-destination-edge-tests.md
- .agents/tasks/done/017-bound-btp-destination-cache-lifetime.md

Review the completed task `.agents/tasks/done/032-validate-btp-destination-url.md`.

Rules:
- Use a fresh independent review stance.
- Findings first, ordered by severity with file/line references.
- Check that production BTP destination resolution fails clearly for missing or blank `destinationConfiguration.URL`.
- Check that local development fallback behavior remains intentional and covered.
- Check that cache keys remain free of raw bearer tokens.
- Check that the implementation did not change auth token exchange, connectivity proxy handling, cache TTL configuration, proxy request handling, Explorer UI, or dependencies.
- Check acceptance criteria, verification evidence, security/privacy implications, and unrelated changes.
- Run focused verification for the changed BTP destination tests, or explain why it could not be run.
- Create or update a review note under `.agents/reviews/` using `REVIEW_TEMPLATE.md`.
- Update `.agents/NEXT.md` with the next workflow action.
- Commit the review note and workflow state changes with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- findings
- acceptance criteria status
- verification performed
- whether the task is approved or needs changes
- commit hash
- residual risks or gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
