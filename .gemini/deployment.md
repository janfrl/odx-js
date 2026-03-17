# ODX Deployment Documentation

## Architecture
Standalone AppRouter on SAP BTP Cloud Foundry.

## XSUAA & Identity
*   **Tenant Mode**: `shared` (Required for Bechtle Subaccounts).
*   **Identity**: `xsappname` must be globally unique within the region.

## The Redirect Strategy (v1.1.3)
To ensure the redirect leads to the **Bechtle IDP**:
1.  **AppRouter Host**: Starts with Subdomain + Suffix (e.g., `${xsuaa-subdomain}-odx`).
2.  **TENANT_HOST_PATTERN**: Must exclude the suffix to capture only the subdomain: `^(.*)-odx.cfapps...`.
3.  **Resources**: Increased AppRouter memory to `256M` to prevent OOM errors.

## Redirection & BaseURL
The AppRouter routes `/explorer/` to the UI. Since Nuxt has `baseURL: '/explorer/'`, the AppRouter target must be `/$1` (not `/explorer/$1`) to avoid double prefixes.

## Version History
*   **v1.1.2**: Initial Shared Mode attempt.
*   **v1.1.3**: Refined Tenant Regex, fixed double-prefix in routing, and increased memory.
