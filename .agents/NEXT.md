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

Task 083 implementation is complete and requires separate review:
`.agents/tasks/done/083-complete-or-remove-explorer-mockdata-api.md`.

After task 083 review is approved, continue with:
`.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
- `.agents/tasks/done/083-complete-or-remove-explorer-mockdata-api.md`

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/083-complete-or-remove-explorer-mockdata-api.md
- .agents/reviews/082-align-standalone-explorer-runtime-ui-review.md
- packages/proxy/src/nitro.ts
- packages/proxy/src/api/*
- packages/explorer/composables/useODataState.ts
- packages/explorer/composables/useEntityExplorer.ts
- packages/explorer/test/state.test.ts
- docs/content/en/5.explorer/1.setup.md
- docs/content/de/5.explorer/1.setup.md
- the changed files and diff for the latest task 083 implementation commit

Review stance:
- Findings first.
- Prioritize correctness, architecture boundaries, security/privacy, authorization, public contracts, missing tests, and acceptance criteria gaps.
- Verify Explorer no longer calls an unregistered `/__odx__/mockdata` endpoint.
- Verify the docs and tests match the chosen removal behavior.
- Verify production behavior cannot delete arbitrary files or customer data.
- Verify normal OData proxy behavior was not changed.

Verification:
- Inspect the implementation diff.
- Run focused checks if needed, or record why the implementer verification is sufficient.

Output:
- findings with severity and file/line references
- acceptance criteria status
- verification performed or accepted from implementer
- whether the task is approved or needs changes
- create or update a review note under `.agents/reviews/`
- update `.agents/NEXT.md` with the next action, preserving task 085 as the next task after task 083 review approval
- commit the review note and workflow state changes unless a stop condition prevents committing
- exact next-chat prompt from `.agents/NEXT.md`
```
