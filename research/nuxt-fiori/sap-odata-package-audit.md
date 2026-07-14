# SAP OData Package Audit

Date: 2026-07-15

Status: owned portable implementation selected

## Executive decision

Do not add a SAP package to the production or build graph for the first Nuxt
Fiori semantic compiler slice.

SAP publishes useful OData, annotation, mock-server, and project-tooling
packages, but none matches the required boundary:

- consume the existing loss-aware ODX document without parsing metadata twice;
- run without Node.js APIs in every modern JavaScript target supported by Nuxt;
- keep the production bundle free of compiler and vocabulary packages;
- retain ODX provenance and unsupported expressions;
- expose only owned, versioned, serializable contracts;
- avoid transport, BTP connectivity, filesystem, project-generation, and UI5
  project assumptions.

The first slice is therefore implemented with dependency-free
`@me-tools/fiori-core` and a portable `@me-tools/fiori-odx` adapter. SAP
packages remain compatibility and vocabulary oracles. They can be reconsidered
for offline corpus generation if maintaining the full vocabulary catalog becomes
more expensive than isolating their Node-only tooling.

## Requirements used for evaluation

| Requirement | Reason |
| --- | --- |
| One metadata owner | ODX already preserves XML/JSON CSDL, source order, unknown constructs, and provenance. A second parser creates conflicting models. |
| Universal package runtime | Core and adapter code should work in browser, edge, serverless, Bun, Deno, and Node.js environments. |
| Plain artifacts | Production clients should consume a semantic bundle, not raw CSDL or a vocabulary compiler. |
| Deterministic diagnostics | Unsupported or ambiguous semantics must be explainable and source-linked. |
| Small dependency graph | The first slice should not acquire server connectivity, code generation, UI5 project, or mock-server dependencies. |
| Owned public contract | SAP-specific types must not leak into `@me-tools` APIs. |

## Candidate findings

Registry metadata was queried on 2026-07-15. Source ownership was checked in the
official SAP repositories.

| Candidate | Current evidence | Decision |
| --- | --- | --- |
| `@sap-ux/odata-vocabularies@1.0.4` | Apache-2.0, Node 22+, about 924 KB unpacked. Rich 24-vocabulary catalog with term/type lookup. | Oracle or offline catalog input. Not needed for the implemented term subset and not portable runtime code. |
| `@sap-ux/odata-annotation-core@1.0.1` | Apache-2.0, Node 22+, about 183 KB unpacked. Qualified-name and path utilities. | Oracle. Owned alias and path projection is smaller and retains ODX provenance directly. |
| `@sap-ux/odata-entity-model@1.0.1` | Apache-2.0, Node 22+, about 45 KB unpacked. | Reject as a product dependency because it duplicates the ODX-derived projection. |
| `@sap-ux/xml-odata-annotation-converter@1.0.2` | Apache-2.0 and focused, but requires SAP's XML AST. | Oracle only; production use would parse and model the same metadata twice. |
| `@sap-ux/annotation-converter@0.10.21` | Apache-2.0, pre-1.0, tied to the older vocabulary type model. | Oracle only. |
| `@sap-ux/annotation-generator@1.0.15` | Node 22+, depends on project access, mem-fs, Fiori annotation API, legacy converter, entity model, and vocabulary types. | Reject; it generates/edits application projects rather than compiling portable runtime semantics. |
| `@sap-ux/fiori-annotation-api@1.0.15` | Node project-editing API with CDS, filesystem, and generator dependencies. | Reject as a compiler foundation. |
| `@sap-ux/fe-mockserver-core@1.7.14` | About 769 KB unpacked; depends on body-parser, router, chokidar, Chevrotain, the legacy converter, and `@sap-ux/edmx-parser@0.10.0`. | Keep in the ODX playground only. It is useful Node development middleware, not a portable metadata or semantic package. |
| `@sap-cloud-sdk/odata-common@4.7.0` | About 548 KB unpacked; depends on connectivity, HTTP client, Moment, BigNumber, and SDK utilities. | Reject for portable ODX/core use. It is a server-side request SDK. |
| `@sap-cloud-sdk/odata-v2@4.7.0` and `odata-v4@4.7.0` | Add version-specific request builders over the same connectivity/HTTP stack. | Keep as reference implementations, not ODX runtime dependencies. |
| `@sap-cloud-sdk/generator@4.7.0` | Adds filesystem, fast-xml-parser, ts-morph, TypeScript, logging, OData clients, and generator-common. | Reject for Nuxt Fiori. ODX already delegates SDK generation to odata2ts and the semantic compiler must not become codegen tooling. |
| `@sap/ux-specification@1.144.7` | Roughly 25 MB unpacked and SAP Developer License. Models UI5 Fiori Elements project configuration. | Reject on scope, size, and license. |

## Layer decisions

### ODX metadata

Keep the owned parser. No reviewed SAP package matches its loss-aware XML/JSON
contract, deterministic identity, security limits, or browser-neutral
implementation.

### ODX transport and proxy

Keep ODX's owned fetch/proxy boundary and focused SAP BTP dependencies in the
server package. SAP Cloud SDK OData clients would add an overlapping request
model and large server connectivity graph without improving the portable
composable contract.

### SDK generation

Keep odata2ts behind the Nuxt build flow for now. SAP Cloud SDK generator is
heavier, server/tooling-oriented, and would create a second public client model.
A future generator comparison should use output correctness and cold-build
benchmarks rather than brand preference.

### Mocking

Keep `@sap-ux/fe-mockserver-core` isolated to the private playground. It is
valuable for Fiori-compatible development behavior, but no publishable ODX or
Nuxt Fiori package should depend on it.

### Nuxt Fiori semantics

Own the neutral expression model, compiler policy, diagnostics, and semantic
bundle. SAP Open UX packages remain golden-result or vocabulary-breadth oracles.
If full vocabulary synchronization is later automated, generate an owned data
artifact offline and verify its license/provenance rather than shipping the
Node package.

## Implemented evidence

The selected architecture was implemented in the Nuxt Fiori repository on the
same date:

```text
ODX CsdlDocument
  -> @me-tools/fiori-odx portable projection
  -> @me-tools/fiori-core semantic compiler
  -> JSON semantic bundle
```

The first fixture covers:

- V4.01 XML aliases and out-of-line annotations;
- entity types, keys, fields, nullability, and labels;
- entity sets;
- `UI.LineItem` and `UI.SelectionFields`;
- filter, sort, and insert restrictions;
- provenance, unsupported-expression, duplicate-annotation, and unmapped-target
  diagnostics.

Verification results:

- Nuxt Fiori full repository gate passed;
- 12 focused tests passed;
- ODX metadata prepack passed 20 tests and type checking;
- packed tarballs installed into an isolated offline consumer;
- the real XML fixture compiled to one entity, one collection, two line items,
  and zero diagnostics;
- a second isolated runtime consumer installed only
  `@me-tools/fiori-core`;
- packed `fiori-core` was 12,768 bytes and packed `fiori-odx` was 11,810
  bytes at version `0.0.0`;
- shipped JavaScript/declarations contained no SAP or `node:` imports.

These sizes are smoke-test observations, not stable performance budgets. Add
minified/gzip and browser bundle measurements when a framework adapter exists.

## Revisit conditions

Reconsider SAP reuse when one of these is true:

1. vocabulary breadth makes owned fact maintenance materially expensive;
2. SAP publishes a browser-neutral vocabulary data package with no Node engine
   or project-tooling graph;
3. a compatibility corpus shows owned name/path behavior diverging from valid
   SAP metadata;
4. an SAP package replaces a currently owned subsystem without reparsing CSDL or
   leaking its types;
5. measured build-time savings outweigh the upgrade and isolation cost.

Until then, the owned implementation is smaller, clearer, more portable, and
better aligned with the ODX/Nuxt Fiori package boundaries.

## Primary sources

- [SAP Open UX Tools](https://github.com/SAP/open-ux-tools)
- [SAP Open UX OData](https://github.com/SAP/open-ux-odata)
- [SAP Cloud SDK for JavaScript](https://github.com/SAP/cloud-sdk-js)
- [npm registry API](https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md)
- [OData Capabilities vocabulary](https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Capabilities.V1.html)
- [SAP Common vocabulary](https://sap.github.io/odata-vocabularies/vocabularies/Common.html)
- [SAP UI vocabulary](https://sap.github.io/odata-vocabularies/vocabularies/UI.html)
