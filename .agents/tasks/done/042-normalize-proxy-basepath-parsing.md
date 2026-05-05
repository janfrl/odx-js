# Task: Normalize proxy basePath parsing

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if proxy routing contracts or service matching behavior change

## Objective

Make proxy request parsing stable when configured `basePath` values include
trailing slashes or incoming paths have extra boundary slashes.

## Context

Task 036 normalized Nuxt composable URL joins, but proxy-side
`parseODataRequest` still slices the incoming path using the raw `basePath`
length. A user-configured base path with a trailing slash, or a proxied request
with extra boundary slashes, can produce incorrect service and entity segments.
This is a small proxy stability task and should be covered before changing the
parser.

Relevant docs and files:

- `API.md`
- `ARCHITECTURE.md`
- `DOMAIN_MODEL.md`
- `packages/proxy/src/utils/url.ts`
- `packages/proxy/test/url.test.ts`
- `.agents/tasks/done/036-normalize-nuxt-service-url-joins.md`

## Scope

- Add focused tests in `packages/proxy/test/url.test.ts` for:
  - `basePath` configured with a trailing slash.
  - incoming paths with a single extra slash after the base path.
  - query strings remaining unchanged after parsing.
- Normalize path boundary handling inside proxy URL parsing only.
- Preserve route alias resolution, `resolveTargetUrl`, Explorer `id` rewriting,
  and query preservation behavior.

## Non-Goals

- Do not change Nuxt composable URL construction.
- Do not change `basePath` option names or runtime config shape.
- Do not change target URL resolution, BTP destination resolution, proxy rules,
  or auth behavior.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Tests fail before the parser fix for at least one trailing-slash base path
  case.
- [ ] `parseODataRequest` returns the correct service name and OData path for
  base paths with or without a trailing slash.
- [ ] Query strings, including embedded question marks after the first query
  separator, remain preserved.
- [ ] Existing proxy URL tests remain green.
- [ ] No proxy auth, rule, target resolution, or runtime config behavior changes
  are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/url.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local proxy URL tests only; no external OData or SAP BTP service is
  required.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because proxy request parsing is a runtime boundary. Separate
review is not required if the change is limited to base-path boundary
normalization with focused tests and does not alter target URL resolution,
auth, rules, or public configuration fields.

## Handoff Notes

- changed files:
  - `packages/proxy/src/utils/url.ts`
  - `packages/proxy/test/url.test.ts`
  - `.agents/tasks/done/042-normalize-proxy-basepath-parsing.md`
  - `.agents/NEXT.md`
- summary:
  - Added focused parser tests for configured base paths with trailing slashes,
    a single extra slash after the base path boundary, and query preservation
    with embedded question marks.
  - Confirmed the new trailing-slash base path test failed before the fix with
    `serviceName` parsed as `estService` instead of `TestService`.
  - Normalized only `parseODataRequest` boundary handling by trimming trailing
    slashes from the configured base path before slicing and removing leading
    boundary slashes from the remaining request path.
- tests run:
  - Before fix: `pnpm.cmd exec vitest run packages/proxy/test/url.test.ts` -
    failed, 1 failed and 9 passed. Failure: expected `TestService`, received
    `estService`.
  - After fix: `pnpm.cmd exec vitest run packages/proxy/test/url.test.ts` -
    passed, 10 tests.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` - passed, 66 passed and 1
    skipped; standalone proxy example passed.
  - `pnpm.cmd run typecheck` - passed.
  - `pnpm.cmd run lint` - passed.
- skipped checks and residual risk:
  - none.
- self-check result:
  - Scope stayed limited to proxy basePath parsing and focused tests. No Nuxt
    composable URL construction, target URL resolution, BTP destination
    resolution, auth, rules, runtime config shape, Explorer `id` rewriting, or
    dependencies changed.
- review requirement decision:
  - Separate review is not required because the change is limited to parser
    boundary normalization with focused tests and does not alter proxy routing
    contracts, service matching behavior outside `parseODataRequest`, auth,
    rules, target resolution, or public configuration fields.
- task state movement:
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Point to `.agents/tasks/ready/043-test-proxy-benchmark-report-formatting.md`.
- commit hash:
  - pending commit.
- known gaps:
  - none.
