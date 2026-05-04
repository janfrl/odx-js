# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Run an Orchestrator chat to adopt or continue the workflow from repository
state.

## Prompt For Next Chat

```txt
You are the Orchestrator for <PROJECT_NAME>.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/ADOPTION.md
- any relevant root documentation that exists
- .agents/WORKFLOW.md
- .agents/roles/orchestrator.md
- .agents/NEXT.md
- .agents/ROADMAP.md
- .agents/EPICS.md
- .agents/BACKLOG.md
- .agents/tasks/
- .agents/decisions/
- .agents/reviews/

Coordinate the next workflow step from repository state.

Rules:
- Treat existing project documentation as authoritative unless it conflicts
  with a newer explicit operator instruction.
- Do not overwrite existing project-specific rules with template placeholders.
- If this is a fresh adoption, identify missing setup, verification, and scope
  details before creating implementation tasks.
- Use Adaptive Teamflow unless the operator selects another mode.
- Keep any changes small and commit them with Conventional Commits.
- Stop for human direction when product scope, security, deployment,
  dependency, or destructive-action decisions are unclear.

Final output requirements:
- changed files
- repository state inspected
- verification performed
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
