# Task: Refresh user-facing Explorer runtime docs

Status: ready
Owner: unassigned
Created: 2026-05-08
Risk: medium
Review: required

## Objective

Update the English and German Docus pages so the public documentation matches
the approved production Explorer runtime behavior after the log-store,
metadata-refresh, schema/config, standalone UI, and mock-data tasks.

## Context

The first dev/prod documentation task (`084`) captured the task 077 endpoint
policy before the later production runtime work landed. Root documentation has
since been updated during tasks 078-080, but several Docus pages still describe
db0-backed logs and runtime metadata refresh as planned future work, and some
Explorer reference tables still say production `/__odx__/generate` returns
`403`.

Do this after the relevant runtime/API/UI tasks are approved, so the user-facing
docs describe reviewed behavior rather than unapproved implementation details.

Relevant files:

- `.agents/WORKFLOW.md`
- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `.agents/tasks/done/078-introduce-odx-log-store-and-redaction.md`
- `.agents/tasks/done/079-add-db0-backed-explorer-log-store.md`
- `.agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
- `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
- `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
- `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`
- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `docs/content/en`
- `docs/content/de`

## Scope

- Update existing English and German Docus pages that describe Explorer setup,
  Explorer reference behavior, Nuxt deployment, proxy providers/reference, and
  troubleshooting.
- Replace stale future-tense wording for implemented db0-backed log storage,
  redaction boundaries, production log payload policy, and runtime metadata
  refresh.
- Document the current production `/__odx__/generate` behavior as metadata
  refresh only, not TypeScript SDK generation.
- Document the current `/__odx__/schema`, `/__odx__/config`, and generated type
  artifact behavior after tasks 080-081 are approved.
- Align Explorer UI wording in docs with the standalone UI behavior after task
  082.
- Document the chosen mock-data behavior after task 083.
- Keep root docs and Docus docs consistent when both describe the same
  internal endpoint contract.

## Non-Goals

- Do not change runtime API behavior.
- Do not change the Explorer UI.
- Do not add another logging, metadata, or persistence abstraction.
- Do not document unapproved behavior from tasks that still need independent
  review.
- Do not publish customer-specific BTP routes, credentials, destinations, or
  backend URLs.

## Acceptance Criteria

- [ ] Docus docs no longer say db0-backed production logs are merely planned
      once task 079 is approved.
- [ ] Docus docs no longer say runtime metadata refresh is merely planned or
      that production `/__odx__/generate` returns `403` once task 080 is
      approved.
- [ ] Docus docs clearly distinguish Refresh Metadata from development SDK/type
      generation.
- [ ] Docus docs describe production schema/config cache behavior without
      implying production writes generated TypeScript SDK files.
- [ ] English and German pages are aligned for every touched topic.
- [ ] Root docs and Docus docs do not contradict each other on production versus
      development Explorer behavior.

## Verification

Task-local checks:

- `git diff --check`
- `pnpm.cmd --filter docs run verify`

Manual checks:

- Search `docs/content/en` and `docs/content/de` for stale future-tense
  phrases around `planned`, `follow-up`, `db0`, `metadata refresh`, `generate`,
  `403`, and `mockdata`.
- Inspect changed English/German sections side by side for semantic alignment.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because the task is documentation-only but describes production
runtime API behavior, auth, redaction, deployment, and generated artifact
boundaries. Separate review is required so the public docs do not over-promise
or contradict the reviewed runtime behavior.

## Handoff Notes

To be completed by the implementer:

- changed files
- summary
- tests run
- skipped checks and residual risk
- self-check result
- review requirement decision
- task state movement
- `.agents/NEXT.md` update
- commit hash
- known gaps
