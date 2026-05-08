# Review: Document development and production Explorer runtime differences

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/086-document-dev-prod-explorer-runtime-differences.md`
Reviewed commit: `2c980a3bf464a3293dcf9fa9072bef730d20f560`
Integration fix commit: `780c994ab64a072a72e0a400054ca09a8b715676`
Decision: approved after focused re-review

## Findings

1. [P1] Resolved by `780c994ab64a072a72e0a400054ca09a8b715676`.
   `ARCHITECTURE.md:125` contradicted the production `/__odx__/logs`
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

2. [P2] Resolved by `780c994ab64a072a72e0a400054ca09a8b715676`.
   `SECURITY.md:30` said `packages/approuter/xs-app.json` requires XSUAA
   for `/__odx__/*` "on the proxy", but the documented and implemented
   production route split sends `/__odx__/client` and `/__odx__/client/*` to
   the Explorer UI and routes only `/__odx__/{config,logs,schema,generate,types,me}`
   to the proxy runtime API (`DEPLOYMENT.md:169`, `DEPLOYMENT.md:171`,
   `docs/content/en/5.explorer/2.reference.md:90`). This root-doc wording
   contradicts the Explorer development-versus-production routing explanation.
   Fix the Security wording to distinguish the authenticated Explorer UI route
   from the supported authenticated proxy runtime API routes.

## Acceptance Criteria

- [x] Users can tell which Explorer features are development-only, production
      runtime-only, or available in both modes: pass after the integration fix
      clarified the production log default in `ARCHITECTURE.md`.
- [x] The docs clearly state that production Refresh Metadata updates runtime
      metadata cache state only and does not generate TypeScript SDK files:
      pass.
- [x] The docs clearly state how production config, schema, logs, types, and
      user-context endpoints are authenticated, sanitized, disabled, or backed
      by SQL storage: pass after the integration fix aligned logs with the
      disabled-by-default production policy.
- [x] English and German docs are semantically aligned: pass for the touched
      Explorer runtime comparison, endpoint policy, Nuxt deployment, and proxy
      reference sections.
- [x] Root docs and Docus docs do not contradict each other on Explorer
      development versus production behavior: pass after focused re-review of
      the two fixed findings.

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
- Focused re-review of `780c994ab64a072a72e0a400054ca09a8b715676`:
  - `git show --name-status --no-renames 780c994` - pass; the fix touched only
    Markdown documentation, review, task, and workflow files.
  - `git show --unified=80 --no-ext-diff 780c994` - pass; `ARCHITECTURE.md`
    now says production traffic history is disabled by default while local
    development and tests remain memory-backed, and `SECURITY.md` separates
    Explorer UI routes from supported proxy runtime API routes.
  - Focused `Select-String` and `git grep` consistency searches over the root
    docs and relevant Docus pages - pass; no stale production memory-backed
    default wording or broad `/__odx__/*` AppRouter proxy-route wording
    remains. The remaining German `memory-backed` match is local-development
    column text paired with production being disabled unless SQL is configured.
  - Sensitive-detail search over the reviewed docs - pass; matches are generic
    examples, environment-variable names, route patterns, or omission/redaction
    policy wording. No customer-specific BTP routes, credentials, destinations,
    backend URLs, auth details, outbound headers, TLS settings, runtime paths,
    or hooks were exposed.
  - `git diff --check` - pass.
  - `pnpm.cmd --filter docs run verify` - pass.

## Residual Risk

- No live SAP BTP/AppRouter deployment smoke test was performed. This is
  acceptable for this documentation-only review.

## Open Questions

- None.

## Test Gaps

- None beyond the documented absence of a live BTP/AppRouter smoke test.

## Summary

Focused re-review found no remaining findings. The integration fix resolved the
production log-storage default contradiction and the AppRouter route wording
contradiction without changing runtime behavior. Task 086 is approved.

## Next Action

- Re-review result: both findings are resolved and task 086 is approved.
- Verification: `git diff --check` and
  `pnpm.cmd --filter docs run verify` passed during focused re-review.
- `.agents/NEXT.md` was updated to resume the workflow through an Orchestrator
  chat for the next ready task.
- Follow-up task or fix required: none for task 086.
