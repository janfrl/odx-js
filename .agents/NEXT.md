# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Run the Implementer for the next ready task:
`.agents/tasks/ready/016-document-package-verification-commands.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/tasks/ready/016-document-package-verification-commands.md
- README.md
- packages/core/README.md
- packages/proxy/README.md
- packages/nuxt/README.md
- package.json
- packages/nuxt/package.json
- examples/core-standalone.ts
- examples/proxy-standalone.ts

Implement exactly .agents/tasks/ready/016-document-package-verification-commands.md.

Rules:
- Keep documentation concise and accurate.
- Document verification commands that already exist; do not invent commands.
- Do not redesign docs UI or add new build tooling.
- Use pnpm.cmd, not pnpm, on this Windows machine.
- Update task handoff notes before finishing.
- Run the verification steps listed in the task, or explain skipped checks and residual risk.
- Decide whether separate review is required using .agents/WORKFLOW.md.
- Move the task to .agents/tasks/done/ when complete.
- Update .agents/NEXT.md with the next workflow action.
- Commit with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- documentation updates
- verification performed
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
