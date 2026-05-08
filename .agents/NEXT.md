# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 091 implementation is complete, no separate review is
required, and no ready implementation tasks remain.

## Current Next Step

Start a Planner chat to create the next 3-5 ready implementation tasks.

## Prompt For Next Chat

```txt
You are the Planner for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

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
- .agents/NEXT.md

Create the next 3-5 implementation tasks.

Rules:
- Each task must be executable by one implementer chat.
- Use .agents/tasks/TASK_TEMPLATE.md.
- Put new tasks in .agents/tasks/ready/.
- Keep tasks small and reviewable.
- Include acceptance criteria and verification steps.
- Do not create vague or oversized tasks.
- Update BACKLOG.md, EPICS.md, and ROADMAP.md only if needed.
- Update .agents/NEXT.md with the next action and exact next-chat prompt.
- Commit the planning update with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- new tasks created
- recommended next task
- open decisions or blockers
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```
