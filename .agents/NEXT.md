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

Task 086 implementation is complete and requires separate review. Start a fresh
Reviewer chat for:
`.agents/tasks/done/086-document-dev-prod-explorer-runtime-differences.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
- `.agents/tasks/done/086-document-dev-prod-explorer-runtime-differences.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/086-document-dev-prod-explorer-runtime-differences.md
- .agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md
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
- relevant English and German Docus pages changed by task 086
- the latest commit diff

Rules:
- Review in a fresh code-review stance; findings first.
- Check the implementation against task 086 scope, non-goals, acceptance criteria, and handoff notes.
- Confirm root docs and Docus docs do not contradict each other on Explorer development versus production runtime behavior.
- Confirm English and German docs are semantically aligned.
- Confirm the docs do not expose customer-specific BTP routes, credentials, destinations, backend URLs, auth details, outbound headers, TLS settings, runtime paths, or hooks.
- Confirm no runtime code, Explorer UI, tests, package metadata, generated app output, endpoints, logging providers, persistence adapters, or metadata generation features were changed.
- Create or update a review note under `.agents/reviews/` using `.agents/reviews/REVIEW_TEMPLATE.md` if present.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat prompt.
- Commit the review note and workflow state changes with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- findings with severity and file/line references, or state that no findings were found
- acceptance criteria status
- verification reviewed or run
- whether the task is approved or needs changes
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
