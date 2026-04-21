# Quickstart: Constitutional Compliance Verification

## Verification Steps

To verify that the project is in strict compliance with the project constitution after refactoring, follow these steps:

### 1. Package Boundary Audit
Run the following command to ensure no illegal imports exist in the core or proxy packages:

```bash
# Core Audit (No Nuxt)
grep -r "nuxt" packages/core

# Proxy Audit (No Nuxt/Kit)
grep -r "nuxt" packages/proxy | grep -v "node_modules"
```

### 2. Dependency Audit
Check `package.json` for each package:

```bash
cat packages/core/package.json
cat packages/proxy/package.json
```
Verify that no Nuxt-related packages are listed in `dependencies` or `peerDependencies`.

### 3. JSDoc Audit
Randomly sample 5 public API functions in `@bc8-odx/core` and `@bc8-odx/proxy`. Verify they have JSDoc comments that:
- Describe purpose, parameters, and return value.
- Do not state the obvious (e.g., "This is a function").

### 4. Build and Typecheck
Ensure the entire monorepo can still be built and typechecked:

```bash
pnpm install
pnpm build
pnpm typecheck
```

### 5. Commit Standards
Verify recent commits follow the Conventional Commits standard:

```bash
git log -n 10
```
