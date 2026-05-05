# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Run the Implementer for
`.agents/tasks/ready/014-expand-proxy-performance-scenarios.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/tasks/ready/014-expand-proxy-performance-scenarios.md
- packages/proxy/test/performance.test.ts
- packages/proxy/test/fixtures/backend.ts
- packages/proxy/test/fixtures/server.ts
- packages/proxy/src/api/odata.ts
- package.json

Implement exactly .agents/tasks/ready/014-expand-proxy-performance-scenarios.md.

Rules:
- Keep changes scoped to the benchmark and local fixtures.
- Do not change production proxy behavior unless a severe measurement blocker is found.
- Use local fixture servers only; do not require SAP/BTP/network services.
- Keep benchmark thresholds tolerant and non-flaky.
- Use pnpm.cmd, not pnpm, on this Windows machine.
- Update task handoff notes before finishing.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Decide whether separate review is required using .agents/WORKFLOW.md.
- Move the task to .agents/tasks/done/ when complete.
- Update .agents/NEXT.md with the next workflow action.
- Commit with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- benchmark scenarios added
- verification performed
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
