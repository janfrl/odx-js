# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Run focused re-review for the task 078 integration fix:
`.agents/tasks/done/078-introduce-odx-log-store-and-redaction.md`.

Review note:
`.agents/reviews/078-introduce-odx-log-store-and-redaction-review.md`.

Reviewed base commit:
`c9ef7aa865ad2c6147af8581bb19dbd054bcbeeb`.

Integration fix:
review the current branch HEAD after the focused integration commit.

Do not start task 079 until focused re-review approves task 078.

Continue the remaining production runtime sequence in this order after review
approval:

1. `.agents/tasks/ready/079-add-db0-backed-explorer-log-store.md`
2. `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
3. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
4. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
5. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Run a focused re-review for the task 078 needs-changes integration fix:
- Task: .agents/tasks/done/078-introduce-odx-log-store-and-redaction.md
- Review: .agents/reviews/078-introduce-odx-log-store-and-redaction-review.md
- Reviewed commit: c9ef7aa865ad2c6147af8581bb19dbd054bcbeeb
- Integration fix: current branch HEAD

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

Review stance:
- Review only the two needs-changes findings from the review note.
- Confirm `proxyTrace.details` redacts sensitive header values before storage for `injectHeader`, `denyIfHeader`, and nested objects keyed by sensitive header names.
- Confirm the tracked docs API reference artifact is refreshed for the task 078 public/core export changes.
- Confirm production `/__odx__/logs` remains disabled and no db0, evlog, metadata refresh, SDK generation behavior, database migration, Explorer UI redesign, or unrelated refactor was introduced.
- Findings first. If no actionable issue remains, approve task 078.

Verification to inspect or rerun as needed:
- `pnpm.cmd exec vitest run packages/proxy/test/dev-logs.test.ts packages/proxy/test/rules.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter docs run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Update `.agents/reviews/078-introduce-odx-log-store-and-redaction-review.md` with the focused re-review result, update `.agents/NEXT.md`, and commit the review/workflow note changes with a Conventional Commit.

When done, summarize:
- findings
- acceptance criteria status for the two reviewed findings
- verification performed
- whether task 078 is approved or still needs changes
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```
