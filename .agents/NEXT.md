# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 089 is complete as a test-only smoke coverage change
with `.agents` workflow updates. Separate review is not required for task 089
because runtime code, dependency metadata, deployment docs, lockfiles,
generated files, and public contracts were not changed. The next lowest ready
task is high-risk task 090, and separate review is required.

## Current Next Step

Start an Implementer for:
`.agents/tasks/ready/090-tighten-production-explorer-deployment-consistency-checks.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
.agents/tasks/ready/090-tighten-production-explorer-deployment-consistency-checks.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/077-harden-production-explorer-endpoints-and-config-review.md
- .agents/reviews/082-align-standalone-explorer-runtime-ui-review.md
- .agents/reviews/086-document-dev-prod-explorer-runtime-differences-review.md
- .agents/tasks/ready/090-tighten-production-explorer-deployment-consistency-checks.md
- mta.yaml
- packages/approuter/xs-app.json
- packages/approuter/test/deployment-config.test.ts
- packages/approuter/package.json

Rules:
- Keep changes scoped to task 090.
- Extend deterministic AppRouter deployment consistency verification for the
  production Explorer runtime route split and required MTA bindings.
- Do not deploy to Cloud Foundry or start a real SAP AppRouter process.
- Do not change runtime endpoint behavior unless the consistency check exposes
  a real configuration bug.
- Do not update user-facing deployment docs unless the configuration contract
  changes.
- Move task 090 to `.agents/tasks/in-progress/` when starting and to
  `.agents/tasks/done/` only after implementation and verification.
- Update task handoff notes and `.agents/NEXT.md`.
- Commit the completed task with a Conventional Commit unless a stop condition
  prevents committing.
- Separate review is required for task 090 because it guards deployment and
  production authentication routing boundaries.

Verification:
- `pnpm.cmd --filter odx-approuter run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

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
