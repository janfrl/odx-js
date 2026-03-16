# ODX Deployment Documentation

## Architecture
Standalone AppRouter on SAP BTP Cloud Foundry.

## XSUAA & Identity
*   **Tenant Mode**: `shared` (Required for Bechtle Subaccounts).
*   **Identity**: `xsappname` must be globally unique within the region.

## The Redirect Strategy (v1.1.2)
To ensure the redirect leads to the **Bechtle IDP** and not the generic SAP login:
1.  **AppRouter Host**: Must start with the Subdomain (e.g., `abap-development-bechtle-test-odx`).
2.  **TENANT_HOST_PATTERN**: A RegEx that captures everything before the landscape domain.
3.  **Dedicated mode**: Must be DISABLED (`UAA_TENANT_MODE` removed) so the AppRouter performs tenant lookup.

## Troubleshooting "Authorization Request Error"
1.  **Cause**: Redirect URI mismatch in `xs-security.json`.
2.  **Solution**: Use broad wildcards for the region during development.

## Version History
*   **v1.1.1**: Tried Dedicated Mode (resulted in generic SAP login).
*   **v1.1.2**: Switched back to Shared Mode with optimized Host Pattern.
