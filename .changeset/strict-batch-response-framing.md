---
"@me-tools/odx-core": patch
"@me-tools/odx-nuxt": patch
---

Parse OData batch responses using MIME delimiter lines rather than arbitrary boundary-text occurrences. Preserve boundary text inside JSON values, ignore MIME preamble/epilogue, and reject missing outer or nested closing delimiters instead of accepting incomplete read or mutation results. Existing CRLF/LF handling and per-operation error isolation remain intact.
