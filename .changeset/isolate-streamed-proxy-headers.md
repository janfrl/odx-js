---
"@me-tools/odx-proxy": patch
---

Prevent the streaming HTTP proxy from restoring browser credentials and other
headers removed by ODX policy. Enforce the final vetted header set at fetch
dispatch while retaining request bodies, response streaming, configured backend
credentials, CSRF sessions and Connectivity routing. Real HTTP regressions cover
disabled Authorization forwarding, cookies, forwarding metadata and hop-by-hop
headers against the buffered path.
