# Task: Quote generated registry service keys

Status: done
Owner: Codex
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

- [x] A focused test fails before implementation for a service name containing
  at least one non-identifier character.
- [x] Generated `index.d.ts` is syntactically valid for that service name.
- [x] Generated model namespace aliases are valid TypeScript identifiers.
- [x] Registry keys still preserve the exact configured service names as string
  keys.
- [x] Existing minimal Nuxt playground registry verification remains green.

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

- changed files
  - `packages/nuxt/src/generate.ts`
  - `packages/nuxt/test/generate.test.ts`
  - `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
  - `.agents/NEXT.md`
- summary
  - Added a focused failing `generateRegistryDts()` test for `Sales-Order`.
  - Generated sanitized model namespace aliases such as `Sales_OrderModels`.
  - Emitted quoted registry keys for non-identifier service names while leaving
    ordinary identifier service names unquoted.
  - Preserved exact configured service names in generated string keys and
    import paths.
- tests run
  - FAIL before fix: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts -t "non-identifier"`; generated output contained `Sales-OrderModels` and `Sales-Order:`.
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt run verify`
  - PASS: `pnpm.cmd run typecheck`
  - Initial `pnpm.cmd run lint` failed on regex style in the new helper.
  - PASS after helper regex cleanup: `pnpm.cmd run lint`
  - PASS after regex cleanup: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
- skipped checks and residual risk
  - No browser-mode or dev-server verification was run; the task uses
    deterministic generated-string tests and Nuxt package verification.
  - Existing Node DEP0155 warnings appeared during Nuxt playground verification
    and are unchanged dependency warnings.
- self-check result
  - Scope stayed limited to generated declaration text and focused tests. No
    service config shape, generated model files, output directory layout,
    odata2ts invocation, runtime composables, dependencies, or lockfiles
    changed.
- review requirement decision
  - Separate review is not required because the change is limited to valid type
    declaration generation with focused tests and does not change public
    service naming contracts, runtime composables, generated model output,
    dependencies, or output layout.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update
  - Updated to point at `.agents/tasks/ready/059-cover-buffered-service-specific-response-hooks.md`.
- commit hash
  - The task implementation commit is the commit containing this handoff.
- known gaps
  - Path separator service names in output/cache directories remain out of
    scope, as requested by the task.
