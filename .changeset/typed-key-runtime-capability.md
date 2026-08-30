---
"@me-tools/odx-core": minor
"@me-tools/odx-nuxt": patch
---

Advertise `supportsTypedEntityKeys` on the complete Nuxt runtime and server
service/entity-set surfaces. Semantic adapters can now opt into the explicit
typed key envelope without sending it to older primitive-only transports.
