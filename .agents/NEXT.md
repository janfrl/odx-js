# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement the lowest-numbered ready task:
`.agents/tasks/ready/025-add-proxy-benchmark-compare-helper.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/025-add-proxy-benchmark-compare-helper.md
- packages/proxy/test/performance.test.ts
- packages/proxy/README.md
- package.json

Rules:
- Implement exactly `.agents/tasks/ready/025-add-proxy-benchmark-compare-helper.md`.
- Keep changes scoped to benchmark comparison tooling and documentation.
- Do not change production proxy runtime behavior, normal test behavior, or benchmark scenario definitions unless the task proves it is necessary.
- Use generated artifact paths that remain ignored by git.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.
- Separate review is not required unless production proxy behavior, package scripts used by normal tests, or benchmark scenario definitions change materially.

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
