# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Implement documentation task
`.agents/tasks/ready/084-document-dev-prod-explorer-runtime-differences.md`
before continuing the remaining production runtime sequence:

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
.agents/tasks/ready/084-document-dev-prod-explorer-runtime-differences.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- relevant existing docs under docs/content/en and docs/content/de

Rules:
- Make only documentation changes required by task 084.
- Do not change runtime code, tests, package configuration, or remaining task ordering.
- Keep current behavior and planned future behavior clearly separated.
- Document development versus production Explorer behavior, auth differences, production `/__odx__` endpoint policies, production config redaction allowlist, runtime metadata refresh versus SDK generation, production-disabled logs, planned db0 follow-up, and development redaction/payload limits.
- Keep English and German docs aligned when both language trees contain relevant pages.
- Run `git diff --check`; run `pnpm.cmd --filter docs run verify` if practical.
- Move the task to `.agents/tasks/done/` only after implementation and verification.
- Update `.agents/NEXT.md` to continue with `.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md` unless a stop condition applies.
- Commit the completed documentation task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was documented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
