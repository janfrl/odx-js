# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Run the Planner to create the next project tasks.

## Prompt For Next Chat

```txt
You are the Planner for ODX.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/ROADMAP.md
- .agents/EPICS.md
- .agents/BACKLOG.md
- .agents/tasks/
- .agents/reviews/

Create the next 3-5 implementation tasks for ODX.

Rules:
- Each task must be executable by one implementer chat.
- Use .agents/tasks/TASK_TEMPLATE.md.
- Put new tasks in .agents/tasks/ready/.
- Keep tasks small and reviewable.
- Include acceptance criteria and verification steps.
- Prefer project/product tasks over agent-workflow chores.
- Include review requirements for security-sensitive proxy/auth work.
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
