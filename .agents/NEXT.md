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

Task 085 focused documentation consistency fix is ready for re-review.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Run a focused re-review for completed task 085 after the integration fix:
- `.agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md`
- `.agents/reviews/085-refresh-user-facing-explorer-runtime-docs-review.md`

Reviewed implementation commit:
- `1396a2984d1b8621527fd6276a35984b49cef003`

Review finding commit:
- `8f340632ebfd7a2d1ae4b7c3fe132df85b796e69`

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/reviewer.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/reviews/085-refresh-user-facing-explorer-runtime-docs-review.md
- .agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md
- ARCHITECTURE.md
- API.md
- SECURITY.md
- DEPLOYMENT.md
- docs/content/en/5.explorer/2.reference.md
- docs/content/de/5.explorer/2.reference.md
- .agents/tasks/ready/086-document-dev-prod-explorer-runtime-differences.md
- the integration fix diff after review commit `8f340632ebfd7a2d1ae4b7c3fe132df85b796e69`

Rules:
- Review only the focused fix for the task 085 config-allowlist finding and the new follow-up task file requested by the operator.
- Confirm root docs and Docus docs align on production `/__odx__/config` service entries including sanitized `metadata` runtime cache state fields.
- Confirm the docs still do not document secrets, backend URLs, destinations, auth, outbound headers, rules, runtime paths, hooks, DevTools config, `forwardAuthHeader`, or `versions.node` as production config output.
- Confirm English and German Explorer reference wording is semantically aligned.
- Confirm no runtime API behavior or Explorer UI changed.
- Check `git diff --check` and `pnpm.cmd --filter docs run verify` results from the integration fix.
- Update the review note with the focused re-review decision.
- If approved, update `.agents/NEXT.md` to assign task 086 to an Implementer; otherwise point `.agents/NEXT.md` to the next focused fix.
- Commit the re-review note and workflow state changes unless a stop condition prevents committing.

When done, summarize:
- findings
- acceptance criteria status for the focused fix
- verification reviewed
- whether task 085 is approved or still needs changes
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
