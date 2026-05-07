# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, and internal HTTP contracts.

## Current Next Step

Focused re-review of the integration fix for task
`.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the integration fix for the completed task:
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
- the original reviewed commit `1b07b23aa94eac56563db15c1ff08378d7343084`
- the latest integration fix commit diff

Review stance:
- Findings first.
- Focus only on the two review findings that were fixed.
- P1: Confirm AppRouter sends `/__odx__/client` and `/__odx__/client/*` to `odx-explorer-ui`, while `/__odx__/config`, `/__odx__/logs`, `/__odx__/schema`, `/__odx__/generate`, `/__odx__/types`, and `/__odx__/me` go to `odx-proxy-backend`.
- P1: Confirm the runtime API route is narrow enough not to swallow Explorer client routes/assets.
- P3: Confirm production `/__odx__/config` intentionally exposes top-level `basePath`, `mode`, and `services`, and that tests/docs treat `basePath` and `mode` as production-whitelisted fields.
- P3: Confirm config redaction remains strict for backend URLs, destinations, auth, headers, rules, unknown service fields, global secrets, runtime paths, hooks, devtools config, `forwardAuthHeader`, and `versions.node`.
- Check that no db0, evlog, persistence, metadata refresh, SDK generation behavior, public basePath proxy behavior, or Explorer UI redesign scope was added.

Verification performed by integrator:
- pnpm.cmd --filter odx-approuter run verify
- pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts
- pnpm.cmd --filter @bc8-odx/explorer run verify
- pnpm.cmd run lint
- pnpm.cmd run typecheck
- git diff --check

Note:
- Direct root-level `pnpm.cmd exec vitest run packages/explorer/test/state.test.ts` failed before test collection with a Nuxt import-resolution error; the documented package-local Explorer verify passed.
- Initial sandboxed Vitest commands hit Windows process spawning restrictions (`EPERM`) or could not launch `vitest`; elevated reruns passed.

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the focused fix is approved or needs changes

Create or update a review note under .agents/reviews/ using REVIEW_TEMPLATE.md.
Update .agents/NEXT.md and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.
```
