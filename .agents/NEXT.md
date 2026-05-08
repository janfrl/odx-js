# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 088 is approved after focused re-review. The next
lowest ready task is medium-risk task 089. Separate review is conditional:
required if implementation changes runtime code, dependency metadata, or
deployment docs; not required for a test-only smoke coverage change that stays
within scope and passes verification.

## Current Next Step

Start an Implementer for:
`.agents/tasks/ready/089-add-sql-log-store-connector-smoke-tests.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
.agents/tasks/ready/089-add-sql-log-store-connector-smoke-tests.md

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/079-add-db0-backed-explorer-log-store-review.md
- .agents/tasks/ready/089-add-sql-log-store-connector-smoke-tests.md
- packages/proxy/package.json
- packages/proxy/src/utils/log-store.ts
- packages/proxy/test/db0-log-store.test.ts

Rules:
- Keep changes scoped to task 089.
- Add deterministic smoke coverage that imports the documented db0 PostgreSQL
  connector from the proxy package context without opening a real database
  connection.
- Add SQLite connector smoke coverage only if it is useful and deterministic.
- Do not expose db0 APIs outside the existing proxy log-store boundary.
- Do not add dependencies unless the smoke test proves a real missing runtime
  dependency.
- Move the task to `.agents/tasks/in-progress/` when starting and to
  `.agents/tasks/done/` only after implementation and verification.
- Update task handoff notes and `.agents/NEXT.md`.
- Commit the completed task with a Conventional Commit unless a stop condition
  prevents committing.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test/db0-log-store.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
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
