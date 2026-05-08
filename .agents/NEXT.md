# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, persistence, and internal HTTP
contracts.

## Current Next Step

Task 085 implementation is complete and requires a fresh independent review.
Review:
`.agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
- `.agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md`

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- .agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md
- .agents/reviews/082-align-standalone-explorer-runtime-ui-review.md
- .agents/reviews/083-complete-or-remove-explorer-mockdata-api-review.md
- .agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- changed files and diff

Rules:
- Use a fresh review stance and do not rely on the Implementer conversation.
- Findings first, ordered by severity with file/line references.
- Check the diff against task 085 scope and acceptance criteria.
- Verify English and German docs are semantically aligned for touched topics.
- Check that docs match approved behavior from tasks 080-083 and do not document unapproved behavior.
- Check that docs do not expose customer-specific BTP routes, credentials, destinations, or backend URLs.
- Check root docs and Docus docs for contradictions on production versus development Explorer behavior.
- Confirm `git diff --check`, `pnpm.cmd --filter docs run verify`, and the required manual stale-word searches are adequate, or record verification gaps.
- Create or update a review note under `.agents/reviews/` using `REVIEW_TEMPLATE.md`.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the review note and workflow state changes with a Conventional Commit unless a stop condition prevents committing.

Output:
- findings with severity and file/line references
- acceptance criteria status
- verification gaps
- whether the task is approved or needs changes
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
