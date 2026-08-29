---
"@me-tools/odx-core": patch
---

Require exactly one result group when parsing the response to a single atomic changeset. Reject multiple successful or mixed-outcome sibling groups instead of flattening them into an atomic success or failure. Independent batch parsing remains unchanged, and V2/V4 mutation transports preserve the mismatch without replaying writes.
