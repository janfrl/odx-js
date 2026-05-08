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

Task 085 review found one focused documentation consistency issue. Integrate
only the review finding in:
`.agents/reviews/085-refresh-user-facing-explorer-runtime-docs-review.md`.

## Prompt For Next Chat

```txt
You are the Integrator for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Address the review finding for completed task 085:
- `.agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md`
- `.agents/reviews/085-refresh-user-facing-explorer-runtime-docs-review.md`

Reviewed implementation commit:
- `1396a2984d1b8621527fd6276a35984b49cef003`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/integrator.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/reviews/085-refresh-user-facing-explorer-runtime-docs-review.md
- .agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- relevant changed Docus docs

Rules:
- Fix only the documented review finding.
- Do not change runtime API behavior or Explorer UI.
- Do not broaden scope into unrelated docs cleanup.
- Preserve the approved task 081 behavior: production `/__odx__/config` service entries include sanitized runtime metadata state.
- Align root docs and Docus docs on the production `/__odx__/config` service-entry allowlist, including the approved `metadata` state fields, without documenting secrets, backend URLs, destinations, auth, outbound headers, rules, runtime paths, hooks, DevTools config, `forwardAuthHeader`, or `versions.node`.
- Keep English and German docs semantically aligned if Docus text changes.
- Run `git diff --check`.
- Run `pnpm.cmd --filter docs run verify` if docs/API reference generation could be affected; otherwise record why it was skipped.
- Update task handoff notes if useful.
- Update `.agents/NEXT.md` with a focused re-review prompt.
- Commit the integration fix with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- finding addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
