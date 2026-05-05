# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement next ready task:
`.agents/tasks/ready/039-report-missing-benchmark-scenarios.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/039-report-missing-benchmark-scenarios.md
- scripts/compare-proxy-benchmarks.ts
- packages/proxy/test/benchmark-compare.test.ts
- packages/proxy/README.md

Implement exactly `.agents/tasks/ready/039-report-missing-benchmark-scenarios.md`.

Rules:
- Keep changes scoped to the benchmark compare helper, its tests, and docs only if output wording becomes inaccurate.
- Write focused tests first for baseline-only and candidate-only scenarios; confirm they fail before changing implementation.
- Keep old benchmark report compatibility.
- Do not add performance budgets, thresholds, CI gates, production proxy code changes, dependencies, or committed benchmark JSON reports.
- Do not revert edits made by others.
- Update task handoff notes, move the task to `.agents/tasks/done/` when complete, update `.agents/NEXT.md`, and commit with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test/benchmark-compare.test.ts`
- `pnpm.cmd run bench:proxy:compare -- <two local fixture reports if created>`
- `pnpm.cmd run lint`
- Run `pnpm.cmd run typecheck` if implementation touches typed helper behavior beyond test fixtures.

When done, summarize:
- changed files
- what was implemented
- failing-test evidence before the fix
- verification performed
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
