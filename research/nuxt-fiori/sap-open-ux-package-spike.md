# SAP Open UX Package Spike

Date: 2026-07-14

Status: bounded spike superseded by portable implementation

## 2026-07-15 implementation decision

The focused packages remain technically suitable as isolated Node build-time
oracles, but they are not dependencies of the first compiler implementation.

The broader [SAP OData package audit](./sap-odata-package-audit.md) found that an
owned projection is materially smaller and supports browser, edge, serverless,
Bun, Deno, and Node.js targets without shipping compiler or SAP packages.
Nuxt Fiori therefore implements alias/path projection and the first supported
vocabulary terms itself while retaining SAP Open UX packages as compatibility
and vocabulary-breadth references.

ODX remains the only metadata parser and loss-aware metadata owner. Nuxt Fiori
owns its semantic bundle, diagnostics, compiler policy, and runtime controllers.
SAP package types do not leak into public `@me-tools` contracts.

The 2026-07-14 evidence below is retained because it defines when bounded reuse
may become worthwhile for wider vocabulary coverage.
## Evidence

Registry metadata and installed package artifacts were inspected on the date
above. All focused Open UX candidates are maintained in
[SAP/open-ux-tools](https://github.com/SAP/open-ux-tools) and use Apache-2.0.

| Package | Version | Unpacked size | Finding |
| --- | ---: | ---: | --- |
| [`@sap-ux/odata-vocabularies`](https://github.com/SAP/open-ux-tools/tree/main/packages/odata-vocabularies) | 1.0.4 | 923,523 bytes | Candidate. Current OASIS/SAP vocabulary dictionary with term applicability, types, inheritance, and documentation. |
| [`@sap-ux/odata-annotation-core`](https://github.com/SAP/open-ux-tools/tree/main/packages/odata-annotation-core) | 1.0.1 | 182,995 bytes | Candidate. Public alias, qualified-name, identifier, and annotation-path parsing utilities. |
| [`@sap-ux/odata-annotation-core-types`](https://github.com/SAP/open-ux-tools/tree/main/packages/odata-annotation-core-types) | 1.0.1 | 201,501 bytes | Candidate transitively; do not expose its types publicly. |
| [`@sap-ux/xml-odata-annotation-converter`](https://github.com/SAP/open-ux-tools/tree/main/packages/xml-odata-annotation-converter) | 1.0.2 | 145,591 bytes | Oracle only. It requires a separate XML AST and would duplicate ODX parsing/provenance. |
| [`@sap-ux/odata-entity-model`](https://github.com/SAP/open-ux-tools/tree/main/packages/odata-entity-model) | 1.0.1 | 44,806 bytes | Oracle only. Its lookup model duplicates the projection/index that should be derived from ODX metadata. |
| [`@sap-ux/annotation-converter`](https://github.com/SAP/open-ux-odata/tree/main/packages/annotation-converter) | 0.10.21 | 266,035 bytes | Oracle only. Convenient resolved targets, but pre-1.0 and coupled to the older `@sap-ux/vocabularies-types` model. |
| [`@sap-ux/fiori-annotation-api`](https://github.com/SAP/open-ux-tools/tree/main/packages/fiori-annotation-api) | 1.0.15 | 1,028,146 bytes | Reject for the compiler boundary. It is project-editing tooling with CDS, filesystem, and generator dependencies. |
| [`@sap/ux-specification`](https://www.npmjs.com/package/@sap/ux-specification) | 1.144.7 | 25,455,181 bytes | Reject as a foundation. It describes UI5 Fiori Elements project configuration, is very large, and uses the SAP Developer License rather than Apache-2.0. |

The candidate pair targets Node.js 22 or newer, matching both repositories. A
temporary clean install completed with no lifecycle scripts. A live ESM spike
confirmed that `VocabularyService` exposes 24 vocabularies and resolves the
terms required by the first vertical slice:

- `UI.LineItem` and `UI.Facets`;
- `Common.Label`, `Common.ValueList`, and `Common.DraftRoot`;
- `Capabilities.FilterRestrictions`;
- `Validation.Pattern`.

The same spike resolved `UI.LineItem` to its full namespace and parsed
`to_Items/@UI.LineItem` into navigation and term-cast segments.

## Required Boundary

```text
ODX loss-aware CSDL document
  -> owned ODX-to-compiler projection
  -> SAP vocabulary/name/path lookup (build time only)
  -> owned semantic bundle and diagnostics
  -> framework-neutral runtime controllers
```

Rules:

1. Do not parse service metadata a second time with SAP's XML parser.
2. Preserve ODX source locations and unsupported expressions end to end.
3. Convert SAP vocabulary objects immediately into owned compiler facts.
4. Serialize only the owned semantic bundle for production clients.
5. Pin exact SAP package versions initially and upgrade through compatibility
   fixtures because the candidate packages only recently reached 1.0.
6. Use the rejected converters as golden-result oracles, not runtime
   dependencies.

## Implemented experiment

The first implementation slice deliberately did not add the candidate packages.
It used the ODX document directly and compiled one annotated V4 fixture with
owned portable code:

1. traverse the published ODX document contract;
2. resolve references, aliases, targets, and the required paths;
3. compile labels, fields, `UI.LineItem`, `UI.SelectionFields`, and basic
   capability restrictions;
4. retain provenance and diagnose unsupported expressions;
5. prove that the generated bundle can be consumed without SAP packages in the
   browser/runtime dependency graph.

The packed end-to-end result and wider package comparison are recorded in the
[SAP OData package audit](./sap-odata-package-audit.md).
