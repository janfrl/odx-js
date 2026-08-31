---
"@me-tools/odx-core": patch
---

Redact URL userinfo and known credential query/fragment values in new or updated
traffic-log URLs, trace messages and nested trace strings, independently of
payload storage. Preserve ordinary OData query bytes and the actual backend
request. Cover memory/SQL storage and real buffered/streamed proxy requests.
Existing persisted rows and exports are not retroactively rewritten; this is
not general-purpose redaction of business data or unknown credential names.
