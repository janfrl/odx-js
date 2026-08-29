---
"@me-tools/odx-core": minor
"@me-tools/odx-nuxt": patch
---

Preserve MIME Content-ID separately on batch operation responses and expose the serialized request IDs on changeset payloads. Add portable response-correlation helpers and apply them in V2/V4 Nuxt composable and request-scoped mutation transports, including independent changesets. Reordered successful responses retain the correct bodies and ETags; mixed, duplicate, foreign, or incomplete identities reject. Fully ID-less legacy responses retain wire order with exact result-count validation, without claiming verifiable correlation for those non-correlatable responses.
