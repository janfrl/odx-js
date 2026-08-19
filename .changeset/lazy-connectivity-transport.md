---
'@me-tools/odx-proxy': patch
---

Load the Node-specific SAP Connectivity proxy transport only for requests that
actually carry Connectivity credentials, keeping ordinary Nitro and Workerd
proxy runtimes free of the `undici` transport graph.
