# Agentic Work Area

This folder contains operational material for AI-assisted development. It is
intentionally separate from root documentation, which is long-lived project
knowledge for humans and agents.

Use this folder for:

- planning
- epic breakdowns
- task creation
- agent role prompts
- work handoffs
- review notes
- temporary decisions before they become stable project documentation

Do not use this folder as the only home for durable product rules,
architecture, domain model, security requirements, API contracts, deployment
instructions, or contribution standards. Stable knowledge belongs in root
documentation.

## Structure

```txt
.agents/
|-- README.md
|-- WORKFLOW.md
|-- NEXT.md
|-- mcp.json
|-- ROADMAP.md
|-- BACKLOG.md
|-- EPICS.md
|-- roles/
|   |-- orchestrator.md
|   |-- planner.md
|   |-- architect.md
|   |-- implementer.md
|   |-- integrator.md
|   `-- reviewer.md
|-- tasks/
|   |-- TASK_TEMPLATE.md
|   |-- ready/
|   |-- in-progress/
|   |-- done/
|   `-- deferred/
|-- decisions/
|   `-- ADR_TEMPLATE.md
`-- reviews/
    `-- REVIEW_TEMPLATE.md
```

## Workflow

1. Check `.agents/NEXT.md`.
2. Start with the Orchestrator unless the operator explicitly chooses another
   role.
3. Follow `.agents/WORKFLOW.md` and its current operating mode.
4. The planner reads root documentation and updates `.agents/ROADMAP.md`,
   `.agents/EPICS.md`, and `.agents/BACKLOG.md`.
5. The planner turns backlog items into task briefs under `.agents/tasks/ready/`.
6. An implementer takes exactly one ready task, moves it to `in-progress`,
   implements it, verifies it, and moves it to `done`.
7. A reviewer reviews the implementation against root documentation and task
   acceptance criteria when the risk classifier, task file, or operator
   requires independent review.
8. An integrator applies only bounded review fixes and requests focused
   re-review when needed.
9. Stable decisions are promoted from `.agents/decisions/` into root
   documentation.

## MCP Servers

Project-local MCP server configuration lives in `.agents/mcp.json`.

- `nuxt-ui`: Nuxt UI component, composable, template, and documentation tools.
- `docus`: Docus documentation discovery and page retrieval tools.

Both servers use HTTP transport.
