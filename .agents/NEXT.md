# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 088 Integrator fix is complete and needs focused
re-review because it touches production BTP destination resolution behavior for
runtime metadata refresh.

## Current Next Step

Start a fresh Reviewer for the focused task 088 Integrator fix using review
note:
`.agents/reviews/088-cover-btp-destination-metadata-refresh-review.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Focused re-review for:
.agents/tasks/done/088-cover-btp-destination-metadata-refresh.md

Review note:
.agents/reviews/088-cover-btp-destination-metadata-refresh-review.md

Reviewed implementation commit:
4b28a6e9dabc6356a15c544f8663ec948eb3a5c5

Integrator fix:
Review the latest HEAD commit on this branch, which addresses the task 088
review finding.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
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
- the focused Integrator diff since reviewed commit 4b28a6e9dabc6356a15c544f8663ec948eb3a5c5

Review stance:
- Findings first.
- Review only the bounded task 088 Integrator fix unless you discover a direct
  regression from that fix.
- Check that strict production runtime metadata refresh treats missing
  Destination/XSUAA bindings as a BTP destination resolution failure before any
  local `/sap/opu/odata/sap` fallback can be used.
- Check that local development BTP fallback behavior and normal OData proxy
  resolver defaults remain preserved.
- Check that the new regression test is deterministic, uses stale cache, does
  not require live SAP BTP services or external network access, does not invoke
  the injected generator, and asserts the stale reason is BTP binding/resolution
  related rather than a local fallback 404/path.
- Check that the change stays out of Explorer UI, unrelated direct-service
  behavior, dependencies, lockfiles, generated files, and unrelated docs.

Integrator verification already run:
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`
  - pass outside sandbox, 2 files, 45 tests. Initial sandboxed run could not
    resolve `vitest`.
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - pass outside sandbox on rerun, 11 files, 169 passed, 1 skipped, plus proxy
    standalone example. Initial sandboxed run failed with Windows `spawn
    EPERM`; first escalated run hit a transient Vitest worker-fork crash after
    visible tests passed.
- `pnpm.cmd run lint` - pass.
- `pnpm.cmd run typecheck` - pass.
- `git diff --check` - pass, with Git CRLF working-copy warnings only.

Output:
- findings with severity and file/line references
- acceptance criteria status for the focused review finding
- verification gaps or rerun results
- whether the task is approved after the Integrator fix or still needs changes

Update `.agents/reviews/088-cover-btp-destination-metadata-refresh-review.md`
with a Focused Re-review section.
Update `.agents/NEXT.md` with the next workflow action.
Commit the review note and workflow state changes with a Conventional Commit
unless a stop condition prevents committing.
Include the exact next-chat prompt the operator should paste into a new chat.
```
