---
"@me-tools/odx-core": patch
---

Reject pending HTTP 202 results from synchronous mutation batch parsers instead of reporting completed writes. Preserve the response details in a typed pending-response error for host-owned reconciliation, without automatic polling or replay. Raw read-batch status parsing is unchanged.
