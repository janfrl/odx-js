# CLI Contract: API Extractor

The API extraction tool is a standalone script that processes TypeScript source files and generates a JSON metadata file.

## Usage

The script is executed via `tsx` from the project root.

```bash
pnpm exec tsx scripts/extract-api-docs.ts
```

## Inputs

The script has hardcoded entry points but can be extended to accept arguments in the future.

### Default Entry Points
- `packages/core/src/index.ts`
- `packages/nuxt/src/module.ts`

### TypeScript Configuration
The script will attempt to locate the relevant `tsconfig.json` files automatically to ensure correct type resolution.

## Outputs

### Target File
- `docs/public/api-reference.json`

### Format
The output is a single, minified (or formatted) JSON file matching the `Record<string, ApiItem>` schema.

## Error Handling

- **Invalid TypeScript**: If a source file has syntax errors, the script SHOULD log a diagnostic and exit with a non-zero code.
- **Missing Exports**: If no exports are found in an entry point, the script SHOULD issue a warning but continue.
- **File System Errors**: If the output directory is not writable, the script MUST exit with an error.
