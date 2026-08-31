---
"@me-tools/odx-nuxt": patch
---

Preserve omitted service authentication during configuration resolution so SDK
metadata downloads can use configured global credentials. Explicit service
profiles, including empty and partial profiles, retain their precedence without
mixing global credential fields. Cover configured and environment-discovered
services plus real HTTP metadata preparation and SDK cache recovery.
