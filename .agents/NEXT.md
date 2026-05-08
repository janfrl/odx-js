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

Task 082 implementation is complete and requires independent review. Because
task 082 is review-required, start a fresh Reviewer chat for:
`.agents/tasks/done/082-align-standalone-explorer-runtime-ui.md`.

After task 082 review approval, continue the remaining production runtime
sequence in this order:

1. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
2. `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
- `.agents/tasks/done/082-align-standalone-explorer-runtime-ui.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/082-align-standalone-explorer-runtime-ui.md
- .agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md
- .agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md
- .agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md
- packages/explorer/nuxt.config.ts
- packages/explorer/composables/useODataState.ts
- packages/explorer/composables/useEntityExplorer.ts
- packages/explorer/components/DataEditor.vue
- packages/explorer/components/entity/OfflineState.vue
- packages/explorer/components/tabs/TabOverview.vue
- packages/explorer/components/tabs/TabProxy.vue
- packages/explorer/components/tabs/TabServices.vue
- packages/explorer/test/state.test.ts
- the implementation diff for task 082

Review stance:
- Findings first.
- Prioritize production/runtime messaging correctness, standalone API-base behavior, stale/missing metadata UI state, generated type/SDK wording, layout regressions, and missing tests.
- Confirm production-like configs show Refresh Metadata semantics and do not imply production SDK regeneration.
- Confirm local development SDK regeneration affordances remain available only when config indicates support.
- Confirm configured `odxApiBase` is applied consistently to internal Explorer APIs and runtime proxy calls without changing proxy endpoint security.
- Confirm no persistence dependency, metadata cache implementation change, db0, evlog, or marketing/landing-page scope was introduced.

Verification:
- inspect or rerun `pnpm.cmd --filter @bc8-odx/explorer run verify`
- inspect or rerun `pnpm.cmd run lint`
- inspect or rerun `pnpm.cmd run typecheck`
- inspect the recorded headless Chrome browser check:
  `C:\tmp\odx-explorer-task082.png`, URL
  `http://127.0.0.1:3401/__odx__/client/`, viewport `1440x1000`
- `git diff --check`

Output:
- findings with severity and file/line references
- acceptance criteria status
- verification performed
- whether task 082 is approved or needs changes
- create or update a review note under `.agents/reviews/`
- update `.agents/NEXT.md` with the next workflow action
- commit the review note and workflow state changes with a Conventional Commit
- exact next-chat prompt from `.agents/NEXT.md`
```
