# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement `.agents/tasks/ready/058-quote-generated-registry-service-keys.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/058-quote-generated-registry-service-keys.md
- packages/nuxt/src/generate.ts
- packages/nuxt/test/generate.test.ts
- packages/nuxt/playground/minimal/verify.mjs

Implement exactly `.agents/tasks/ready/058-quote-generated-registry-service-keys.md`.

Rules:
- Keep changes scoped to the task.
- Start with focused failing tests for non-identifier service names in generated registry declarations.
- Do not change service config shape, generated model output, output directory layout, runtime composables, dependencies, or lockfiles.
- Do not revert edits made by others.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Decide whether separate review is required using `.agents/WORKFLOW.md`.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

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
