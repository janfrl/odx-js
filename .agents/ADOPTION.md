# Template Adoption

Use this when copying or cloning the template into a new or existing
repository. The goal is to give agents enough durable project context to work
well without turning the repository into a process manual.

This is operational template-adoption guidance. Keep it in this template. In an
adopted project, delete `.agents/ADOPTION.md` after root documentation has been
made project-specific and `.agents/NEXT.md` points to the normal next workflow
action. When deleting it, also remove adoption-only references from `AGENTS.md`,
`README.md`, and `.agents/NEXT.md`. Keep it only if the team intentionally
wants a reusable template-update playbook.

## Adopt Into an Existing Repository

1. Read the existing root documentation first: `README.md`, `CONTRIBUTING.md`,
   `AGENTS.md`, and any architecture, design, security, API, deployment, or
   domain docs that already exist.
2. Preserve project-specific guidance. Merge this template into existing docs
   instead of overwriting useful local rules.
3. Replace placeholders in `README.md` with the real project identity, setup
   commands, verification commands, scope, and documentation map.
4. Update `CONTRIBUTING.md` only where the project does not already define a
   stricter standard.
5. Keep `AGENTS.md` concise. It should tell AI agents where durable project
   guidance lives, how to find the next workflow action, and what must be
   reported at handoff.
6. Keep `.agents/` for operational workflow state: roadmap snapshots, task
   briefs, review notes, role prompts, and temporary decisions.
7. Promote stable architecture, product, security, API, deployment, or domain
   decisions back into root documentation.
8. Commit adoption changes with small Conventional Commits.

## First AI Pass After Adoption

Run an Orchestrator chat first. The Orchestrator should inspect the repository,
classify the next step, and either send the work to a Planner or stop for a
human decision when the project direction is unclear.

```txt
You are the Orchestrator for <PROJECT_NAME>.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/ADOPTION.md
- relevant root documentation that exists
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

When you stop, summarize:
- repository state inspected
- changes made or role chats delegated
- verification performed
- separate review requirement and why
- commit hash, unless blocked
- current .agents/NEXT.md action
- exact next-chat prompt from .agents/NEXT.md
```

## Lightweight Adoption Checklist

- [ ] Root docs describe the actual project, not template placeholders.
- [ ] Setup, test, lint, typecheck, and dev commands are documented or marked
      as unknown.
- [ ] `.agents/NEXT.md` has one concrete next action and a copyable prompt.
- [ ] `.agents/tasks/ready/` contains only tasks that are ready to implement.
- [ ] Existing security, privacy, deployment, and API rules remain in root docs.
- [ ] `.agents/ADOPTION.md` and adoption-only references are deleted, unless
      the team wants to keep a template-update playbook.
- [ ] The worktree is clean after each adoption commit.
