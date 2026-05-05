# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

No ready implementation tasks remain. Run the Planner to create the next small,
reviewable stability and performance tasks.

## Prompt For Next Chat

```txt
You are the Planner for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- relevant root documentation
- .agents/WORKFLOW.md
- .agents/ROADMAP.md
- .agents/EPICS.md
- .agents/BACKLOG.md
- .agents/tasks/
- .agents/reviews/
- .agents/decisions/

Create the next 3-5 implementation tasks.

Rules:
- Do not revert edits made by others.
- Each task must be executable by one implementer chat.
- Use `.agents/tasks/TASK_TEMPLATE.md`.
- Put new tasks in `.agents/tasks/ready/`.
- Keep tasks small, concrete, and reviewable.
- Include acceptance criteria and verification steps.
- Focus on stability first: proven bug fixes from failing tests, proxy/BTP correctness, Explorer/Nuxt state correctness, and performance measurement improvements that keep architecture clean.
- Do not create vague or oversized tasks.
- Update `.agents/BACKLOG.md`, `.agents/EPICS.md`, and `.agents/ROADMAP.md` only if needed.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the planning update with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- new tasks created
- recommended next task
- open decisions or blockers
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
