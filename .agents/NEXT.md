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

Task 080 review found one focused production metadata-refresh auth issue that
needs an Integrator fix before approval:
`.agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md`.

Continue the remaining production runtime sequence in this order after task
080 focused fix and re-review approval:

1. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
2. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
3. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
4. `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

## Prompt For Next Chat

```txt
You are the Integrator for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Address the focused review finding for task 080:
- `.agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
- `.agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/integrator.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- ARCHITECTURE.md
- API.md
- DEPLOYMENT.md
- SECURITY.md
- packages/proxy/src/api/generate.ts
- packages/proxy/src/utils/explorer-policy.ts
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/test/explorer-policy.test.ts
- packages/proxy/src/utils/target.ts
- packages/proxy/src/api/odata.ts

Rules:
- Fix only the review finding: production metadata refresh must preserve direct-service auth semantics and must not send service/global configured Authorization headers for `strategy: "direct"` services when normal direct proxy access would skip managed auth.
- Keep production SDK-generation separation intact: production refresh must update metadata cache state only and never invoke the Nuxt generator or write generated TypeScript SDK files.
- Add a focused regression test for a direct absolute-url service with service or global auth asserting production metadata refresh does not send that configured Authorization header.
- Do not change db0, evlog, unrelated Explorer UI, normal data proxy behavior, or broad docs unless the focused fix requires a tiny clarification.
- Update the task handoff notes and review note if useful.
- Update `.agents/NEXT.md` with a focused re-review prompt.
- Commit the integration fix with a Conventional Commit.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `git diff --check`

Output:
- finding addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
