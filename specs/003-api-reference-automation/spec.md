# Feature Specification: API Reference Automation

**Feature Branch**: `003-api-reference-automation`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description: "# Role and Context You are an expert TypeScript Tooling Developer, highly experienced with AST parsing, TypeDoc, and the Nuxt ecosystem (untyped/unbuild). I am working on an open-source pnpm workspace monorepo called `odx-js` (OData Developer Experience). Currently, maintaining the API reference tables in our Nuxt-based documentation (located in the `/docs` folder) is a manual, error-prone process. # The Goal I want to automate the generation of our API reference data. I need a standalone TypeScript build script that reads the exported types, interfaces, and functions from our packages, extracts their properties and JSDoc comments, and outputs a clean, flat JSON artifact. This JSON will be fetched at runtime by our docs site. # Project Structure - `/packages/core/src/index.ts` (Entry point for the Core SDK) - `/packages/nuxt/src/module.ts` (Entry point for the Nuxt module) - `/docs/public/` (Target directory for the generated JSON) - `/scripts/` (Directory where this new extraction script should live) # Target JSON Schema The script must parse the TypeScript AST and transform it into a flat dictionary where the key is the exported symbol name (e.g., `ODataClientConfig`), and the value matches this exact TypeScript interface: ```typescript interface ApiProperty { name: string; type: string; default?: string; description?: string; required: boolean; } interface ApiItem { title: string; // The name of the interface/type/function description?: string; // The top-level JSDoc comment properties: ApiProperty[]; // The parameters or interface members } // Final Output Shape: Record<string, ApiItem> ```"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Update API Reference Data (Priority: P1)

As a developer, I want to run a script that automatically updates the API reference JSON whenever I change the exported types or interfaces in the core packages, so that I don't have to manually edit documentation tables.

**Why this priority**: This is the core functionality. Without this, the manual process continues.

**Independent Test**: Can be tested by running the script after modifying an interface in `packages/core/src/index.ts` and verifying the change appears in the output JSON.

**Acceptance Scenarios**:

1. **Given** a new exported interface in `packages/core/src/index.ts`, **When** I run the extraction script, **Then** the interface appears in the target JSON with all its properties and descriptions.
2. **Given** a change to a JSDoc comment in `packages/nuxt/src/module.ts`, **When** I run the script, **Then** the `description` field in the JSON for that item is updated.

---

### User Story 2 - Documentation Display (Priority: P2)

As a documentation site developer, I want to fetch a single, flat JSON file containing all API metadata at runtime, so that I can dynamically render reference tables for users.

**Why this priority**: This enables the actual use of the generated data in the documentation site.

**Independent Test**: Can be tested by placing the generated JSON in a web server's public directory and performing a `fetch` request to retrieve and parse it.

**Acceptance Scenarios**:

1. **Given** the generated JSON artifact in `/docs/public/`, **When** the documentation site fetches it, **Then** it receives a valid JSON object matching the `Record<string, ApiItem>` schema.

---

### User Story 3 - CI/CD Integration (Priority: P3)

As a project maintainer, I want the API reference data to be regenerated automatically during the build process, so that the documentation is always in sync with the latest code on the main branch.

**Why this priority**: Ensures long-term maintainability and prevents documentation drift.

**Independent Test**: Can be tested by running the script as part of a build command (e.g., `pnpm run build`) and checking for the existence of the JSON file.

**Acceptance Scenarios**:

1. **Given** a fresh checkout of the repository, **When** I run the build command, **Then** the API reference JSON is generated in the `/docs/public/` directory.

---

### Edge Cases

- **Missing JSDoc**: If an exported item or property lacks a JSDoc comment, the script should still include it but leave the description field empty or undefined.
- **Complex Types**: If a property has a complex type (e.g., a union or intersection), the script should capture the string representation of that type accurately.
- **Circular Dependencies**: The script must handle (or ignore) circular references if it traverses deep structures, though the target schema is flat.
- **Internal/Private Exports**: The script should only process items explicitly exported from the defined entry points.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST extract all exported interfaces, type aliases, and functions from `packages/core/src/index.ts` and `packages/nuxt/src/module.ts`.
- **FR-002**: The system MUST parse JSDoc comments for each exported item to extract top-level descriptions.
- **FR-003**: For interfaces and types, the system MUST extract all members (properties/methods), including their names, types, required status, and JSDoc descriptions.
- **FR-004**: For functions, the system MUST extract parameters as properties, including their names, types, required status, and JSDoc descriptions.
- **FR-005**: The system MUST detect default values from JSDoc `@default` tags or assignment initializers where possible.
- **FR-006**: The system MUST output a single JSON file to `/docs/public/api-reference.json` (or a similar configurable path).
- **FR-007**: The output JSON MUST follow the `Record<string, ApiItem>` schema provided in the goal.
- **FR-008**: The system MUST be executable as a standalone TypeScript script (e.g., via `tsx` or `jiti`).

### Key Entities *(include if feature involves data)*

- **ApiItem**: Represents a single exported symbol (Interface, Type, or Function). Contains a title, description, and a list of properties.
- **ApiProperty**: Represents a single member of an interface/type or a parameter of a function. Contains name, type, default value, description, and required flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public exports from the target files are present in the generated JSON.
- **SC-002**: Script execution completes in less than 5 seconds on a standard developer machine.
- **SC-003**: Zero manual edits are required to sync code changes with the API reference JSON artifact.
- **SC-004**: The generated JSON is valid according to the TypeScript interface `Record<string, ApiItem>`.

## Assumptions

- **JSDoc Convention**: Developers will follow standard JSDoc conventions for documenting APIs.
- **Entry Points**: The files `packages/core/src/index.ts` and `packages/nuxt/src/module.ts` are the definitive sources for public API exports.
- **Flat Output**: A flat dictionary is sufficient for the current documentation needs, even if some types are nested in reality.
- **No Private Members**: Private or protected members of classes/interfaces are out of scope for the public API reference.
