# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Task 078 focused re-review is approved. Start the next high-risk production
runtime sequence task:
`.agents/tasks/ready/079-add-db0-backed-explorer-log-store.md`.

Continue the remaining production runtime sequence in this order after review
task 079:

1. `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
2. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
3. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
4. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
.agents/tasks/ready/079-add-db0-backed-explorer-log-store.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/ready/079-add-db0-backed-explorer-log-store.md
- .agents/tasks/done/078-introduce-odx-log-store-and-redaction.md
- .agents/reviews/078-introduce-odx-log-store-and-redaction-review.md
- SECURITY.md
- DEPLOYMENT.md
- API.md
- ARCHITECTURE.md

Rules:
- Keep changes scoped to task 079.
- Add db0 only where the persistent Explorer log store implementation needs it.
- Keep db0 behind the existing ODX log store boundary; do not leak db0-specific APIs into Explorer or public ODX contracts.
- Keep memory storage as the default for local development and tests unless persistent storage is explicitly configured.
- Do not add evlog, metadata caching, Explorer database access, unredacted payload storage, or unrelated UI redesign.
- Document BTP production database binding expectations and SQLite limitations.
- Update task handoff notes, move the task to done only after implementation and verification, update `.agents/NEXT.md`, and commit with a Conventional Commit.

Expected verification:
- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- Confirm `pnpm-lock.yaml` changes match the added db0 dependency only.
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
