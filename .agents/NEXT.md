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

Task 086 review found bounded documentation consistency issues. Start a fresh
Integrator chat to address only the findings in:
`.agents/reviews/086-document-dev-prod-explorer-runtime-differences-review.md`.

## Prompt For Next Chat

```txt
You are the Integrator for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Address review findings for:
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
- the reviewed commit diff `2c980a3bf464a3293dcf9fa9072bef730d20f560`

Rules:
- Fix only the concrete review findings assigned in the review note.
- Keep the fix documentation-only.
- Do not change runtime code, Explorer UI, tests, package metadata, generated app output, endpoints, logging providers, persistence adapters, or metadata generation features.
- Do not expose customer-specific BTP routes, credentials, destinations, backend URLs, auth details, outbound headers, TLS settings, runtime paths, or hooks.
- Update the task handoff notes and review note when useful.
- Update `.agents/NEXT.md` with a focused re-review prompt for task 086.
- Commit the integration fix with a Conventional Commit unless a stop condition prevents committing.

Verification:
- Run `git diff --check`.
- Run `pnpm.cmd --filter docs run verify`.
- Confirm root docs and Docus docs no longer contradict each other on production log storage defaults or AppRouter routing for Explorer UI versus proxy runtime APIs.
- Confirm English and German docs remain semantically aligned for any touched Docus content.
- Confirm the fix does not change runtime code, Explorer UI, tests, package metadata, generated app output, endpoints, logging providers, persistence adapters, or metadata generation features.

When done, summarize:
- findings addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
