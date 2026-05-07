# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Review the completed high-risk production runtime task:
`.agents/tasks/done/078-introduce-odx-log-store-and-redaction.md`.

Do not start task 079 until this review is complete.

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

Review the completed task:
.agents/tasks/done/078-introduce-odx-log-store-and-redaction.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/reviews/077-harden-production-explorer-endpoints-and-config-review.md
- .agents/reviews/084-document-dev-prod-explorer-runtime-differences-review.md
- .agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md
- .agents/tasks/done/084-document-dev-prod-explorer-runtime-differences.md
- .agents/tasks/done/078-introduce-odx-log-store-and-redaction.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- changed source, tests, and docs from the task 078 commit

Review stance:
- Findings first, ordered by severity.
- Prioritize security/privacy regressions, redaction gaps, payload retention,
  production `/__odx__/logs` policy, public/core export contracts, store
  semantics, compatibility with existing proxy trace updates, and missing
  tests.
- Check that task 078 stayed scoped and did not add db0, evlog, metadata
  refresh, SDK generation, database migration, or Explorer UI redesign.
- Check that durable docs match the implemented store/redaction behavior.

Expected verification:
- Inspect the task 078 diff.
- Run or validate the focused checks recorded in the task handoff where useful:
  `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
  `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts`
  `pnpm.cmd --filter @bc8-odx/proxy run verify`
  `pnpm.cmd --filter @bc8-odx/explorer run verify`
  `pnpm.cmd run lint`
  `pnpm.cmd run typecheck`

Output:
- findings with severity and file/line references
- acceptance criteria status
- verification performed or intentionally skipped
- residual risk
- whether the task is approved or needs changes
- create or update a review note under `.agents/reviews/`
- update `.agents/NEXT.md` with the next workflow action
- commit the review note and workflow state changes with a Conventional Commit
- include the exact next-chat prompt from `.agents/NEXT.md`
```
