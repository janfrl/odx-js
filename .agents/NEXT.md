# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 088 review found one bounded production BTP destination
resolution gap and needs a focused Integrator fix.

## Current Next Step

Start a fresh Integrator for task 088 using review note:
`.agents/reviews/088-cover-btp-destination-metadata-refresh-review.md`.

## Prompt For Next Chat

```txt
You are the Integrator for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Address review findings for:
.agents/tasks/done/088-cover-btp-destination-metadata-refresh.md

Review note:
.agents/reviews/088-cover-btp-destination-metadata-refresh-review.md

Reviewed implementation commit:
4b28a6e9dabc6356a15c544f8663ec948eb3a5c5

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/integrator.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- .agents/reviews/088-cover-btp-destination-metadata-refresh-review.md
- SECURITY.md
- DEPLOYMENT.md
- .agents/tasks/done/088-cover-btp-destination-metadata-refresh.md
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/src/utils/target.ts
- packages/proxy/src/utils/btp-destination.ts
- packages/proxy/src/api/generate.ts
- packages/proxy/test/explorer-policy.test.ts
- packages/proxy/test/btp-destination.test.ts
- the latest diff since reviewed commit 4b28a6e9dabc6356a15c544f8663ec948eb3a5c5

Rules:
- Fix only the concrete review finding in the task 088 review note.
- Keep the fix scoped to production runtime metadata refresh and BTP
  destination resolution failure handling.
- Preserve local development BTP fallback behavior unless the focused fix
  requires a strict-mode branch for metadata refresh.
- Preserve normal OData proxy resolver default behavior unless the review
  finding cannot be fixed safely without a shared helper option.
- Add a deterministic regression test for a production destination-backed
  `/__odx__/generate?service=<name>` refresh with stale cache present and no
  usable Destination/XSUAA binding. Assert the response remains
  `operation: "metadata-refresh"`, `generated: false`, `source: "cache"`, does
  not invoke the injected generator, and reports a BTP binding/resolution
  stale reason instead of a local fallback 404/path.
- Do not require live SAP BTP services or external network access.
- Do not alter Explorer UI, unrelated direct-service behavior, dependencies,
  lockfiles, generated files, or unrelated docs.

Verification:
- Run `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`.
- Run `pnpm.cmd --filter @bc8-odx/proxy run verify`.
- Run `pnpm.cmd run lint`.
- Run `pnpm.cmd run typecheck`.
- Run `git diff --check`.

Before finishing:
- Update the task handoff notes if the fix changes implementation details or
  verification results.
- Update `.agents/reviews/088-cover-btp-destination-metadata-refresh-review.md`
  with an Integrator Update.
- Update `.agents/NEXT.md` with a focused re-review prompt.
- Commit the integration fix with a Conventional Commit unless a stop condition
  prevents committing.

When done, summarize:
- findings addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
