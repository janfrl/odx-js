# @bc8-odx/metadata

Framework-neutral, loss-aware ingestion of OData CSDL metadata for ODX and higher-level semantic compilers.

> **Experimental contract:** `0.0.x` releases are suitable for evaluation and controlled integration. The raw document contract, deterministic identity algorithm, and canonicalization algorithm are explicitly versioned, but they may still change before `1.0` as the conformance corpus grows.

## Why this package exists

`@bc8-odx/core` continues to own the established low-level OData client utilities. This package introduces a separate metadata boundary for future consumers such as Nuxt Fiori: ingest XML or JSON CSDL without coupling metadata interpretation to a UI framework, transport, or generated client.

The first milestone is deliberately an information-preserving document model, not a fully linked semantic model. A later resolver can consume this model to resolve aliases, references, inheritance, terms, navigation bindings, and capabilities without reparsing source text.

## Installation

```bash
pnpm add @bc8-odx/metadata
```

## Basic usage

```ts
import {
  createCsdlArtifact,
  parseCsdl,
  walkCsdlNodes,
} from '@bc8-odx/metadata'

const source = await fetch('/odata/$metadata').then(response => response.text())
const result = parseCsdl(source, {
  source: { uri: '/odata/$metadata', layer: 'service' },
})

if (!result.document) {
  throw new Error(result.diagnostics.map(item => item.message).join('\n'))
}

const nodes = walkCsdlNodes(result.document)
const artifact = await createCsdlArtifact(result.document, source)

console.log(nodes.length, artifact.documentHash, artifact.sourceHash)
```

Use `parseCsdlXml` or `parseCsdlJson` when the representation is already known. Passing parsed JSON objects is supported, but JSON text is preferred when exact numeric lexemes, duplicate keys, and token locations matter.

## Contract

The public contract consists only of JSON-serializable data and framework-neutral functions:

- XML elements retain expanded namespace names, namespace bindings, attributes, significant child order, comments, CDATA, processing instructions inside the root element, and source ranges.
- JSON text retains property order, duplicate properties, exact primitive tokens in `rawValue`, and source ranges. Numeric `value` is only a convenience value and may be approximate.
- Stable node IDs and provenance paths use the versioned `odx-csdl-id-v1` algorithm.
- Unknown versions and recoverable information loss produce structured diagnostics. An unknown version is never silently treated as V2 or V4.
- `schemas` is a shallow discovery index over the preserved document; it is not a linked or vocabulary-aware semantic model.
- `resolveCsdlNullable` retains the representation-specific defaults: omitted XML `Nullable` defaults to `true`, while omitted JSON `$Nullable` defaults to `false`.
- Parsing performs no I/O and never resolves XML entities or CSDL references.

Raw input is excluded by default. Set `includeRawSource: true` only when retaining the complete supplied string is required. XML declarations, comments, and processing instructions outside the root element are not represented as AST nodes; use `rawSource` when that document trivia matters.

## Deterministic artifacts

`createCsdlArtifact` returns two intentionally different identities:

- `documentHash` hashes the versioned canonical document. It ignores source locations, source identity, raw input, XML comments and processing instructions, insignificant XML whitespace, XML namespace prefixes and attribute order, and JSON object-property order.
- `sourceHash` hashes the exact supplied bytes. Pass `Uint8Array` when original byte encoding matters. A JavaScript string is hashed as UTF-8.

The canonicalization algorithm is versioned as `odx-csdl-canonical-v1`. Its output is designed for deterministic caching and comparisons, not as a standards-defined CSDL canonical form.

## V2 policy

V2 metadata is retained conservatively. Associations, association sets, roles, multiplicities, function imports, legacy namespaces, and SAP extension attributes remain in the raw document model. The package does not pretend to convert them into V4 constructs. Consumers must either handle V2 explicitly or report unsupported semantics.

## Security and resource limits

The XML reader rejects DTD and entity declarations and never performs external resolution. Both readers enforce a configurable nesting limit (`maxDepth`, default `256`). Unknown XML entities, malformed input, duplicate expanded XML attributes, and unbound XML prefixes are diagnosed.

## Non-goals for this milestone

- SAP vocabulary or Fiori annotation interpretation
- Alias/reference linking or automatic reference fetching
- Full CSDL XSD/vocabulary validation
- V2-to-V4 conversion
- OData transport, caching, or request execution
- SmartComponent state or UI rendering
- Replacing the existing parser and APIs in `@bc8-odx/core`
- Byte-for-byte XML round trips from the AST

## Verification

From the repository root:

```bash
pnpm --filter @bc8-odx/metadata run verify
pnpm --filter @bc8-odx/metadata run prepack
```

The focused suite covers V4.01 XML and JSON, conservative V2 preservation, extension data, duplicate JSON keys, large numeric lexemes, nullable defaults, stable identities, canonical/source hashing, malformed inputs, and XML security boundaries.
