# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Review completed task `.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md

Read:
- AGENTS.md
- CONTRIBUTING.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- DOMAIN_MODEL.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md
- packages/core/src/types.ts
- packages/proxy/src/utils/explorer-policy.ts
- packages/proxy/src/api/config.ts
- packages/proxy/src/api/logs.ts
- packages/proxy/src/api/generate.ts
- packages/proxy/src/api/schema.ts
- packages/proxy/src/api/types.ts
- packages/proxy/src/api/me.ts
- packages/proxy/src/plugins/auth-btp.ts
- packages/proxy/test/explorer-policy.test.ts
- packages/explorer/composables/useODataState.ts
- packages/explorer/test/state.test.ts
- packages/approuter/xs-app.json
- packages/approuter/test/deployment-config.test.ts
- the completed commit diff

Review stance:
- Findings first.
- Prioritize correctness, architecture boundaries, security/privacy, authorization, public/internal contracts, missing tests, and acceptance criteria gaps.
- Check that production /__odx__/config is whitelist-based and does not expose url, destination, auth, headers, rules, unknown service fields, global secrets, runtime paths, hooks, devtools config, forwardAuthHeader, or versions.node.
- Check production endpoint policy: all /__odx__/* require validated SAP security context; generate/types are 403; schema blocks raw XML and does not live-refresh metadata; logs are disabled/empty and cannot be cleared; me is sanitized.
- Check local development Explorer ergonomics are preserved.
- Check the AppRouter /__odx__/* route and deployment test.
- Check that no db0, evlog, persistence, metadata refresh, SDK generation, public basePath proxy behavior, or Explorer UI redesign scope was added.
- Check that durable endpoint policy documentation is accurate.

Verification performed by implementer:
- pnpm.cmd exec vitest run packages/proxy/test
- pnpm.cmd --filter @bc8-odx/proxy run verify
- pnpm.cmd --filter @bc8-odx/explorer run verify
- pnpm.cmd --filter odx-approuter run verify
- pnpm.cmd run lint
- pnpm.cmd run typecheck
- git diff --check

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes

Create or update a review note under .agents/reviews/ using REVIEW_TEMPLATE.md.
Update .agents/NEXT.md and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.
```
