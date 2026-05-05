# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Run the Implementer for
`.agents/tasks/ready/013-fix-nuxt-e2e-node24-startup.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/tasks/ready/013-fix-nuxt-e2e-node24-startup.md
- packages/nuxt/test/isolated.test.ts
- packages/nuxt/test/module.test.ts
- packages/nuxt/test/fixtures/isolated/**
- test/fixtures/basic/**
- packages/nuxt/vitest.config.ts
- vitest.config.ts
- package.json

Implement exactly .agents/tasks/ready/013-fix-nuxt-e2e-node24-startup.md.

Rules:
- Keep changes scoped to the task.
- Do not start unrelated refactors.
- Follow existing repository structure, style, and documented architecture boundaries.
- Use pnpm.cmd, not pnpm, on this Windows machine.
- Reproduce the failure with the narrowest Nuxt e2e command before fixing.
- Do not weaken or delete Nuxt e2e coverage just to make checks pass.
- Do not change production module behavior unless a failing test proves a module bug.
- If the root cause is an unsupported Node/Nuxt/Nitro combination or dependency upgrade decision, document the blocker instead of making a broad dependency change.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Self-check against scope, acceptance criteria, relevant docs/decisions, architecture boundaries, security/privacy implications, and unrelated changes.
- Decide whether separate review is required using .agents/WORKFLOW.md.
- Move the task to .agents/tasks/done/ when implementation and verification are complete, or leave it ready with blocker notes if not complete.
- Update .agents/NEXT.md with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
