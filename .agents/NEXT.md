# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow. Task 074 is complete and does not require separate review;
no in-progress task is currently recorded.

## Current Next Step

Start an Orchestrator chat to resume the normal workflow. Ready tasks exist;
the lowest-numbered ready task is
`.agents/tasks/ready/075-make-standalone-examples-assertion-backed.md`.

## Prompt For Next Chat

```txt
You are the Orchestrator for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/orchestrator.md
- .agents/NEXT.md

Coordinate the next workflow step from .agents/NEXT.md.

Rules:
- Do not implement, review, or integrate directly unless the operator explicitly asks.
- Use Adaptive Teamflow unless .agents/NEXT.md or the operator selects another mode.
- Classify each task with the risk classifier before delegation; if unclear, choose the higher-risk path.
- Use fresh role-specific contexts for Implementer, Reviewer, Integrator, Planner, or Architect work when available.
- Give each role only the compact repository-local prompt it needs.
- For work requiring separate review, use a fresh Reviewer that did not see the Implementer conversation.
- Continue through bounded, clearly actionable review findings by delegating a focused fix, then run focused re-review.
- Stop only when a stop condition, failed verification, broad/risky review finding, unclear decision, approval requirement, destructive action, conflicting decision, or safely undelegable blocker blocks the loop.

When done, summarize:
- role chats or sub-agents run
- commits created or reviewed
- current .agents/NEXT.md action
- blockers or human decisions needed
```
