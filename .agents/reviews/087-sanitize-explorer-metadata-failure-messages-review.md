# Review: Sanitize Explorer metadata failure messages

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/087-sanitize-explorer-metadata-failure-messages.md`
Reviewed commit: `fce22db5767da6a631c814ea5e11c8b26c1d1fc9`
Decision: approved

## Findings

None.

## Acceptance Criteria

- [x] Production `/__odx__/generate` failures without a cache fallback do not
      expose backend metadata URLs, hostnames, or local runtime paths: pass.
- [x] Production `/__odx__/config` and `/__odx__/schema` sanitize stale reasons
      loaded from legacy metadata state sidecar files: pass.
- [x] Status-code stale reasons remain visible enough to be actionable: pass.
      `Status: 503` remains visible in stale runtime metadata responses.
- [x] Focused tests cover no-cache refresh failure and legacy sidecar stale
      reason exposure: pass.
- [x] Existing production metadata refresh and stale-cache fallback behavior
      remains intact: pass by diff inspection and focused tests.

## Verification

Run or inspect:

- `git show --stat --oneline --no-renames fce22db5767da6a631c814ea5e11c8b26c1d1fc9` - reviewed.
- `git show --name-only --format=medium --no-renames fce22db5767da6a631c814ea5e11c8b26c1d1fc9` - reviewed.
- `git show --no-ext-diff --unified=120 --no-renames fce22db5767da6a631c814ea5e11c8b26c1d1fc9 -- packages/proxy/src/utils/metadata-refresh.ts packages/proxy/src/api/generate.ts packages/proxy/src/api/config.ts packages/proxy/src/api/schema.ts packages/proxy/test/explorer-policy.test.ts` - reviewed.
- Line-number inspection of `packages/proxy/src/utils/metadata-refresh.ts`,
  `packages/proxy/src/api/generate.ts`, `packages/proxy/src/api/config.ts`,
  `packages/proxy/src/api/schema.ts`, and
  `packages/proxy/test/explorer-policy.test.ts` - reviewed.
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
  pass outside sandbox; 1 file, 20 tests passed. Initial sandboxed run could
  not resolve `vitest`.

## Residual Risk

- No live SAP BTP Destination, Connectivity, XSUAA, or customer backend smoke
  test was performed; this was out of scope for task 087.
- Full proxy verify, lint, and typecheck were not rerun during this review;
  the implementer recorded them as passing, and the focused Explorer policy
  suite passed independently during review.

## Open Questions

- None.

## Test Gaps

- None for task 087 acceptance criteria.

## Summary

The implementation keeps the fix inside the proxy metadata/runtime API
boundary. Production `/__odx__/generate` no-cache refresh errors now expose a
sanitized metadata-refresh failure, and production `/__odx__/config` plus
`/__odx__/schema` sanitize legacy sidecar stale reasons before serialization.
Actionable status text such as `Status: 503` remains visible, while backend
metadata URLs, hostnames, and local paths are removed from the covered runtime
responses. The reviewed commit did not change TypeScript SDK generation
behavior, normal OData proxy responses, Explorer UI copy, metadata cache file
names, dependencies, lockfiles, generated files, or unrelated docs.

## Next Action

- `.agents/NEXT.md` was updated to request implementation of task 088:
  `.agents/tasks/ready/088-cover-btp-destination-metadata-refresh.md`.
- Follow-up task or fix required: none for task 087.
