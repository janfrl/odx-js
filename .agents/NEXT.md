# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement next ready task:
`.agents/tasks/ready/043-test-proxy-benchmark-report-formatting.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/043-test-proxy-benchmark-report-formatting.md
- packages/proxy/test/performance.test.ts
- packages/proxy/test/benchmark-compare.test.ts
- packages/proxy/README.md
- .agents/tasks/done/030-add-proxy-benchmark-overhead-ratios.md
- .agents/tasks/done/034-add-proxy-benchmark-report-metadata.md

Implement exactly `.agents/tasks/ready/043-test-proxy-benchmark-report-formatting.md`.

Rules:
- Keep changes scoped to proxy benchmark report formatting helpers and tests.
- Add focused deterministic tests for overhead table formatting and JSON metadata shape.
- Extract only pure helper logic from `packages/proxy/test/performance.test.ts` if needed.
- Keep benchmark scenario definitions, environment variables, timing measurement, compare-helper behavior, production proxy code, dependencies, and CI gates unchanged.
- Do not revert edits made by others.
- Update task handoff notes, move the task to `.agents/tasks/done/` when complete, update `.agents/NEXT.md`, and commit with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts packages/proxy/test/benchmark-report.test.ts`
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck` if implementation touches typed shared helper behavior

When done, summarize:
- changed files
- what was implemented
- verification performed
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
