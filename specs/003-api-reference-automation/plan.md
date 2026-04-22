# Implementation Plan: API Reference Automation

**Branch**: `003-api-reference-automation` | **Date**: 2026-04-22 | **Spec**: [specs/003-api-reference-automation/spec.md](spec.md)
**Input**: Feature specification from `/specs/003-api-reference-automation/spec.md`

## Summary

This feature automates the generation of API reference documentation by parsing TypeScript source files directly. We will create a standalone script in `scripts/extract-api-docs.ts` that uses `ts-morph` to extract exported interfaces, types, and functions along with their JSDoc comments. The resulting flat JSON artifact will be used by the Docus-based documentation site to render interactive API reference tables.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: `ts-morph` (for AST/JSDoc parsing), `tsx` (for execution), `fs-extra`  
**Storage**: JSON file (`docs/public/api-reference.json`)  
**Testing**: Vitest (using fixtures)  
**Target Platform**: Node.js (Build-time)  
**Project Type**: CLI / Build Script  
**Performance Goals**: < 5 seconds execution for all packages  
**Constraints**: Must accurately capture union types, optional properties, and JSDoc `@default` tags.  
**Scale/Scope**: Focuses on `packages/core/src/index.ts` and `packages/nuxt/src/module.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Spec-Kit Alignment**: Developing in dedicated branch `003-api-reference-automation`.
- [x] **Boundary Compliance**: Script lives in `/scripts/`, respects package isolation by only reading public entry points.
- [x] **Type Safety**: Target JSON and internal extractor logic will be fully typed.
- [x] **Test Coverage**: Planned unit tests with fixtures in `test/api-extractor.test.ts`.
- [x] **BTP Compatibility**: N/A (Internal tool).
- [x] **Linting**: Will adhere to `@antfu/eslint-config`.
- [x] **Documentation**: Updated `/docs/public/` for Docus consumption.

## Project Structure

### Documentation (this feature)

```text
specs/003-api-reference-automation/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cli-contract.md  # CLI input/output specification
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
scripts/
└── extract-api-docs.ts  # The new extraction script

docs/
└── public/
    └── api-reference.json # Generated artifact

test/
└── api-extractor.test.ts # Verification tests
```

**Structure Decision**: A standalone script in `scripts/` is chosen to keep the build process simple and decoupled from the main packages, as it is a documentation-specific tool.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | | |
