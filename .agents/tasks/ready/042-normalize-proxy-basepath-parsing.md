# Task: Normalize proxy basePath parsing

Status: ready
Owner: unassigned
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

