# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Review completed high-risk task:
`.agents/tasks/done/037-reject-non-http-btp-destination-url.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- API.md
- ARCHITECTURE.md
- SECURITY.md
- DEPLOYMENT.md
- .agents/tasks/done/037-reject-non-http-btp-destination-url.md
- packages/proxy/src/utils/btp-destination.ts
- packages/proxy/test/btp-destination.test.ts
- .agents/tasks/done/032-validate-btp-destination-url.md
- .agents/reviews/032-validate-btp-destination-url-review.md

Review completed task `.agents/tasks/done/037-reject-non-http-btp-destination-url.md`.

Review stance:
- Findings first.
- Prioritize correctness, security/privacy, BTP destination resolution behavior, cache safety, acceptance criteria gaps, and missing tests.
- Check that production Destination Service payloads with non-empty non-HTTP(S) URLs are rejected before caching.
- Check that local development fallback, cache key hashing, cache TTL, connectivity handling, auth token exchange, and successful HTTP(S) behavior were preserved.
- Check that the implementation did not change proxy request handling, Explorer UI, Nuxt config, dependencies, or lockfiles.
- Do not revert edits made by others.
- Create or update a review note under `.agents/reviews/` using `REVIEW_TEMPLATE.md` if present.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat prompt.
- Commit the review note and workflow state changes with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- findings with severity and file/line references
- acceptance criteria status
- verification performed or skipped
- whether the task is approved or needs changes
- commit hash
- residual risks
- exact next-chat prompt from `.agents/NEXT.md`
```
