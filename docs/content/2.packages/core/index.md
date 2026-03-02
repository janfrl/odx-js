# ODX Core

The foundational layer of the ODX ecosystem. This package contains the fundamental OData types, utilities, and framework-agnostic clients.

## Features

- **Standardized Types:** Strict TypeScript definitions for OData V2 and V4 responses.
- **Data Flattening:** Recursive utilities to clean up complex OData `d.results` structures.
- **Query Builder:** Helpers for stringifying `$filter`, `$select`, and other system query options.
- **Agnostic Client:** A lightweight `$odata` fetch wrapper that works in any JS environment.

## Installation

::code-group
  ```bash [pnpm]
  pnpm add @bc8-odx/core
  ```
  ```bash [npm]
  npm install @bc8-odx/core
  ```
::
