# Review: Reject non-http BTP destination URLs

Status: complete
Date: 2026-05-05
Reviewer: independent Reviewer
Task: `.agents/tasks/done/037-reject-non-http-btp-destination-url.md`
Reviewed commit: `b6c7acb5459f7a741b6247a5e0ae30a781708585`
Decision: approved

## Findings

None.

## Acceptance Criteria

- [x] Tests cover at least two malformed non-empty destination URL cases: pass.
- [x] Production destination resolution rejects non-HTTP(S) URLs before caching: pass.
- [x] Error text clearly identifies an invalid destination URL: pass.
- [x] Existing BTP destination tests remain green: pass.
- [x] Separate review is requested and completed: pass.

## Verification

- `git show --unified=80 b6c7acb5459f7a741b6247a5e0ae30a781708585 -- packages/proxy/src/utils/btp-destination.ts packages/proxy/test/btp-destination.test.ts` - pass, reviewed focused implementation diff.
- Manual inspection of `packages/proxy/src/utils/btp-destination.ts` - pass, `destinationConfiguration.URL` is trimmed, validated as absolute `http:` or `https:`, and rejected before `cacheDestination()` is called.
- Manual inspection of `packages/proxy/test/btp-destination.test.ts` - pass, production rejection tests cover `javascript:alert(1)` and arbitrary text, cache regression coverage uses `file:///etc/passwd`, and development fallback coverage is explicit.
- Manual inspection of commit file list - pass, no proxy request handling, Explorer UI, Nuxt config, dependency, or lockfile changes were included.
- `pnpm.cmd exec vitest run packages/proxy/test/btp-destination.test.ts` - pass, 20 tests.

## Residual Risk

- Real SAP BTP Destination Service response variants beyond the mocked payloads were not exercised locally.
- Broader checks were not rerun during review because the focused BTP test passed and the reviewed diff is limited to the destination utility, tests, and workflow state. The implementer recorded passing proxy verify, typecheck, and lint.
- The branch already contains later completed work for task 038; this review was limited to commit `b6c7acb` and did not review task 038.

## Open Questions

None.

## Test Gaps

None identified for the scoped non-HTTP(S) destination URL behavior.

## Summary

The implementation adds a small URL protocol validator and applies it before constructing or caching a resolved BTP destination. The tests prove production rejection, invalid-result non-caching, and the intentionally preserved local development fallback path.

## Next Action

- `.agents/NEXT.md` was updated to the next ready Implementer prompt for `.agents/tasks/ready/039-report-missing-benchmark-scenarios.md`.
- Follow-up task or fix required: none for task 037.
