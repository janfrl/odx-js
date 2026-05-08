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

Task 081 is approved after focused re-review of Integrator fix
`f464176568be69de8c8acde70aaea98ab9bdbfa9`.

Start task 082 implementation next:
`.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`.

After task 082, continue the remaining production runtime sequence in this
order:

1. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
2. `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Implement exactly:
- `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md
- .agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md
- .agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md
- .agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md
- relevant Explorer files listed in the task

Rules:
- Keep changes scoped to task 082.
- Do not change proxy endpoint security.
- Do not add persistence dependencies.
- Do not change metadata cache implementation.
- Do not introduce a marketing or landing page.
- Follow existing Explorer and Nuxt UI patterns.
- Update the task handoff notes before finishing.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next workflow action. Preserve task 083 then task 085 order after task 082.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- Browser verification is required if layout or interactive behavior changes beyond labels/state branching. Record the tested URL and viewport.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
