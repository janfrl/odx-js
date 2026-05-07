# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Implement the next production runtime task:
`.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md`.

Continue the remaining production runtime sequence in this order:

1. `.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md`
2. `.agents/tasks/ready/079-add-db0-backed-explorer-log-store.md`
3. `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
4. `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
5. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
6. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly this task:
.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md

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
- .agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- relevant package source and tests referenced by the task

Rules:
- Keep changes scoped to task 078.
- Introduce the `OdxLogStore` boundary and redaction policy before any db0
  adapter work.
- Do not add db0, evlog, production persistence, metadata refresh, SDK
  generation, or unrelated Explorer UI changes.
- Preserve local development Explorer ergonomics unless the task explicitly
  calls for a security hardening change.
- Add focused tests for log store behavior, redaction, retention, payload
  limits, production endpoint policy, and development compatibility as required
  by the task.
- Update root docs only where the implemented log boundary/redaction contract
  changes durable behavior.
- Run the verification steps listed in the task, or explain skipped checks and
  residual risk in the handoff notes.
- Move the task to `.agents/tasks/done/` only after implementation and
  verification.
- Update `.agents/NEXT.md` with the next workflow action.
- Commit the completed task with a Conventional Commit unless a stop condition
  prevents committing.

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
