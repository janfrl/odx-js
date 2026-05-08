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

Task 079 review found one focused needs-changes issue:
`.agents/reviews/079-add-db0-backed-explorer-log-store-review.md`.

Use a focused Integrator to fix only the missing PostgreSQL runtime dependency
for the db0-backed Explorer log store, then request focused re-review before
continuing the remaining production runtime sequence:

1. `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
2. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
3. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
4. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Integrator for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Address the needs-changes finding for task 079:
- Task: .agents/tasks/done/079-add-db0-backed-explorer-log-store.md
- Review: .agents/reviews/079-add-db0-backed-explorer-log-store-review.md
- Reviewed commit: 48e9432c2daa05e8aeb073979f06119f34c83491

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/integrator.md
- .agents/tasks/done/079-add-db0-backed-explorer-log-store.md
- .agents/reviews/079-add-db0-backed-explorer-log-store-review.md
- DEPLOYMENT.md
- packages/proxy/src/utils/log-store.ts
- packages/proxy/package.json
- pnpm-lock.yaml

Rules:
- Fix only the review finding: the documented db0 PostgreSQL connector path dynamically imports `db0/connectors/postgresql`, but `packages/proxy` does not declare the required `pg` runtime dependency.
- Add the minimal dependency/package-lock changes needed to make the documented PostgreSQL production path deployable.
- Add `@types/pg` only if the package or type flow actually needs it.
- Keep db0 and PostgreSQL implementation details behind the existing `OdxLogStore` boundary.
- Do not change Explorer UI, public contracts, production payload policy, metadata refresh, or unrelated source.
- Update task/review handoff notes and `.agents/NEXT.md`.
- Commit the focused fix with a Conventional Commit.

Verification:
- `pnpm.cmd --filter @bc8-odx/proxy exec node -e "import('db0/connectors/postgresql').then(()=>console.log('ok')).catch(e=>{console.error(e.code||e.message); process.exit(1)})"`
- `pnpm.cmd exec vitest run packages/proxy/test/db0-log-store.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

When done, summarize:
- finding addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```
