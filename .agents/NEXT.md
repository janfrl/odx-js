# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement next ready task:
`.agents/tasks/ready/041-preserve-flattened-value-properties.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/041-preserve-flattened-value-properties.md
- ARCHITECTURE.md
- DOMAIN_MODEL.md
- packages/core/src/odata-utils.ts
- packages/core/test/odata-utils.test.ts
- examples/core-standalone.ts

Implement exactly `.agents/tasks/ready/041-preserve-flattened-value-properties.md`.

Rules:
- Keep changes scoped to core OData flattening behavior and tests.
- Write focused tests first for ordinary entity properties named `value`; confirm at least one fails before changing implementation.
- Preserve OData V4 collection envelope unwrapping, V2 `d.results`, metadata stripping, binary handling, and depth protection.
- Do not change `$odata`, query stringification, EDMX parsing, proxy, Nuxt, Explorer, generated types, dependencies, or lockfiles.
- Do not revert edits made by others.
- Update task handoff notes, move the task to `.agents/tasks/done/` when complete, update `.agents/NEXT.md`, and commit with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd exec vitest run packages/core/test/odata-utils.test.ts`
- `pnpm.cmd --filter @bc8-odx/core run verify`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

When done, summarize:
- changed files
- what was implemented
- failing-test evidence before the fix
- verification performed
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
