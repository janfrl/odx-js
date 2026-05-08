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

Task 079 is approved after focused re-review. Continue with the next high-risk
production runtime sequence task:
`.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`.

Continue the remaining production runtime sequence in this order after task
080:

1. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
2. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
3. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md
- .agents/tasks/done/079-add-db0-backed-explorer-log-store.md
- .agents/reviews/079-add-db0-backed-explorer-log-store-review.md
- .agents/tasks/done/078-introduce-odx-log-store-and-redaction.md
- ARCHITECTURE.md
- API.md
- DEPLOYMENT.md
- SECURITY.md
- packages/nuxt/src/generate.ts
- packages/nuxt/src/runtime/server-middleware.ts
- packages/proxy/src/api/generate.ts
- packages/proxy/src/api/schema.ts
- packages/proxy/src/plugins/btp-auth.ts
- packages/proxy/src/utils/btp-destination.ts
- packages/proxy/src/utils/target.ts
- packages/explorer/composables/useODataState.ts

Rules:
- Keep changes scoped to task 080.
- Separate runtime metadata refresh from TypeScript SDK generation.
- Production refresh must update metadata cache state only and must not run
  `odata2ts` or write generated TypeScript files.
- Development SDK regeneration must keep working when the Nuxt generator is
  present.
- Use production-compatible service resolution, auth, headers, and TLS behavior
  for runtime metadata fetching.
- Preserve stale-cache fallback behavior.
- Do not add db0, evlog, unrelated Explorer UI redesign, or normal data proxy
  behavior changes.
- Update docs where the Refresh Metadata versus Regenerate SDK contract changes.
- Move the task to done only after implementation and verification.
- Update `.agents/NEXT.md` with the next workflow action.
- Commit with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd exec vitest run packages/nuxt/test/generate.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/nuxt run playground:check`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
