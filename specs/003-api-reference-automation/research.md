# Research: API Reference Extraction

## Tool Selection

### Decision: `ts-morph`
**Rationale**: `ts-morph` provides a high-level wrapper around the TypeScript Compiler API, making it significantly easier to navigate the AST, resolve types, and extract JSDoc comments compared to using the raw Compiler API or other lighter-weight parsers like `untyped`. It is well-suited for a standalone script and provides the granularity needed to match the user's specific JSON schema.

**Alternatives considered**:
- **TypeDoc**: Excellent for generating full documentation sites, but overkill for just extracting a JSON artifact. It also has a more complex internal model that can be harder to map to a flat custom schema.
- **untyped**: Already used in the project for some metadata extraction, but it focuses more on converting JS objects/runtime values to schemas. It doesn't provide easy access to JSDoc for individual interface members out of the box.
- **ts-json-schema-generator**: Good for generating JSON schemas, but we need API documentation metadata (descriptions, defaults, specific member info), not just a schema.

## Extraction Strategy

### Parsing JSDoc
We will use `getJsDocs()` on `ts-morph` nodes. For properties, we will specifically look for:
- The main description (summary).
- `@default` tag for the `default` field.
- Required status will be determined via `hasQuestionToken()`.

### Handling Exports
The script will follow the `index.ts` and `module.ts` entry points and only process symbols that are explicitly exported.

### Type Resolution
We will use `getType().getText()` to get a string representation of the types. For complex types, we may need to normalize the string to ensure it's readable.

## Testing Strategy

###ตัดสินใจ: Fixture-based Testing
**Rationale**: We will create a directory `test/fixtures/api-extraction/` containing sample TypeScript files with various edge cases (complex types, nested interfaces, missing JSDoc). The test suite will run the extractor against these files and compare the output with expected JSON snapshots.

**Alternatives considered**:
- **Mocking AST**: Too complex and brittle. Testing against real files is more reliable for AST tools.
