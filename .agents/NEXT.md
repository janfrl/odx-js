# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Secure Teamflow for the production Explorer runtime sequence because it touches
auth, privacy, deployment runtime behavior, persistence, and internal HTTP
contracts.

## Current Next Step

Task 083 review is approved. Continue with:
`.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
- `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/implementer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/reviews/083-complete-or-remove-explorer-mockdata-api-review.md
- .agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md
- root docs referenced by the task
- docs/content/en
- docs/content/de

Rules:
- Keep changes scoped to task 085.
- Do not change runtime API behavior, Explorer UI, logging, metadata, or persistence code.
- Do not document unapproved behavior from tasks that still need independent review.
- Keep English and German documentation semantically aligned.
- Do not publish customer-specific BTP routes, credentials, destinations, or backend URLs.
- Update the task handoff notes before finishing.
- Run `git diff --check` and `pnpm.cmd --filter docs run verify`, or record skipped checks and residual risk.
- Manually search English and German docs for stale wording around `planned`, `follow-up`, `db0`, `metadata refresh`, `generate`, `403`, and `mockdata`.
- Self-check against task scope, acceptance criteria, root docs/decisions, security/privacy implications, and unrelated changes.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

Output:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
