# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Review completed documentation task
`.agents/tasks/done/084-document-dev-prod-explorer-runtime-differences.md`
before continuing to the remaining production runtime sequence.

After review approval, continue with:

1. `.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md`
2. `.agents/tasks/ready/079-add-db0-backed-explorer-log-store.md`
3. `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
4. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
5. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
6. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/084-document-dev-prod-explorer-runtime-differences.md

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/reviews/077-harden-production-explorer-endpoints-and-config-review.md
- .agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md
- .agents/tasks/done/084-document-dev-prod-explorer-runtime-differences.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- relevant changed docs under docs/content/en and docs/content/de
- the changed diff

Review stance:
- Findings first.
- Check that the docs match task 077 behavior and do not over-promise db0, production logs, runtime metadata refresh, SDK generation, or UI behavior.
- Check English and German docs stay aligned where both language trees contain relevant pages.
- Check that the change is documentation/workflow-only and does not reorder remaining tasks.
- Verify or inspect the recorded checks: `git diff --check` and `pnpm.cmd --filter docs run verify`.

Output:
- findings with severity and file/line references
- acceptance criteria status
- verification gaps
- whether the task is approved or needs changes

Create or update a review note under `.agents/reviews/` using `REVIEW_TEMPLATE.md`.
Update `.agents/NEXT.md` with the next workflow action. If approved, point it to
`.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md`. Commit the
review note and workflow state changes with a Conventional Commit unless a stop
condition prevents committing. Include the exact next-chat prompt the operator
should paste into a new chat.
```
