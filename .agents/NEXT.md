# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 088 implementation is complete and requires separate
review because it touches production BTP destination resolution behavior for
runtime metadata refresh.

## Current Next Step

Start a fresh Reviewer for task 088:
`.agents/tasks/done/088-cover-btp-destination-metadata-refresh.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/088-cover-btp-destination-metadata-refresh.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- SECURITY.md
- DEPLOYMENT.md
- .agents/tasks/done/088-cover-btp-destination-metadata-refresh.md
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/src/utils/target.ts
- packages/proxy/src/utils/btp-destination.ts
- packages/proxy/src/api/generate.ts
- packages/proxy/test/explorer-policy.test.ts
- packages/proxy/test/btp-destination.test.ts
- the latest implementation diff/commit for task 088

Review stance:
- Findings first.
- Prioritize correctness, production runtime behavior, BTP destination
  resolution, Authorization/header handling, stale-cache fallback, SDK
  generation separation, security/privacy, architecture boundaries, and
  acceptance criteria gaps.
- Check that the implementation stays scoped to task 088 and does not alter
  Explorer UI, unrelated direct-service behavior, dependencies, lockfiles,
  generated files, or unrelated docs.
- Check that tests are deterministic and do not require live SAP BTP services
  or external network access.
- Check that durable docs do not need updates for the implemented behavior.

Implementation summary to review:
- Added local fixture coverage for production `/__odx__/generate` metadata
  refresh through mocked BTP Destination/XSUAA resolution.
- Verified the resolved destination URL is used for `$metadata`, destination
  auth overrides incoming/service/global auth, metadata `Accept` is sent, and
  restricted proxy headers remain governed by `prepareProxyHeaders`.
- Added stale-cache fallback coverage for destination-backed metadata fetch
  failure and BTP destination resolution failure without production SDK
  generation.
- Narrow runtime fix: metadata refresh opts out of the target resolver's local
  BTP fallback so destination resolution failures reach stale-cache fallback
  with the BTP failure reason instead of a local fallback 404.

Verification already run by Implementer:
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`
  - pass outside sandbox, 2 files, 43 tests.
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - pass outside sandbox, 11 files, 167 passed, 1 skipped, plus proxy
    standalone example.
- `pnpm.cmd run lint` - pass.
- `pnpm.cmd run typecheck` - pass.
- `git diff --check` - pass, with Git CRLF working-copy warnings only.

Pre-fix failing result to consider:
- The focused suite failed after adding the destination-resolution stale-cache
  test because `staleReason` was `Status: 404 Cannot find any path matching
  [metadata-path]` instead of the BTP destination failure. It passed after the
  metadata-refresh target-resolution fix.

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes

Create or update a review note under `.agents/reviews/` using
`.agents/reviews/REVIEW_TEMPLATE.md`.
Update `.agents/NEXT.md` and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.
```
