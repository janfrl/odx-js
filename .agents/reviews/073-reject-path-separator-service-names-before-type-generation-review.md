# Review: Reject path-separator service names before type generation

Task: `.agents/tasks/done/073-reject-path-separator-service-names-before-type-generation.md`
Reviewer: Codex reviewer subagent
Date: 2026-05-05
Decision: approved

## Findings

None.

## Acceptance Criteria

Pass.

- Validation runs after services without `url` are skipped, but before metadata
  cache filenames, temp filenames, or output directories are derived from
  `svc.name`.
- The thrown error names the invalid service and states that path separators are
  not allowed.
- The `Sales-Order` compatibility test proves safe non-identifier service names
  still reach type generation and keep the expected output path.
- Scope stayed limited to Nuxt type generation and focused tests.

## Verification

Reviewer reran:

- PASS: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
- PASS: `git diff --check`

The reviewer did not rerun the broader checks. The task handoff records these
as passing:

- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

## Review Requirement

Separate review was required because task 073 changes public Nuxt config
validation behavior. The independent review is complete and approved; no
separate fix review is required.
