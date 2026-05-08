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

Task 080 is implemented and requires independent review before continuing:
`.agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md`.

Continue the remaining production runtime sequence in this order after task
080 review approval:

1. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
2. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
3. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md
- .agents/tasks/done/079-add-db0-backed-explorer-log-store.md
- .agents/reviews/079-add-db0-backed-explorer-log-store-review.md
- ARCHITECTURE.md
- API.md
- DEPLOYMENT.md
- SECURITY.md
- packages/proxy/src/api/generate.ts
- packages/proxy/src/utils/explorer-policy.ts
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/test/explorer-policy.test.ts
- packages/nuxt/src/generate.ts
- packages/nuxt/src/runtime/server-middleware.ts
- packages/proxy/src/api/schema.ts
- packages/proxy/src/plugins/btp-auth.ts
- packages/proxy/src/utils/btp-destination.ts
- packages/proxy/src/utils/target.ts
- packages/explorer/composables/useODataState.ts
- the implementation commit diff for task 080

Review stance:
- Findings first.
- Prioritize production endpoint semantics, auth/header/TLS behavior, stale-cache fallback, generation boundaries, unsupported host behavior, docs accuracy, and missing tests.
- Confirm production refresh updates metadata cache state only and never invokes `odata2ts` or writes generated TypeScript files.
- Confirm development SDK regeneration still works when the Nuxt generator is present.
- Confirm no db0, evlog, unrelated Explorer UI redesign, or normal data proxy behavior changes were introduced.

Verification context from Implementer:
- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd exec vitest run packages/nuxt/test/generate.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/nuxt run playground:check`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes

Create or update a review note under .agents/reviews/ using REVIEW_TEMPLATE.md.
Update .agents/NEXT.md and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.
```
