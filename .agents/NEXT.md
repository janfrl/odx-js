# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Tasks 077-086 are complete and reviewed. Task 087 is
implemented and requires separate review.

## Current Next Step

Start a fresh Reviewer for completed task 087:
`.agents/tasks/done/087-sanitize-explorer-metadata-failure-messages.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/087-sanitize-explorer-metadata-failure-messages.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- .agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md
- SECURITY.md
- API.md
- .agents/tasks/done/087-sanitize-explorer-metadata-failure-messages.md
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/src/api/generate.ts
- packages/proxy/src/api/config.ts
- packages/proxy/src/api/schema.ts
- packages/proxy/test/explorer-policy.test.ts
- the changed files and diff for the task 087 implementation commit

Review stance:
- Findings first.
- Prioritize correctness, architecture boundaries, security/privacy, public runtime API contracts, missing tests, and acceptance criteria gaps.
- Check that production `/__odx__/generate`, `/__odx__/config`, and `/__odx__/schema` responses do not expose backend metadata URLs, hostnames, or local runtime paths through metadata failure messages or legacy sidecar stale reasons.
- Check that actionable status-code reasons such as `Status: 503` remain visible.
- Check that TypeScript SDK generation behavior, normal OData proxy responses, Explorer UI copy, metadata cache file names, dependencies, lockfiles, generated files, and unrelated docs were not changed.

Verification:
- Inspect the implementation diff.
- Run `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` if needed for review confidence.
- Run `git diff --check` if the diff is changed during review.

Output:
- findings with severity and file/line references, or state clearly that there are no findings
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes

Create or update a review note under `.agents/reviews/` using `REVIEW_TEMPLATE.md`.
Update `.agents/NEXT.md` and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.
```
