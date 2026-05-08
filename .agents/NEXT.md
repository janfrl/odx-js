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

Task 082 review is approved. Continue the remaining production runtime sequence
with the next ready task:
`.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`.

After task 083 is implemented and reviewed as required, continue with:
`.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly this task:
- `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md
- .agents/reviews/082-align-standalone-explorer-runtime-ui-review.md
- packages/proxy/src/nitro.ts
- packages/proxy/src/api/*
- packages/explorer/composables/useODataState.ts
- packages/explorer/composables/useEntityExplorer.ts
- packages/explorer/test/state.test.ts
- docs/content/en/5.explorer/1.setup.md
- docs/content/de/5.explorer/1.setup.md

Rules:
- Keep changes scoped to task 083.
- Decide within implementation whether to add a real mock-data backend handler or remove the exposed UI/state call.
- If adding a handler, keep it clearly development/mock-only and protect it in production.
- If removing the call, update Explorer UI/state and docs so mock-data clearing is not advertised as a server feature.
- Do not add db0.
- Do not implement full mock data management unless the minimal clear behavior is already well-defined and safe.
- Do not change normal OData proxy behavior.
- Do not redesign Explorer data browser UI beyond removing or wiring the mismatched action.
- Add focused tests for the chosen behavior.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` only after implementation and verification.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

When done, summarize:
- changed files
- implementation summary
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
