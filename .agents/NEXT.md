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

Task 079 implementation is complete and requires independent review:
`.agents/tasks/done/079-add-db0-backed-explorer-log-store.md`.

Use a fresh Reviewer that did not participate in the implementation. Continue
the remaining production runtime sequence only after task 079 review is
approved:

1. `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
2. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
3. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
4. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/079-add-db0-backed-explorer-log-store.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/079-add-db0-backed-explorer-log-store.md
- .agents/tasks/done/078-introduce-odx-log-store-and-redaction.md
- .agents/reviews/078-introduce-odx-log-store-and-redaction-review.md
- SECURITY.md
- DEPLOYMENT.md
- API.md
- ARCHITECTURE.md
- changed files and diff for the task 079 commit

Review stance:
- Findings first.
- Prioritize correctness, architecture boundaries, security/privacy, persistence behavior, deployment configuration, dependency scope, db0 isolation, redaction, production `/__odx__/logs` behavior, missing tests, and acceptance criteria gaps.
- Confirm db0 remains behind the `OdxLogStore` boundary and is not exposed to Explorer or public ODX contracts.
- Confirm memory storage remains the default and production payload bodies are not stored.
- Confirm `pnpm-lock.yaml` changes are limited to the direct `db0` dependency for `packages/proxy`.

Verification to inspect or rerun if needed:
- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes

Create or update a review note under .agents/reviews/ using REVIEW_TEMPLATE.md.
Update .agents/NEXT.md and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.
```
