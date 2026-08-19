# SAP BTP Connectivity proxy routing

## Decision

ODX treats an SAP Destination with `ProxyType=OnPremise` as a transport
contract, not merely destination metadata. Resolution requires a bound
Connectivity service and validated `onpremise_proxy_host` plus
`onpremise_proxy_http_port` credentials. The deprecated
`onpremise_proxy_port` is accepted as a compatibility fallback. No regional
endpoint is guessed.

The proxy runtime creates an authenticated HTTP proxy dispatcher with the
Connectivity access token. It applies the dispatcher consistently to runtime
metadata refreshes, CSRF preflights, buffered requests, and streamed requests. For an explicit
`PrincipalPropagation` destination, an available user token is carried as
`SAP-Connectivity-Authentication` within the tunneled request.

The Node-specific `undici` transport is loaded only after a request resolves
actual Connectivity credentials. Ordinary direct and Workerd-compatible proxy
requests therefore do not evaluate the Node HTTP client graph, while the
authenticated On-Premise path retains the same dispatcher cache and tunnel
semantics.

## Primary references

- SAP Help, [Consuming the Connectivity Service](https://help.sap.com/docs/connectivity/sap-btp-connectivity-cf/consuming-connectivity-service): Cloud Foundry applications consume the service through the HTTP proxy credentials and authenticate the proxy with a bearer token.
- SAP Help, [Using the Connectivity Proxy](https://help.sap.com/docs/connectivity/sap-btp-connectivity-cf/using-connectivity-proxy): the Connectivity endpoint behaves as a standard HTTP proxy and principal propagation uses `SAP-Connectivity-Authentication`.
- undici, [ProxyAgent API](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md): `ProxyAgent` supplies an authenticated dispatcher for fetch requests.

## Deterministic evidence

- `packages/proxy/test/btp-destination.test.ts` verifies required bindings,
  current/deprecated port fields, validation, and principal-propagation scope.
- `packages/proxy/test/target.test.ts` verifies Connectivity routing survives
  target resolution.
- `packages/proxy/test/metadata-connectivity-proxy.test.ts` proves a runtime
  metadata refresh uses the authenticated tunnel and scoped propagation header.
- `packages/proxy/test/connectivity-proxy.integration.test.ts` runs an actual
  local HTTP CONNECT proxy and verifies the virtual target path,
  `Proxy-Authorization`, and `SAP-Connectivity-Authentication`.
- `packages/proxy/test/btp-connectivity-interaction.integration.test.ts`
  exercises the complete ODX handler boundary with an AppRouter-style user
  token, Destination authentication, real CONNECT tunnelling, SAP CSRF/session
  preparation, and both buffered and streamed mutations.
- `packages/proxy/test/connectivity-proxy.test.ts` verifies dispatcher reuse
  is scoped to the proxy endpoint and hashed token identity, and that the
  ordinary no-Connectivity path resolves without loading transport state.

This local interaction contract does not claim a successful Cloud Foundry
deployment, XSUAA login redirect, HTML5 Application Repository publication, or
Work Zone launch. Those remain environment-owned deployment evidence.
