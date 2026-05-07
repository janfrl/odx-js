# Review: Document dev/prod Explorer runtime differences

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/084-document-dev-prod-explorer-runtime-differences.md`
Reviewed commit: `d754437`
Decision: approved

## Findings

None.

## Acceptance Criteria

- [x] Development DevTools Explorer and deployed standalone Explorer are clearly
  distinguished: pass.
- [x] Development versus production authentication behavior is documented:
  pass.
- [x] Current production `/__odx__` endpoint policies are listed, including
  enabled, disabled, sanitized, authenticated, and narrowed AppRouter routing
  behavior: pass.
- [x] Production `/__odx__/config` allowlist includes top-level `basePath`,
  `mode`, and `services`: pass.
- [x] Sanitized production service fields and redacted/omitted fields are
  documented: pass.
- [x] Runtime metadata refresh is separated from TypeScript SDK generation
  without implying production SDK regeneration: pass.
- [x] Production-disabled logs and the planned db0-backed log store/redaction
  follow-up are documented without implying implementation: pass.
- [x] Development redaction and payload-limit expectations are documented:
  pass.
- [x] English and German docs stay aligned where both trees contain relevant
  pages: pass.

## Verification

Run or inspect:

- `git show --stat --oneline --no-renames d754437` - pass; commit is
  documentation/workflow plus generated docs API reference only.
- `git show --no-ext-diff --unified=80 --no-renames d754437 -- ARCHITECTURE.md API.md SECURITY.md DEPLOYMENT.md docs/content/en docs/content/de` -
  pass; reviewed current/future wording and English/German alignment.
- `git show --no-ext-diff --unified=60 --no-renames d754437 -- .agents/NEXT.md .agents/tasks/done/084-document-dev-prod-explorer-runtime-differences.md` -
  pass; remaining production runtime task order was not changed.
- `git diff --check` - pass.
- `pnpm.cmd --filter docs run verify` - pass.

## Residual Risk

- No live SAP BTP/AppRouter smoke test was performed. This is acceptable for
  this documentation-only review because task 077 route behavior was already
  covered by focused implementation and review checks.
- Production logs, db0 persistence, runtime metadata refresh, and standalone UI
  alignment remain follow-up implementation tasks.

## Open Questions

- None.

## Test Gaps

- No blocking gaps for this documentation review.

## Summary

The reviewed documentation accurately describes the current task 077 production
Explorer runtime policy and keeps planned work explicitly future-tense. The
only correction made during review was updating the task handoff's commit-hash
field from `pending commit` to `d754437`.

## Next Action

- `.agents/NEXT.md` was updated to:
  `.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md`
- Follow-up task or fix required: none for task 084.
