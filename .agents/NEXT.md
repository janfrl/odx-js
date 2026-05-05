# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement ready task `.agents/tasks/ready/060-validate-benchmark-iteration-env.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Implement exactly:
- `.agents/tasks/ready/060-validate-benchmark-iteration-env.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- `.agents/tasks/ready/060-validate-benchmark-iteration-env.md`
- `.agents/tasks/done/054-validate-benchmark-concurrency-env.md`
- `packages/proxy/test/performance.test.ts`
- `packages/proxy/README.md`

Rules:
- Keep changes scoped to benchmark iteration and round env validation.
- Do not change production proxy runtime code, benchmark scenario semantics, report JSON shape, dependencies, lockfiles, CI gates, or performance budgets.
- Add focused tests that fail before implementation for invalid `ODX_PROXY_BENCHMARK_ITERATIONS` and `ODX_PROXY_BENCHMARK_ROUNDS` values.
- Preserve absent-env defaults and valid positive integer overrides.
- Update the proxy README only if accepted env value rules need to be discoverable.
- Move the task to `.agents/tasks/done/` only after implementation and verification.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck` if the change scope warrants it

Output:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
