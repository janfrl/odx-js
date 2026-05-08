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

Task 080 focused production metadata-refresh auth issue has an Integrator fix
and needs focused re-review before approval:
`.agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md`.

Continue the remaining production runtime sequence in this order after task
080 focused re-review approval:

1. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
2. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
3. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
4. `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Focused re-review task 080 after the Integrator fix:
- `.agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
- `.agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md`

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/test/explorer-policy.test.ts
- packages/proxy/src/utils/target.ts
- packages/proxy/src/api/odata.ts

Rules:
- Review only the Integrator fix for the direct-service metadata refresh auth finding.
- Confirm production metadata refresh preserves direct-service auth semantics and does not send service/global configured Authorization headers for `strategy: "direct"` absolute-url services when normal direct proxy access would skip managed auth.
- Confirm production SDK-generation separation remains intact: production refresh updates metadata cache state only and never invokes the Nuxt generator or writes generated TypeScript SDK files.
- Check the focused regression test covers direct absolute-url service behavior with configured global/service auth.
- Do not broaden into db0, evlog, unrelated Explorer UI, normal data proxy behavior, or broad docs.
- Update the review note with approved or remaining needs-changes status.
- Update `.agents/NEXT.md` with the next workflow action.
- Commit the review/workflow update with a Conventional Commit.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
- `git diff --check`

Output:
- findings
- acceptance criteria status for the focused fix
- verification performed
- whether task 080 is approved
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
