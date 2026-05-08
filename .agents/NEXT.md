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

Task 080 is approved after focused re-review. Start implementation of:
`.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`.

Continue the remaining production runtime sequence in this order:

1. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
2. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
3. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
4. `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
- `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- packages/proxy/src/api/config.ts
- packages/proxy/src/api/schema.ts
- packages/proxy/src/api/types.ts
- packages/proxy/src/utils/metadata-refresh.ts
- packages/core/src/server/*
- packages/explorer/composables/useODataState.ts
- packages/explorer/composables/useSchemaExplorer.ts
- packages/explorer/test/state.test.ts

Rules:
- Keep changes scoped to task 081.
- Make `/__odx__/schema` and `/__odx__/config` read schema information from the runtime metadata cache instead of relying on `.nuxt` generated files or ad hoc production filesystem writes.
- Keep local EDMX file support for development and fixtures.
- Avoid regenerating SDK/types in production.
- Do not change normal OData proxy responses.
- Do not implement db0, evlog, or broad Explorer UI redesign.
- Add or update focused tests for cached metadata, stale metadata, missing metadata, and local EDMX behavior.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next workflow action. Because task 081 is high risk, request a fresh Reviewer after implementation.
- Commit the completed task with a Conventional Commit.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Output:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
