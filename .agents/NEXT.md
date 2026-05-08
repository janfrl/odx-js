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

Task 086 integration fix is complete. Start a fresh Reviewer chat for focused
re-review of only the two findings in:
`.agents/reviews/086-document-dev-prod-explorer-runtime-differences-review.md`.

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Focused re-review for:
- `.agents/tasks/done/086-document-dev-prod-explorer-runtime-differences.md`

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/reviews/086-document-dev-prod-explorer-runtime-differences-review.md
- .agents/tasks/done/086-document-dev-prod-explorer-runtime-differences.md
- ARCHITECTURE.md
- SECURITY.md
- API.md
- DEPLOYMENT.md
- docs/content/en/5.explorer/2.reference.md
- docs/content/de/5.explorer/2.reference.md
- docs/content/en/2.nuxt/4.deployment.md
- docs/content/de/2.nuxt/4.deployment.md
- docs/content/en/3.proxy/4.reference.md
- docs/content/de/3.proxy/4.reference.md
- the original reviewed commit diff `2c980a3bf464a3293dcf9fa9072bef730d20f560`
- the latest integration fix commit diff

Rules:
- Review only whether the two findings in the review note were fixed.
- Confirm `ARCHITECTURE.md` says production traffic history is disabled by default unless SQL storage is configured, while local development and tests remain memory-backed.
- Confirm `SECURITY.md` distinguishes AppRouter-authenticated Explorer UI routes from supported authenticated proxy runtime API routes.
- Confirm the fix stayed documentation-only and did not change runtime code, Explorer UI, tests, package metadata, generated app output, endpoints, logging providers, persistence adapters, or metadata generation features.
- Confirm root docs and Docus docs no longer contradict each other on production log storage defaults or AppRouter routing for Explorer UI versus proxy runtime APIs.
- Confirm no customer-specific BTP routes, credentials, destinations, backend URLs, auth details, outbound headers, TLS settings, runtime paths, or hooks were exposed.
- Update the review note and `.agents/NEXT.md` with the re-review result.
- Commit the re-review note and workflow state changes with a Conventional Commit unless a stop condition prevents committing.

Verification:
- Inspect the latest integration fix diff.
- Run or verify `git diff --check`.
- Run or verify `pnpm.cmd --filter docs run verify`.

When done, summarize:
- findings, or state that no findings remain
- acceptance criteria status for the two fixed findings
- verification reviewed or run
- whether task 086 is approved or still needs changes
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
