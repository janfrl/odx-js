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

Task 081 review found one focused production privacy issue, and the Integrator
fix has been applied. Start a fresh Reviewer chat for focused re-review of:
`.agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md`.

After focused re-review approves task 081, continue the remaining production
runtime sequence in this order:

1. `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
2. `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
3. `.agents/tasks/ready/085-refresh-user-facing-explorer-runtime-docs.md`

## Prompt For Next Chat

```txt
You are the Reviewer for ODX in C:\GitHub\Bechtle-AG\nuxt-sap-odata on branch codex/orchestrator-8h-analysis.

Focused re-review for completed task 081 after the Integrator fix:
- `.agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md`
- `.agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md`

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/001-production-explorer-runtime-apis.md
- .agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md
- .agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md
- packages/proxy/src/utils/metadata-refresh.ts
- packages/proxy/test/explorer-policy.test.ts
- the latest diff

Review stance:
- Review only the focused Integrator fix for the task 081 finding.
- Confirm production `/__odx__/config` and `/__odx__/schema` no longer expose raw stale metadata failure details that can contain backend metadata URLs or hostnames.
- Confirm stale/missing metadata remains actionable for Explorer.
- Confirm normal OData proxy responses were not changed.
- Confirm no db0, evlog, persistence dependencies, generated SDK changes, or broad Explorer UI redesign were added.
- Check the regression test covers refresh fallback after invalid metadata from an internal URL and production config/schema responses do not contain that URL.

Verification:
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
- `git diff --check`

Output:
- findings first with severity and file/line references, if any
- whether task 081 is approved after the focused fix
- verification performed
- commit hash
- residual risk or known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
