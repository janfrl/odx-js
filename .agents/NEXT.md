# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement `.agents/tasks/ready/049-run-release-confidence-checkpoint.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/049-run-release-confidence-checkpoint.md
- .agents/tasks/done/
- .agents/reviews/

Implement exactly `.agents/tasks/ready/049-run-release-confidence-checkpoint.md`.

Rules:
- Keep changes scoped to the task.
- Run and record the checkpoint commands from the task.
- Check task state consistency and `.agents/NEXT.md`.
- If checks pass and no ready tasks remain, update `.agents/NEXT.md` to the Planner prompt.
- If a check fails, record the failure and only update `.agents/NEXT.md` to a focused fix prompt when the fix is bounded.
- Do not implement unrelated fixes while running the checkpoint.
- Do not change production source, tests, scripts, dependencies, lockfiles, or documentation unless a bounded checkpoint-state note is required.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks `.ps1` launchers.
- Do not revert edits made by others.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Self-check against scope, acceptance criteria, relevant docs/decisions, architecture boundaries, security/privacy implications, and unrelated changes.
- Decide whether separate review is required using `.agents/WORKFLOW.md`.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- checkpoint results
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
