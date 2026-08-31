---
'@me-tools/odx-nuxt': patch
---

Tie generated SDK reuse to metadata content, generator version and verified
model output. Regenerate stale or incomplete models in a separate temporary
directory, update registry imports after namespace changes, and retain the
previous model and registry when generation fails. Preserve unrelated output
files instead of deleting the service directory.
