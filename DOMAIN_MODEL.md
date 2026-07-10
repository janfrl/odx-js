# Domain Model

This file defines the stable ODX concepts used across packages and
documentation.

## ODX

ODX means OData Developer Experience: a toolkit for typed Nuxt access to OData
services, a server-side proxy for SAP-oriented integration, and a DevTools UI
for inspection.

## OData Service

An OData service is a configured backend described by `ODataServiceConfig`.

Required identity:

- `name`: the stable key used by `useOData`, generation, and Explorer.
- `url`: metadata source or backend URL, unless a deployment-specific
  destination fully overrides it.

Optional routing and behavior:

- `route`: URL segment under `basePath`.
- `strategy`: `proxied` or `direct`.
- `proxyMode`: `stream` or `buffer`.
- `destination`: BTP destination name.
- `auth`, `headers`, and `rules`: outbound request and policy controls.

## Strategy

`proxied` means browser and app requests go through Nitro and
`@bc8-odx/proxy`. Use it for private services, SAP BTP destinations,
authentication, policy enforcement, and telemetry.

`direct` means the service can be addressed directly by the browser or tooling.
The Explorer can still use a CORS bridge path by default for development
ergonomics.

## Proxy Mode

`stream` forwards the backend response efficiently and records only streamed
completion in development telemetry.

`buffer` reads the backend response through `ofetch`, which allows response body
inspection and hook handling at the cost of higher memory use.

## EDMX Metadata

EDMX is the XML metadata document that describes an OData service schema. ODX
uses EDMX to:

- detect OData V2/V4
- extract entity sets
- extract entity properties and keys
- extract navigation properties and associations
- generate TypeScript models
- render Explorer schema views

Local EDMX paths are resolved from the Nuxt root. Remote EDMX files are fetched
from `$metadata`.

## Entity Set

An entity set is a named collection exposed by an OData service, such as
`Products` or `Categories`.

In code, entity sets are accessed through:

```ts
useOData().ServiceName.EntitySetName
useOData('ServiceName').entitySet('EntitySetName')
```

## Entity Type

An entity type describes the shape of each item in an entity set. ODX extracts:

- property names
- EDM primitive or complex types
- key properties
- navigation properties

Generated TypeScript models are mapped from entity types.

## Key

An OData key identifies a single entity.

ODX supports:

- string keys
- numeric keys
- composite object keys

Examples:

```ts
await useOData().Northwind.Products.get(1)
await useOData().Demo.Items.get({ CompanyCode: '1000', ID: '42' })
```

## Query

`ODataQuery` is a structured object for OData system query options:

- `$select`
- `$orderby`
- `$top`
- `$skip`
- `$filter`
- `$expand`
- `$inlinecount`
- `$search`

Unknown keys are allowed for service-specific parameters.

## Generated Registry

The generated ODX registry augments `ODataServiceRegistry` in `@bc8-odx/core`.
That registry powers IDE autocomplete for:

- service names
- entity set names
- model shapes returned by `list` and `get`

Do not remove registry augmentation when changing generation.

## BTP Destination

A BTP destination is a managed backend target resolved at runtime through the
SAP Destination service.

ODX destination resolution may produce:

- a target URL
- Basic credentials
- bearer auth tokens
- on-premise connectivity proxy details

Destination resolution is server-side behavior and belongs in `proxy`.

## Security Context

The security context is the SAP XSUAA-derived identity attached to an H3 event.
ODX uses it for:

- current user details in `/__odx__/me`
- scope and attribute policy checks
- principal propagation to BTP destinations

In local development, Explorer may receive a synthetic user so UI workflows can
run without BTP.

## Proxy Trace

A proxy trace is an ordered list of request-stage events, including:

- target resolution
- auth behavior
- rule checks
- hook execution
- response status

Traces are development diagnostics for Explorer. They are not a durable audit
log.

## Traffic Log

A traffic log is an in-memory record of an OData request. It can include method,
URL, target URL, service, entity set, status, duration, payloads, headers, and
proxy trace.

Logs are capped by `devtools.maxLogs` and should stay development-only.

## Mock Data

Mock data is local JSON or local SAP-style routes used for development and
tests. Mock behavior should remain clearly separate from production BTP
destination behavior.
