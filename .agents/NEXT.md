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

Task 081 implementation is complete and committed. Because task 081 is high
risk and review-required, start a fresh Reviewer chat for:
`.agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md`.

After task 081 is approved, continue the remaining production runtime sequence
in this order:

1. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
2. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
3. `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
- `.agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- packages/core/src/server.ts
- packages/core/src/types.ts
- packages/proxy/src/api/config.ts
- packages/proxy/src/api/schema.ts
- packages/proxy/src/api/types.ts
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/test/explorer-policy.test.ts
- packages/explorer/composables/useODataState.ts
- packages/explorer/composables/useSchemaExplorer.ts
- packages/explorer/test/state.test.ts
- the implementation diff for the task 081 commit

Review stance:
- Findings first.
- Prioritize correctness, runtime API contracts, production cache behavior, stale/missing metadata semantics, security/privacy, generated artifact boundaries, and missing tests.
- Check that `/__odx__/schema` and `/__odx__/config` read schema information from the runtime metadata cache instead of generated SDK files or ad hoc production filesystem writes.
- Check that local EDMX file support remains intact.
- Check that normal OData proxy responses were not changed.
- Check that db0, evlog, and broad Explorer UI redesign were not added.

Verification to inspect or rerun if needed:
- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes
- create or update a review note under `.agents/reviews/`
- update `.agents/NEXT.md` with the next workflow action
- commit the review note and workflow state changes with a Conventional Commit
- exact next-chat prompt from `.agents/NEXT.md`
```
