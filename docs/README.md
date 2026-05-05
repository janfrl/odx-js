# ODX Docs

Documentation workspace for the ODX site, package guides, and generated API
reference data.

## Verification

From the repository root:

```bash
pnpm.cmd --filter docs run verify
```

This runs docs metadata extraction and root API reference extraction without
starting the docs development server. It is intended as a package-local check
for documentation automation, not a full site preview.

Use `pnpm.cmd` on Windows PowerShell in this repository when `.ps1` launchers
are blocked.

For project setup, package verification, and contribution expectations, see the
root `README.md` and `CONTRIBUTING.md`.
