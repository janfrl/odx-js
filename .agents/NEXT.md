# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement ready task `.agents/tasks/ready/061-document-service-name-type-generation-limits.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Implement exactly:
- `.agents/tasks/ready/061-document-service-name-type-generation-limits.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- `.agents/tasks/ready/061-document-service-name-type-generation-limits.md`
- `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
- `packages/nuxt/README.md`
- `docs/content/en/2.nuxt/1.getting-started.md`
- `docs/content/en/2.nuxt/5.module-reference.md`

Rules:
- Keep changes documentation-only.
- Document service-name guidance for generated registry/type ergonomics after task 058.
- Do not change source, tests, scripts, dependencies, lockfiles, generated artifacts, runtime composables, or service config shape.
- Move the task to `.agents/tasks/done/` only after implementation and verification.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

Verification:
- Manual Markdown inspection for accuracy and consistency
- `git diff --check`
- `pnpm.cmd run lint` only if non-Markdown files change

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
