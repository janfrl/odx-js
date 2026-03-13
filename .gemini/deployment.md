# ODX Deployment Documentation

## Architecture
The project follows a **Standalone AppRouter** architecture on SAP BTP Cloud Foundry to ensure secure, browser-based authentication (OIDC/SAML) and a "One Proxy, Many Frontends" capability.

### Components
1.  **Gatekeeper (`odx-approuter`)**:
    *   The only entry point with a public URL.
    *   Handles login redirects to the Bechtle IDP.
    *   Routes traffic: `/explorer/` -> UI, `/api/odx/` -> Backend.
2.  **Backend (`odx-proxy`)**:
    *   Nitro server providing the OData proxy logic.
    *   Internal application (routes strictly managed).
3.  **Frontend (`odx-explorer`)**:
    *   Nuxt-based UI for OData exploration.
    *   Served at the `/explorer/` subpath.

## Configuration Details

### XSUAA (`xs-security.json`)
*   **`xsappname`**: `odx-proxy` (Must match the service instance creation).
*   **`tenant-mode`**: `dedicated` (Used for internal Bechtle landscape).
*   **`redirect-uris`**: Must include `https://<approuter-host>.cfapps.<region>.hana.ondemand.com/login/callback`.

### Routing (`xs-app.json`)
*   Uses path-based routing to distinguish between frontends and backend.
*   **Important**: Avoid catch-all routes (`^/(.*)$`) at the top level as they interfere with the AppRouter's internal `/login` paths.

## Troubleshooting "Invalid Account" or Generic Login
If the AppRouter redirects to a generic SAP login or says "Invalid Account":
1.  **Cause**: The XSUAA service instance is in `shared` mode (common in BTP), but the AppRouter URL doesn't allow it to extract the Subdomain (Tenant).
2.  **Solution**: 
    *   Set `host` in `mta.yaml` to start with your subaccount name (e.g., `abap-development-bechtle-test-odx`).
    *   Provide a `TENANT_HOST_PATTERN` regex that captures that first part.

## Version History
*   **v1.0.0 - v1.0.3**: Initial AppRouter setup and XSUAA naming stabilization.
*   **v1.0.4**: Path-based routing fix (removed catch-all).
*   **v1.0.5**: Re-introducing explicit host-based tenant parsing.
