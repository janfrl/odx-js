# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement `.agents/tasks/ready/066-protect-devtools-log-storage-from-external-mutation.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/066-protect-devtools-log-storage-from-external-mutation.md
- any root documentation referenced by the task

Rules:
- Implement exactly .agents/tasks/ready/066-protect-devtools-log-storage-from-external-mutation.md.
- Keep changes scoped to returned-array mutation protection for DevTools log storage and focused tests.
- Do not start unrelated refactors.
- Follow existing repository structure, style, and documented architecture boundaries.
- Add a failing test first that mutates the array returned by `getODataLogs()` and expects a later read to remain unchanged.
- Preserve log entry contents, ordering, retention behavior, clearing behavior, and existing DevTools logging tests.
- Do not deep-freeze log entries, redesign DevTools logging, alter log payload shape, change Explorer UI, change proxy trace behavior, add dependencies, modify package scripts, lockfiles, or generated files.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Self-check against scope, acceptance criteria, relevant docs/decisions,
  architecture boundaries, security/privacy implications, and unrelated changes.
- Decide whether separate review is required using .agents/WORKFLOW.md and the
  task risk notes.
- Move the task to .agents/tasks/done/ when implementation and verification are complete.
- Update .agents/NEXT.md with the next action and exact next-chat prompt.
- Do not commit unless the operator explicitly asks; orchestrator will review and commit.

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
