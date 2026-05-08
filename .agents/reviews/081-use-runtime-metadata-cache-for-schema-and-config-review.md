# Review: Use runtime metadata cache for schema and config

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md`
Reviewed commit: `e3351a019aafc3d275322984d20f1286bf5471e6`
Decision: approved after focused re-review of Integrator fix `f464176568be69de8c8acde70aaea98ab9bdbfa9`

## Findings

1. [P1] Production schema/config responses can leak backend metadata URLs
   through stale reasons:
   `packages/proxy/src/utils/metadata-refresh.ts:119`,
   `packages/proxy/src/utils/metadata-refresh.ts:353`,
   `packages/proxy/src/api/config.ts:45`,
   `packages/proxy/src/api/schema.ts:85`. When a refresh receives invalid
   metadata while a cache fallback exists, `assertValidMetadata` builds an
   error containing the full metadata URL, `refreshRuntimeMetadata` persists
   that raw error as `staleReason`, and the production `/__odx__/config` and
   `/__odx__/schema` responses expose it directly. That bypasses the production
   config redaction boundary and can disclose internal backend hostnames,
   destination URLs, service paths, or query details to every authenticated
   Explorer user. Fix by storing or returning a sanitized stale reason for
   Explorer runtime responses, while keeping sensitive details server-side only
   if needed. Add a regression test where refresh falls back after invalid
   metadata from an internal URL and production config/schema responses do not
   contain that URL.

## Acceptance Criteria

- [x] Schema endpoint works from runtime metadata cache in production mode:
  pass by inspection and focused tests.
- [x] Config endpoint reports entity/schema state from the same cache: pass for
  functional behavior, but fails the sanitization boundary above until stale
  reasons are redacted.
- [x] Production schema/config endpoints do not require `.nuxt/odx/temp`
  writes: pass. The focused test reads from `.odx/cache` with no temp file, and
  schema/config handlers do not write cache files.
- [x] Missing or stale metadata returns actionable status for Explorer: pass for
  status shape, with the privacy fix required for stale reason text.
- [x] Generated types are clearly treated as development/build artifacts: pass
  by inspection; config/schema no longer import generated SDK files and
  `/__odx__/types` remains a generated-artifact endpoint.

## Verification

Run or inspect:

- `git show --stat --oneline e3351a019aafc3d275322984d20f1286bf5471e6` -
  reviewed.
- `git show --no-ext-diff --unified=80 --no-renames
  e3351a019aafc3d275322984d20f1286bf5471e6 -- packages/core/src/server.ts
  packages/core/src/types.ts packages/proxy/src/api/config.ts
  packages/proxy/src/api/schema.ts packages/proxy/src/api/types.ts
  packages/proxy/src/utils/metadata-refresh.ts` - reviewed.
- `git show --no-ext-diff --unified=80 --no-renames
  e3351a019aafc3d275322984d20f1286bf5471e6 --
  packages/proxy/test/explorer-policy.test.ts
  packages/explorer/composables/useODataState.ts
  packages/explorer/composables/useSchemaExplorer.ts
  packages/explorer/test/state.test.ts` - reviewed.
- `Get-Content`/line-number inspection of the reviewed source files - reviewed.
- `git diff --check` - pass.
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
  pass outside sandbox; 1 file, 16 tests. Initial sandboxed run could not find
  `vitest`.

## Residual Risk

- Full proxy, Explorer, lint, and typecheck were not rerun in this review; the
  implementer recorded those checks as passing.
- No live SAP BTP Destination, Connectivity, XSUAA, or customer backend smoke
  test was performed.
- Existing legacy cache files without sidecar state are treated as available
  cache entries, as noted in the implementer handoff.

## Open Questions

- None.

## Test Gaps

- Add a focused production regression test for sanitized stale reasons in
  `/__odx__/config` and `/__odx__/schema`.

## Summary

Task 081 correctly moves schema/config entity parsing away from generated SDK
files and into runtime metadata cache snapshots. Local EDMX file support remains
intact in the covered development fixture path, normal OData proxy code was not
changed, and no db0, evlog, or broad Explorer redesign was added. The task needs
a focused privacy fix before approval.

## Integration Fix

- Sanitized runtime metadata fallback stale reasons before writing metadata
  cache state, preserving actionable status-code failures and replacing/removing
  backend URLs and hostnames from persisted stale reasons.
- Added a regression test where production metadata refresh receives invalid
  metadata through a URL containing an internal upstream URL, falls back to a
  cache entry, and verifies `/__odx__/config` and `/__odx__/schema` do not
  contain the internal URL or hostname.
- Focused verification run:
  `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
  pass outside sandbox; 1 file, 17 tests.
- Integration verification:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
    pass outside sandbox; 1 file, 17 tests.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass outside sandbox; 11
    proxy test files passed, 158 tests passed, 1 skipped, standalone proxy
    example passed.
  - `pnpm.cmd run lint` - pass.
  - `pnpm.cmd run typecheck` - pass.
  - `git diff --check` - pass with Git line-ending warnings only.

## Next Action

- `.agents/NEXT.md` was updated to continue with task 082 implementation.

## Focused Re-review

Decision: approved.

Findings: none.

Reviewed Integrator fix commit:
`f464176568be69de8c8acde70aaea98ab9bdbfa9`.

Scope checked:

- Production `/__odx__/config` and `/__odx__/schema` no longer expose the raw
  invalid metadata stale reason containing backend metadata URLs or hostnames.
- Stale metadata remains actionable for Explorer through the sanitized
  `Received invalid or empty metadata` reason, and status-code failures such as
  `Status: 503` remain visible.
- Normal OData proxy response paths were not changed by the focused fix.
- No db0, evlog, persistence dependency, generated SDK, or broad Explorer UI
  redesign changes were added.
- The regression test covers invalid metadata fetched through a URL containing
  an internal upstream metadata URL, cache fallback, and production
  `/__odx__/config` plus `/__odx__/schema` responses that do not contain that
  internal URL or hostname.

Verification:

- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
  pass outside sandbox; 1 file, 17 tests.
- `git diff --check` - pass.

Residual risk:

- No live SAP BTP Destination, Connectivity, XSUAA, or customer backend smoke
  test was performed.
- Existing legacy cache state files created before the sanitization fix could
  still contain old raw stale reasons until metadata refresh writes a new state
  file.
