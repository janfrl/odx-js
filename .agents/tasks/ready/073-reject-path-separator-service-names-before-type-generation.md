# Task: Reject path-separator service names before type generation

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: required

## Objective

Fail Nuxt type generation early for configured service names that contain path
separators, before the service name can be used to build generated SDK output
paths.

## Context

Recent tasks made generated registry declarations valid for non-identifier
service names and verified a minimal playground service named `Sales-Order`.
That does not mean every string is a safe generated package name. Service names
containing `/` or `\` can be interpreted as path separators when generation
builds package output paths such as `.odx/<serviceName>`.

This task should reject path-separator service names narrowly before Nuxt type
generation, without changing support for safe non-identifier names such as
`Sales-Order`.

Relevant files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
- `.agents/tasks/done/061-document-service-name-type-generation-limits.md`
- `.agents/tasks/done/065-verify-non-identifier-service-names-in-minimal-nuxt-playground.md`
- `packages/nuxt/src/generate.ts`
- `packages/nuxt/test/generate.test.ts`

## Scope

- Add failing tests first for service names containing `/` and `\` in the Nuxt
  type generation path.
- Reject path-separator service names before `generateODataTypes()` receives an
  output directory derived from the service name.
- Include an actionable error message that names the invalid service and states
  that path separators are not allowed.
- Preserve support for safe non-identifier names already covered by prior
  tasks, including `Sales-Order`.
- Keep validation local to Nuxt setup/type generation; use a tiny helper only
  if it keeps the implementation clearer and package-local.

## Non-Goals

- Do not reject all non-identifier service names.
- Do not change generated registry declaration quoting, model output layout for
  valid services, metadata download behavior, runtime composable lookup,
  Explorer behavior, proxy behavior, dependencies, lockfiles, or generated
  files.
- Do not add broad schema validation for every service config field.

## Acceptance Criteria

- [ ] A focused test fails before implementation for a service name such as
  `Sales/Order` or `Sales\\Order`.
- [ ] Nuxt type generation rejects service names containing `/` or `\` before
  invoking `odata2ts` or writing generated output under that service name.
- [ ] Safe non-identifier service names such as `Sales-Order` remain supported.
- [ ] The thrown error is specific enough for a module user to fix the config.
- [ ] Focused Nuxt generation checks remain green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- none unless the implementation broadens beyond Nuxt type-generation
  validation

Setup/data prerequisites:

- Use local Nuxt generation fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this changes public Nuxt config validation behavior and can
turn previously accepted service names into setup-time errors. Separate review
is required to verify the validation boundary, error message, and compatibility
for safe non-identifier service names.

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
