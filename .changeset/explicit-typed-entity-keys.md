---
"@me-tools/odx-core": minor
"@me-tools/odx-nuxt": patch
---

Add explicit, serializable typed entity keys with metadata-owned EDM types and
V2/V4 literal selection. Decimal and Int64 string identities retain their full
precision without becoming quoted text keys. Existing primitive and composite
record keys keep their behavior. Shared path construction applies the contract
to root and contained reads, mutations, media, references, and batches.
