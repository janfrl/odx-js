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

Task 085 is approved after focused re-review. Implement task 086:
`.agents/tasks/ready/086-document-dev-prod-explorer-runtime-differences.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
- `.agents/tasks/ready/086-document-dev-prod-explorer-runtime-differences.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/ready/086-document-dev-prod-explorer-runtime-differences.md
- .agents/tasks/done/077-document-explorer-prod-dev-differences.md
- .agents/tasks/done/078-introduce-odx-log-store-and-redaction.md
- .agents/tasks/done/079-add-db0-backed-explorer-log-store.md
- .agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md
- .agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md
- .agents/tasks/done/082-align-standalone-explorer-runtime-ui.md
- .agents/tasks/done/083-complete-or-remove-explorer-mockdata-api.md
- .agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md
- .agents/reviews/085-refresh-user-facing-explorer-runtime-docs-review.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- docs/content/en/5.explorer/2.reference.md
- docs/content/de/5.explorer/2.reference.md
- relevant English and German Docus pages under docs/content

Rules:
- Move task 086 to `.agents/tasks/in-progress/` when starting and to `.agents/tasks/done/` only after implementation and verification pass.
- Keep changes scoped to task 086 documentation and workflow state.
- Do not change runtime API behavior or Explorer UI.
- Do not add new endpoints, logging providers, persistence adapters, or metadata generation features.
- Do not document unapproved future work as current behavior.
- Do not expose customer-specific BTP routes, credentials, destinations, backend URLs, auth details, outbound headers, TLS settings, runtime paths, or hooks.
- Create a coherent English and German user-facing development-versus-production Explorer runtime comparison.
- Keep root docs and Docus docs consistent where both describe the same Explorer runtime behavior.
- Run `git diff --check`.
- Run `pnpm.cmd --filter docs run verify`.
- Perform the manual stale-word, English/German alignment, and sensitive-detail checks listed in the task.
- Update task 086 handoff notes before finishing.
- Decide whether separate review is required using `.agents/WORKFLOW.md`; task 086 marks review as required.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
