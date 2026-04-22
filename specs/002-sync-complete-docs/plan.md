# Implementation Plan: Documentation Sync & Completion

**Branch**: `002-sync-complete-docs` | **Date**: 2026-04-21 | **Spec**: [specs/002-sync-complete-docs/spec.md]
**Input**: Feature specification from `/specs/002-sync-complete-docs/spec.md`

## Summary

The goal is to bring the ODX documentation in sync with the current code and complete its coverage. This involves a structural overhaul following the Diátaxis framework, implementing a hybrid API reference strategy (auto-generated technical tables + manually curated guides), and ensuring consistency across all ODX packages (@bc8-odx/core, @bc8-odx/proxy, @bc8-odx/explorer, @bc8-odx/nuxt).

## Technical Context

**Language/Version**: TypeScript, Vue 3, Nuxt 4
**Primary Dependencies**: Nuxt Content v3, Nuxt UI v4, @nuxt/schema (for metadata extraction)
**Storage**: Git-based Markdown files in `./docs/content`
**Testing**: Manual link checking, linting of code snippets
**Target Platform**: Web (Nuxt documentation site)
**Project Type**: Documentation / Web Application
**Performance Goals**: Fast build times for docs, quick navigation
**Constraints**: MUST use Nuxt UI v4 components, MUST stay in sync with monorepo code
**Scale/Scope**: Covers 4 main packages + ecosystem guides

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Spec-Kit Alignment**: Change developed in branch `002-sync-complete-docs`.
- [x] **Boundary Compliance**: Documentation resides in `docs/` and doesn't affect package isolation.
- [x] **Type Safety**: API documentation MUST reflect real TypeScript types. (Hybrid strategy adopted).
- [x] **Test Coverage**: (N/A for content, but build MUST pass).
- [x] **BTP Compatibility**: BTP-specific documentation MUST be accurate.
- [x] **Linting**: Docs code snippets SHOULD pass linting.
- [x] **Documentation**: This IS the documentation task.

**GATES PASSED**: Phase 0 (Research) and Phase 1 (Design) are complete. Ready for task generation.

## Project Structure

### Documentation (this feature)

```text
specs/002-sync-complete-docs/
â”œâ”€â”€ plan.md              # This file
â”œâ”€â”€ research.md          # Phase 0 output
â”œâ”€â”€ data-model.md        # Phase 1 output (metadata schema)
â”œâ”€â”€ quickstart.md        # Phase 1 output (how to contribute to docs)
â””â”€â”€ tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
docs/
â”œâ”€â”€ content/             # Markdown content
â”œâ”€â”€ components/          # Documentation-specific UI components
â””â”€â”€ nuxt.config.ts       # Docs configuration
```

**Structure Decision**: Standard Nuxt Content structure within the existing `docs/` package.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      |            |                                     |


