# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Tasks 077-086 are complete and reviewed. Ready tasks 087-091
are available.

## Current Next Step

Start task 087 with a fresh Implementer:
`.agents/tasks/ready/087-sanitize-explorer-metadata-failure-messages.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/NEXT.md
- .agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md
- .agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md
- SECURITY.md
- API.md
- .agents/tasks/ready/087-sanitize-explorer-metadata-failure-messages.md

Implement exactly `.agents/tasks/ready/087-sanitize-explorer-metadata-failure-messages.md`.

Rules:
- Keep changes scoped to the task.
- Do not start unrelated refactors.
- Follow existing repository structure, style, and documented architecture boundaries.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Self-check against scope, acceptance criteria, relevant docs/decisions, architecture boundaries, security/privacy implications, and unrelated changes.
- Separate review is required because this task touches production Explorer metadata error exposure.
- Move the task to .agents/tasks/done/ when implementation and verification are complete.
- Update .agents/NEXT.md with the reviewer prompt for task 087.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```
