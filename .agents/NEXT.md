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

Task 081 review found one focused production privacy issue. Start an Integrator
chat to fix only the finding in:
`.agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md`.

After the focused fix and re-review approve task 081, continue the remaining
production runtime sequence in this order:

1. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
2. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
3. `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

## Prompt For Next Chat

```txt
You are the Integrator for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Address the review finding for completed task 081:
- `.agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md`
- `.agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/integrator.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md
- .agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md
- packages/proxy/src/api/config.ts
- packages/proxy/src/api/schema.ts
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/test/explorer-policy.test.ts

Rules:
- Fix only the review finding: production `/__odx__/config` and `/__odx__/schema` must not expose raw stale metadata failure details that can contain backend metadata URLs or hostnames.
- Keep actionable stale/missing metadata status for Explorer.
- Do not change normal OData proxy responses.
- Do not add db0, evlog, persistence dependencies, generated SDK changes, or broad Explorer UI redesign.
- Add a focused regression test where refresh falls back after invalid metadata from an internal URL and production config/schema responses do not contain that URL.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Output:
- findings addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
