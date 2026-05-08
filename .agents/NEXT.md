# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 090 implementation is complete. Separate review is
required because the task guards deployment/runtime boundaries and production
authentication routing.

## Current Next Step

Start a fresh Reviewer for:
`.agents/tasks/done/090-tighten-production-explorer-deployment-consistency-checks.md`.

The Reviewer should create a review note under `.agents/reviews/` using the
existing review-note format.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Review the completed task:
.agents/tasks/done/090-tighten-production-explorer-deployment-consistency-checks.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/077-harden-production-explorer-endpoints-and-config-review.md
- .agents/reviews/082-align-standalone-explorer-runtime-ui-review.md
- .agents/reviews/086-document-dev-prod-explorer-runtime-differences-review.md
- .agents/tasks/done/090-tighten-production-explorer-deployment-consistency-checks.md
- mta.yaml
- packages/approuter/xs-app.json
- packages/approuter/test/deployment-config.test.ts
- packages/approuter/package.json
- the implementation commit diff for task 090

Review stance:
- Findings first.
- Prioritize deployment consistency, authentication-token forwarding, required
  MTA bindings, AppRouter route ordering and route matching, unsupported
  `/__odx__` runtime paths, missing deterministic tests, and unrelated scope.
- Check that the implementation did not deploy to Cloud Foundry, start a real
  AppRouter, change runtime endpoint behavior, or update user-facing
  deployment docs without a configuration contract change.
- Check that the task acceptance criteria and required verification were met.

Verification to review or rerun as needed:
- `pnpm.cmd --filter odx-approuter run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether task 090 is approved or needs changes

Create or update a review note under `.agents/reviews/` using the existing
review-note format. Update `.agents/NEXT.md` and commit the review note and
workflow state changes. Include the exact next-chat prompt the operator should
paste into a new chat.
```
