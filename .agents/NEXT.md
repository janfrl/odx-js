# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Fix the needs-changes review for the completed high-risk production runtime
task:
`.agents/tasks/done/078-introduce-odx-log-store-and-redaction.md`.

Review note:
`.agents/reviews/078-introduce-odx-log-store-and-redaction-review.md`.

Do not start task 079 until the review findings are fixed and focused
re-review approves task 078.

Continue the remaining production runtime sequence in this order after review
approval:

1. `.agents/tasks/ready/079-add-db0-backed-explorer-log-store.md`
2. `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
3. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
4. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
5. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Integrator for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Address the needs-changes review for:
- Task: .agents/tasks/done/078-introduce-odx-log-store-and-redaction.md
- Review: .agents/reviews/078-introduce-odx-log-store-and-redaction-review.md
- Reviewed commit: c9ef7aa865ad2c6147af8581bb19dbd054bcbeeb

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/078-introduce-odx-log-store-and-redaction.md
- .agents/reviews/078-introduce-odx-log-store-and-redaction-review.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- packages/core/src/dev-logs.ts
- packages/proxy/src/utils/rules.ts
- packages/proxy/src/utils/trace.ts
- packages/proxy/test/dev-logs.test.ts
- packages/proxy/test/rules.test.ts
- docs/public/api-reference.json

Rules:
- Fix only the concrete review findings.
- Do not add db0, evlog, metadata refresh, SDK generation behavior, database migration, Explorer UI redesign, or unrelated refactors.
- Preserve production `/__odx__/logs` disabled policy.
- Preserve local Explorer traffic-log behavior with the memory store.
- Ensure sensitive header values in `proxyTrace.details` are redacted before storage, not just bounded.
- Refresh the tracked docs API reference artifact if public/core exports remain changed.
- Update task handoff notes and `.agents/NEXT.md` with a focused re-review prompt.
- Commit the focused integration fix with a Conventional Commit.

Expected verification:
- Add or update focused tests proving `injectHeader` and `denyIfHeader` trace details do not retain sensitive header values after log storage.
- `pnpm.cmd exec vitest run packages/proxy/test/dev-logs.test.ts packages/proxy/test/rules.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter docs run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

When done, summarize:
- findings addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
