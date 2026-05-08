# Review: Document development and production Explorer runtime differences

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/086-document-dev-prod-explorer-runtime-differences.md`
Reviewed commit: `2c980a3bf464a3293dcf9fa9072bef730d20f560`
Decision: needs changes

## Findings

1. [P1] `ARCHITECTURE.md:125` contradicts the production `/__odx__/logs`
   policy by saying "Production traffic history remains memory-backed by
   default." The same architecture section already says production logs return
   an empty list and reject `DELETE` unless SQL storage is explicitly
   configured (`ARCHITECTURE.md:116`), and the API, Security, Deployment, and
   Docus pages all describe production traffic history as disabled unless SQL
   storage is configured. This fails task 086's root-doc/Docus consistency
   criterion and can mislead operators into expecting memory-backed production
   history. Fix by saying production traffic history is disabled by default,
   while local development and tests remain memory-backed; keep SQL persistence
   as the explicit production opt-in.

2. [P2] `SECURITY.md:30` says `packages/approuter/xs-app.json` requires XSUAA
   for `/__odx__/*` "on the proxy", but the documented and implemented
   production route split sends `/__odx__/client` and `/__odx__/client/*` to
   the Explorer UI and routes only `/__odx__/{config,logs,schema,generate,types,me}`
   to the proxy runtime API (`DEPLOYMENT.md:169`, `DEPLOYMENT.md:171`,
   `docs/content/en/5.explorer/2.reference.md:90`). This root-doc wording
   contradicts the Explorer development-versus-production routing explanation.
   Fix the Security wording to distinguish the authenticated Explorer UI route
   from the supported authenticated proxy runtime API routes.

## Acceptance Criteria

- [ ] Users can tell which Explorer features are development-only, production
      runtime-only, or available in both modes: fail due to the production log
      default contradiction in `ARCHITECTURE.md`.
- [x] The docs clearly state that production Refresh Metadata updates runtime
      metadata cache state only and does not generate TypeScript SDK files:
      pass.
- [ ] The docs clearly state how production config, schema, logs, types, and
      user-context endpoints are authenticated, sanitized, disabled, or backed
      by SQL storage: fail for logs because `ARCHITECTURE.md` still implies a
      memory-backed production default.
- [x] English and German docs are semantically aligned: pass for the touched
      Explorer runtime comparison, endpoint policy, Nuxt deployment, and proxy
      reference sections.
- [ ] Root docs and Docus docs do not contradict each other on Explorer
      development versus production behavior: fail due the findings above.

## Verification

Run or inspect:

- `git show --name-status --no-renames 2c980a3bf464a3293dcf9fa9072bef730d20f560`
  - pass; the commit changes only root docs, Docus docs, and `.agents`
  workflow/task files.
- `git diff-tree --no-commit-id --name-only -r 2c980a3bf464a3293dcf9fa9072bef730d20f560`
  - pass; no runtime code, Explorer UI, tests, package metadata, generated app
  output, endpoints, logging providers, persistence adapters, or metadata
  generation features were changed.
- `git diff --check 2c980a3bf464a3293dcf9fa9072bef730d20f560^ 2c980a3bf464a3293dcf9fa9072bef730d20f560`
  - pass.
- `pnpm.cmd --filter docs run verify` - pass; worktree remained clean after
  the command.
- Manual `Select-String` searches over changed root and Docus docs for stale
  wording around `planned`, `follow-up`, `metadata refresh`, `Refresh Metadata`,
  `generate`, `403`, `db0`, `mockdata`, `mock-data`, and `DevTools` - pass
  except for the concrete contradictions listed as findings.
- Manual English/German side-by-side inspection of the changed Explorer
  runtime comparison, endpoint policy, runtime refresh, Nuxt deployment, and
  proxy reference sections - pass.
- Manual sensitive-detail search over changed root and Docus docs for
  credentials, destinations, backend URLs, auth details, outbound headers, TLS
  settings, runtime paths, and hooks - pass. Matches are generic public
  examples, generic ODX paths/hooks, or explicit omission/redaction policy
  wording; no customer-specific BTP routes, credentials, destinations, backend
  URLs, auth details, outbound headers, TLS settings, runtime paths, or hooks
  were found.

## Residual Risk

- No live SAP BTP/AppRouter deployment smoke test was performed. This is
  acceptable for this documentation-only review.

## Open Questions

- None.

## Test Gaps

- None beyond the documented absence of a live BTP/AppRouter smoke test.

## Summary

The Docus runtime comparison is generally clear and the English/German sections
are aligned for the task scope. The task needs a focused documentation fix so
root docs no longer contradict the approved production log policy or the
AppRouter route split for standalone Explorer versus proxy runtime APIs.

## Next Action

- Integrator update: the documentation fix addressed both bounded findings by
  aligning `ARCHITECTURE.md` with the disabled-by-default production log
  policy and updating `SECURITY.md` to distinguish Explorer UI routes from
  supported proxy runtime API routes.
- Integration verification: `git diff --check` and
  `pnpm.cmd --filter docs run verify` passed. A focused consistency search
  found no remaining stale production memory-backed default wording or broad
  `/__odx__/*` proxy-route wording.
- `.agents/NEXT.md` was updated to request a focused re-review of task 086.
- Follow-up task or fix required: focused re-review of the integration fix.
