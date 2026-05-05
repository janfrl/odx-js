# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Run `.agents/tasks/ready/057-run-stability-checkpoint.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/057-run-stability-checkpoint.md

Implement exactly `.agents/tasks/ready/057-run-stability-checkpoint.md`.

Rules:
- Keep changes scoped to the task.
- Do not start unrelated refactors.
- Follow existing repository structure, style, and documented architecture boundaries.
- Run the checkpoint verification commands listed in the task.
- Clean generated verification artifacts before committing unless the task explicitly says otherwise.
- Do not implement new feature work inside the checkpoint task.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Self-check against scope, acceptance criteria, relevant docs/decisions, architecture boundaries, security/privacy implications, and unrelated changes.
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
