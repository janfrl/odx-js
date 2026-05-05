# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement `.agents/tasks/ready/073-reject-path-separator-service-names-before-type-generation.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/073-reject-path-separator-service-names-before-type-generation.md
- .agents/tasks/done/058-quote-generated-registry-service-keys.md
- .agents/tasks/done/061-document-service-name-type-generation-limits.md
- .agents/tasks/done/065-verify-non-identifier-service-names-in-minimal-nuxt-playground.md
- any root documentation referenced by the task

Rules:
- Implement exactly `.agents/tasks/ready/073-reject-path-separator-service-names-before-type-generation.md`.
- Keep changes scoped to Nuxt type-generation validation and focused tests.
- Add failing tests first for `/` and `\` service names.
- Preserve safe non-identifier service names such as `Sales-Order`.
- Do not change generated registry declaration quoting, model output layout for valid services, metadata download behavior, runtime composable lookup, Explorer behavior, proxy behavior, dependencies, lockfiles, or generated files.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Decide whether separate review is required using .agents/WORKFLOW.md and the task risk notes.
- Move the task to .agents/tasks/done/ when implementation and verification are complete.
- Update .agents/NEXT.md with a Reviewer prompt because task 073 requires separate review.
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
