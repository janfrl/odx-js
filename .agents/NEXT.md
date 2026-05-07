# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Use Secure Teamflow for the production Explorer runtime
sequence because it touches auth, privacy, persistence, deployment runtime
behavior, and internal HTTP contracts.

## Current Next Step

Implement `.agents/tasks/ready/077-harden-production-explorer-endpoints-and-config.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- DOMAIN_MODEL.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/ready/077-harden-production-explorer-endpoints-and-config.md
- packages/core/src/types.ts
- packages/nuxt/src/config.ts
- packages/proxy/src/nitro.ts
- packages/proxy/src/api/config.ts
- packages/proxy/src/api/logs.ts
- packages/proxy/src/api/generate.ts
- packages/proxy/src/api/schema.ts
- packages/proxy/src/api/types.ts
- packages/proxy/src/api/me.ts
- packages/proxy/src/plugins/auth-btp.ts
- packages/explorer/composables/useODataState.ts

Implement exactly `.agents/tasks/ready/077-harden-production-explorer-endpoints-and-config.md`.

Rules:
- Treat this as Secure Teamflow/high-risk work.
- Add focused tests before or alongside implementation for production endpoint policy and config redaction.
- Make production `/__odx__/config` return sanitized service information only.
- Preserve local development Explorer ergonomics.
- Do not add db0, evlog, persistence, metadata refresh, SDK generation changes, or Explorer UI redesign in this task.
- Update ARCHITECTURE.md, API.md, SECURITY.md, and DEPLOYMENT.md only where the endpoint policy contract changes.
- Run the verification steps listed in the task, or explain why they could not be run.
- Move the task to `.agents/tasks/done/` only after implementation and verification are complete.
- Update `.agents/NEXT.md` to a Reviewer prompt for this task, because review is required.
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
