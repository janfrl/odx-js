# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Create the next implementation tasks because `.agents/tasks/ready/` is empty.

## Prompt For Next Chat

```txt
You are the Planner for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/ROADMAP.md
- .agents/EPICS.md
- .agents/BACKLOG.md
- .agents/tasks/
- .agents/tasks/done/
- .agents/reviews/

Create the next 3-5 implementation tasks.

Rules:
- Each task must be executable by one implementer chat.
- Use `.agents/tasks/TASK_TEMPLATE.md`.
- Put new tasks in `.agents/tasks/ready/`.
- Keep tasks small, concrete, reviewable, and test-first when bug-related.
- Prefer stability, performance-test quality, package isolation, and narrow documentation improvements.
- Include the high-confidence read-only exploration candidates that are not already covered:
  - benchmark concurrency env validation should reject zero or invalid values before timing loops
  - Nuxt metadata download should use the correct HTTP client for `http://` services
  - core OData flattening should unwrap falsy V2 `d` payloads if tests prove the bug
- Avoid UI redesign and browser-mode work unless the task has a clear verification plan using port 3000.
- Do not create vague or oversized tasks.
- Do not revert edits made by others.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the planning update with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- new tasks created
- recommended next task
- open decisions or blockers
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
