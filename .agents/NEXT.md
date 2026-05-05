# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement the lowest-numbered ready task:
`.agents/tasks/ready/030-add-proxy-benchmark-overhead-ratios.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/030-add-proxy-benchmark-overhead-ratios.md
- packages/proxy/test/performance.test.ts
- scripts/compare-proxy-benchmarks.ts
- packages/proxy/README.md
- .agents/tasks/done/021-record-proxy-benchmark-baseline-output.md
- .agents/tasks/done/025-add-proxy-benchmark-compare-helper.md

Rules:
- Implement exactly `.agents/tasks/ready/030-add-proxy-benchmark-overhead-ratios.md`.
- Keep changes scoped to proxy benchmark output, compare compatibility, and related proxy benchmark documentation.
- Do not change production proxy code, benchmark scenario definitions, iteration defaults, opt-in benchmark behavior, or dependencies.
- Use local generated reports under gitignored `reports/`.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next concrete workflow action.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.
- Separate review is not required unless production proxy code, benchmark semantics, or dependencies change.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
