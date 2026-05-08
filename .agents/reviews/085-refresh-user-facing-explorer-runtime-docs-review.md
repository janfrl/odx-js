# Review: Refresh user-facing Explorer runtime docs

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md`
Reviewed commit: `1396a2984d1b8621527fd6276a35984b49cef003`
Decision: needs changes

## Findings

1. [P1] Root docs still contradict the updated Docus config contract:
   `API.md:221`, `API.md:222`, `ARCHITECTURE.md:98`,
   `ARCHITECTURE.md:99`, `DEPLOYMENT.md:184`, and `DEPLOYMENT.md:185`
   still say production `/__odx__/config` service entries are limited to
   `name`, `route`, `icon`, `strategy`, `proxyMode`, `entities`,
   `isGenerated`, and `version`. The updated Docus pages now say config
   includes schema/entity status from the runtime metadata cache:
   `docs/content/en/5.explorer/2.reference.md:97` and
   `docs/content/de/5.explorer/2.reference.md:97`, and the implementation
   contract from task 081 includes `metadata` on production config service
   entries. This fails task 085's root-doc/Docus consistency criterion and can
   mislead reviewers about the production config allowlist. Fix by updating the
   root production config allowlist to include the approved sanitized
   `metadata` state fields, or narrow the Docus wording if `metadata` is not
   intended to be part of the production config contract.

## Acceptance Criteria

- [x] Docus docs no longer say db0-backed production logs are merely planned
  once task 079 is approved: pass.
- [x] Docus docs no longer say runtime metadata refresh is merely planned or
  that production `/__odx__/generate` returns `403` once task 080 is approved:
  pass.
- [x] Docus docs clearly distinguish Refresh Metadata from development
  SDK/type generation: pass.
- [x] Docus docs describe production schema/config cache behavior without
  implying production writes generated TypeScript SDK files: pass.
- [x] English and German pages are aligned for every touched topic: pass.
- [ ] Root docs and Docus docs do not contradict each other on production
  versus development Explorer behavior: fail due the production config
  `metadata` allowlist mismatch above.

## Verification

Run or inspect:

- `git show --stat --oneline --no-renames 1396a2984d1b8621527fd6276a35984b49cef003` - reviewed.
- `git show --no-ext-diff --unified=80 --no-renames 1396a2984d1b8621527fd6276a35984b49cef003 -- <changed docs>` - reviewed touched English and German Docus pages, `SECURITY.md`, generated API reference, and workflow/task files.
- `Select-String` inspection of `API.md`, `ARCHITECTURE.md`,
  `DEPLOYMENT.md`, `SECURITY.md`, touched Docus pages, and task 081 config
  implementation/tests - reviewed.
- `git diff --check` - pass.
- `pnpm.cmd --filter docs run verify` - pass.
- `Get-ChildItem -Path docs\content\en,docs\content\de -Recurse -File | Select-String -Pattern 'planned','follow-up','db0','metadata refresh','generate','403','mockdata','mock-data','future'` - pass by review. Matches are current endpoint/configuration mentions, retained local generation docs, and the updated SQL-log guidance; no stale planned-runtime wording was found in the reviewed topics.
- English/German side-by-side inspection of touched Explorer, Nuxt deployment,
  module reference, proxy provider/reference, setup, and troubleshooting
  sections - pass.
- Customer-specific leak check by diff inspection and stale-word searches -
  pass. The docs use examples/placeholders and do not expose customer-specific
  BTP routes, credentials, destinations, or backend URLs.

## Residual Risk

- No live SAP BTP/AppRouter deployment smoke test was performed. This is
  acceptable for this documentation-only review.
- The generated `docs/public/api-reference.json` records raw TypeScript
  internal response types, including optional development-only fields; this is
  not a blocker because the prose production policy still states the production
  redaction boundary.

## Open Questions

- None.

## Test Gaps

- None beyond the documented absence of live BTP smoke testing.

## Summary

The Docus refresh correctly updates the implemented production log-store,
metadata-refresh, schema/config cache, standalone Explorer, and mock-data
behavior in both English and German. The task needs one focused documentation
fix so the root production config allowlist matches the approved runtime
metadata state exposed by `/__odx__/config` and the updated Docus wording.

## Next Action

- `.agents/NEXT.md` was updated to request an Integrator fix for the single
  root-vs-Docus config contract finding.
- Follow-up task or fix required: yes, update the affected root docs or Docus
  wording so the production `/__odx__/config` service-entry allowlist is
  consistent.
