# Data Model: Documentation Metadata

This document defines the schema for auto-generated documentation metadata, used to render API reference tables in the ODX documentation.

## Metadata Extraction

We use `untyped` to parse the TypeScript source files and generate a JSON schema representing the interfaces.

### Entity: `ApiMetadata`

Represents a single interface or type exported from the core packages.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | The name of the interface (e.g., `ModuleOptions`). |
| `description` | `string` | JSDoc description of the interface. |
| `properties` | `ApiProperty[]` | List of members/properties of the interface. |

### Entity: `ApiProperty`

Represents a single property within an interface.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | The property name. |
| `type` | `string` | The TypeScript type (as a string). |
| `default` | `any` | The default value (if specified in `defineNuxtModule` defaults). |
| `required` | `boolean` | Whether the property is mandatory. |
| `description` | `string` | JSDoc comment for the property. |
| `tags` | `string[]` | Any custom JSDoc tags (e.g., `@deprecated`, `@internal`). |

## Documentation Site Contract

The documentation site (`docs/`) expects a `metadata.json` file in its `.data` directory (or similar) containing the extracted information for all public APIs.

### Interface: `DocMetadata`

```typescript
interface DocMetadata {
  interfaces: Record<string, ApiMetadata>;
  composables: Record<string, ApiMetadata>;
}
```
