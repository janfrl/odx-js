---
"@me-tools/odx-core": patch
---

Enforce EDM integer ranges for typed OData V4 function arguments before URL
serialization. Reject fractional Int64 values, out-of-range integers, and unsafe
numeric Int64 inputs on all client and server function bindings. Preserve exact
accepted strings, nullable values, V4 unsuffixed literals, and the existing V2
FunctionImport contract.
