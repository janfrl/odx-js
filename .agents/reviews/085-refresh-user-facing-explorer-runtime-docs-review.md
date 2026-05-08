# Review: Refresh user-facing Explorer runtime docs

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md`
Reviewed commit: `1396a2984d1b8621527fd6276a35984b49cef003`
Decision: approved after focused re-review

## Focused Re-Review

Date: 2026-05-08
Reviewed fix commit: `52302ddcdc561f269bd8ba98e8e1a991915991c7`
Scope: focused fix for the production `/__odx__/config` allowlist finding and
the new task 086 follow-up file requested by the operator.
Decision: approved

### Findings

None.

### Focused Acceptance Criteria

- [x] Root docs and Docus docs align on production `/__odx__/config` service
  entries, including the sanitized `metadata` runtime cache state fields:
  `status`, `source`, `stale`, `staleReason`, `refreshedAt`, `timestamp`,
  `hash`, `bytes`, and optional `message`.
- [x] The reviewed docs still do not document secrets, backend URLs,
  destinations, auth, outbound headers, rules, runtime paths, hooks, DevTools
  config, `forwardAuthHeader`, or `versions.node` as production config output.
  These categories are documented only as omitted/redacted production fields or
  as non-output behavior context.
- [x] English and German Explorer reference wording is semantically aligned for
  the production config allowlist and metadata cache-state wording.
- [x] No runtime API behavior or Explorer UI changed in the focused fix. The
  fix commit changed only root/Docus documentation and `.agents` workflow/task
  files.
- [x] The new task
  `.agents/tasks/ready/086-document-dev-prod-explorer-runtime-differences.md`
  is scoped as a documentation follow-up and preserves the non-goals for
  runtime behavior, Explorer UI, secrets, backend URLs, destinations, auth
  details, outbound headers, TLS settings, runtime paths, and hooks.

### Verification Reviewed

- `git diff --name-status 8f340632ebfd7a2d1ae4b7c3fe132df85b796e69 52302ddcdc561f269bd8ba98e8e1a991915991c7` -
  confirmed only documentation and `.agents` files changed.
- `git diff --check 8f340632ebfd7a2d1ae4b7c3fe132df85b796e69 52302ddcdc561f269bd8ba98e8e1a991915991c7` -
  pass.
- `pnpm.cmd --filter docs run verify` - pass.
- Direct inspection of `ARCHITECTURE.md`, `API.md`, `SECURITY.md`,
  `DEPLOYMENT.md`, `docs/content/en/5.explorer/2.reference.md`, and
  `docs/content/de/5.explorer/2.reference.md` - pass for the focused
  config-allowlist alignment.

### Residual Risk

- No live SAP BTP/AppRouter deployment smoke test was performed. This remains
  acceptable for this documentation-only focused fix.

### Next Action

- Task 085 is approved.
- `.agents/NEXT.md` should assign
  `.agents/tasks/ready/086-document-dev-prod-explorer-runtime-differences.md`
  to an Implementer.

## Initial Review Findings

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

## Initial Review Acceptance Criteria

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

## Initial Review Verification

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

## Initial Review Residual Risk

- No live SAP BTP/AppRouter deployment smoke test was performed. This is
  acceptable for this documentation-only review.
- The generated `docs/public/api-reference.json` records raw TypeScript
  internal response types, including optional development-only fields; this is
  not a blocker because the prose production policy still states the production
  redaction boundary.

## Initial Review Open Questions

- None.

## Initial Review Test Gaps

- None beyond the documented absence of live BTP smoke testing.

## Initial Review Summary

The Docus refresh correctly updates the implemented production log-store,
metadata-refresh, schema/config cache, standalone Explorer, and mock-data
behavior in both English and German. The task needs one focused documentation
fix so the root production config allowlist matches the approved runtime
metadata state exposed by `/__odx__/config` and the updated Docus wording.

## Initial Review Next Action (Superseded)

- Superseded by focused fix commit
  `52302ddcdc561f269bd8ba98e8e1a991915991c7` and the approved focused
  re-review above.
