# Task: Quote generated registry service keys

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if public service naming contracts, generated model output, or runtime composable behavior change

## Objective

Make generated ODX registry declarations valid TypeScript when service names are
not legal TypeScript identifiers, such as names containing spaces, hyphens, or
dots.

## Context

`generateRegistryDts()` currently interpolates service names as TypeScript
identifiers in import aliases and `ODataServiceRegistry` property names. That
works for names such as `MinimalLocal`, but generated declarations can become
syntactically invalid for configured service names such as `Sales-Order` or
`SAP Gateway`.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/055-use-http-client-for-nuxt-metadata-downloads.md`
- `packages/nuxt/src/generate.ts`
- `packages/nuxt/test/generate.test.ts`
- `packages/nuxt/playground/minimal/verify.mjs`

## Scope

- Add focused tests for `generateRegistryDts()` using service names that are
  not valid identifiers.
- Generate valid import aliases for model namespaces without relying on the raw
  service name as an identifier.
- Quote or otherwise safely emit `ODataServiceRegistry` keys so non-identifier
  service names are accepted by TypeScript.
- Preserve generated registry output for ordinary identifier service names as
  much as practical.
- Preserve entity-set string literal unions and model mappings.
- Keep runtime `useOData('service name')` behavior unchanged.

## Non-Goals

- Do not rename configured services, change service config shape, change
  generated model file names, change output directory layout, change odata2ts
  invocation, or alter Nuxt runtime composables.
- Do not add dependencies or broad escaping utilities outside generated type
  declaration needs.
- Do not solve path separator service names in cache/output directories unless
  the focused registry declaration tests require it.

## Acceptance Criteria

- [ ] A focused test fails before implementation for a service name containing
  at least one non-identifier character.
- [ ] Generated `index.d.ts` is syntactically valid for that service name.
- [ ] Generated model namespace aliases are valid TypeScript identifiers.
- [ ] Registry keys still preserve the exact configured service names as string
  keys.
- [ ] Existing minimal Nuxt playground registry verification remains green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use deterministic generated-string tests; do not require a real OData
  service or browser verification.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because generated registry declarations are a package boundary for
Nuxt type inference. Separate review is not required if the change is limited
to valid declaration generation with focused tests and does not change public
configuration, runtime composables, generated model files, dependencies, or
output directory layout.

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

