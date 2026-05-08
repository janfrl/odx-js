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

Task 079 received a focused Integrator fix for the missing PostgreSQL runtime
dependency documented in
`.agents/reviews/079-add-db0-backed-explorer-log-store-review.md`.

Use a fresh Reviewer to perform focused re-review of only that fix before task
079 can be approved and before continuing the remaining production runtime
sequence:

1. `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
2. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
3. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
4. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Perform focused re-review of the task 079 Integrator fix:
- Task: .agents/tasks/done/079-add-db0-backed-explorer-log-store.md
- Review: .agents/reviews/079-add-db0-backed-explorer-log-store-review.md
- Reviewed commit: 48e9432c2daa05e8aeb073979f06119f34c83491

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/tasks/done/079-add-db0-backed-explorer-log-store.md
- .agents/reviews/079-add-db0-backed-explorer-log-store-review.md
- packages/proxy/package.json
- pnpm-lock.yaml

Rules:
- Review only the focused Integrator fix for the task 079 needs-changes finding.
- Confirm `@bc8-odx/proxy` declares the required `pg` runtime dependency for the documented `db0/connectors/postgresql` path.
- Confirm `pnpm-lock.yaml` changes are limited to the required PostgreSQL dependency graph and do not introduce unrelated package churn.
- Confirm `@types/pg` is absent unless the package or type flow actually requires it.
- Do not reopen unrelated task 079 design, Explorer UI, public contracts, production payload policy, metadata refresh, or unrelated source.
- Update the review note and `.agents/NEXT.md`.
- Commit the focused re-review/workflow notes with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd --filter @bc8-odx/proxy exec node -e "import('db0/connectors/postgresql').then(()=>console.log('ok')).catch(e=>{console.error(e.code||e.message); process.exit(1)})"`
- `git diff --check`

When done, summarize:
- findings
- acceptance status for the focused fix
- verification performed
- whether task 079 is approved or still needs changes
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```
