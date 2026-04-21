# Research: Documentation Sync & Completion

## Decision: Documentation Structure (DiÃ¡taxis)

We will reorganize the `./docs/content` directory to follow the DiÃ¡taxis framework, which divides documentation into four categories:

1.  **Tutorials (Learning-oriented)**: "Getting Started" guide, "Time to First Request".
2.  **How-to Guides (Goal-oriented)**: "How to configure BTP Destinations", "How to use Type Generation", "How to deploy to SAP BTP".
3.  **Reference (Information-oriented)**: Auto-generated API reference for `ModuleOptions`, `useOData`, etc.
4.  **Explanation (Understanding-oriented)**: "OData V2 vs V4 in ODX", "The Proxy Architecture", "Security & CSRF Handling".

## Decision: Hybrid API Reference Strategy

We will adopt a hybrid approach inspired by Nuxt UI:

-   **Metadata Extraction**: Use `untyped` and `@nuxt/schema` to extract metadata (types, defaults, descriptions) from `packages/core/src/types.ts`.
-   **Documentation Component**: Create a custom Vue component (e.g., `<ApiReference />`) in the docs that can render these metadata tables.
-   **Manual Narrative**: Wrap the auto-generated tables with manually written "Usage" and "Examples" sections in Markdown.

## Decision: Content Audit & Gaps

Based on the existing structure, the following gaps need to be filled:

-   **Package Documentation**: `@bc8-odx/core` and `@bc8-odx/explorer` are missing detailed installation and feature guides.
-   **Advanced SAP Guides**: Need dedicated pages for CSRF pre-fetching, Batch requests, and Deep-insertions.
-   **BTP Deployment**: Documentation on `mta.yaml` and `approuter` integration is currently sparse.

## Alternatives Considered

-   **Docus Auto-Doc**: Docus has some built-in support for component documentation, but we need something that works for generic TypeScript interfaces like `ModuleOptions`.
-   **TypeDoc**: Considered for full API site generation, but rejected in favor of keeping everything within the Nuxt Content/Docus ecosystem for a unified user experience.

## Research Tasks Summary

- [x] Analyze Nuxt UI's metadata extraction (Uses `untyped`).
- [x] Audit current documentation coverage (Gaps identified in core/explorer/advanced-sap).
- [x] Verify feasibility of hybrid strategy (Confirmed using `untyped` + custom doc components).

