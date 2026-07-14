---
title: ODX - Modern OData Developer Experience
description: ODX is a modular, framework-agnostic toolkit that bridges modern TypeScript web apps and OData V2 / V4 services with first-class support for SAP.
navigation: false
aside: false
---

::landing-hero
---
headline: OData Developer Experience
title: Modern OData Developer Experience
description: ODX turns service metadata into typed clients, safer backend access, and a clearer development loop.
explorer: "Explorer 0.4: schema graph and live proxy tap"
getStarted: Get started
getStartedTo: /en/ecosystem/introduction
githubLabel: GitHub
cardTitle: Typed OData query
cardSubtitlePrefix: Generated from
metadata: metadata
fields: fields
relations: Relations
dataTab: Data
---
::

::landing-bento
---
headline: Why ODX
title: A shorter path from service metadata to working UI
description: The toolkit keeps the repetitive OData work close to the framework and visible during development.
features:
  - title: Typed from metadata
    description: Generate models, entity sets, and query helpers directly from EDMX instead of maintaining client types by hand.
    icon: i-lucide-braces
  - title: SAP-ready access
    description: Route through a Nitro proxy for destinations, auth-heavy services, CSRF handling, and backend isolation.
    icon: i-simple-icons-sap
  - title: Visible while developing
    description: Inspect schemas, relationships, requests, responses, and proxy behavior without leaving the Nuxt workflow.
    icon: i-lucide-activity
---
::

::landing-live-demo
---
headline: Live demo
title: Query any OData service like a local object
description: Point ODX at a metadata URL and the SDK generates typed collections, entities, and navigation properties for your Nuxt app.
---
#code
  ```ts [composables/products.ts] {4-10}
  import { odata } from '@me-tools/odx-nuxt'

  // Fully typed from your EDMX schema
  const products = await odata.northwind
    .Products
    .select('ProductID', 'ProductName', 'UnitPrice')
    .filter({ Discontinued: false })
    .orderBy('UnitPrice', 'desc')
    .top(5)
    .get()

  // products: Product[] inferred from EDMX
  ```

  ```ts [nuxt.config.ts] {4-11}
  export default defineNuxtConfig({
    modules: ['@me-tools/odx-nuxt'],

    odx: {
      services: {
        northwind: {
          url: 'https://services.odata.org/V4/Northwind/Northwind.svc',
          version: 'v4',
        },
      },
    },
  })
  ```

  ```ts [.odx/northwind.d.ts]
  // Auto-generated from EDMX - do not edit
  export interface Product {
    ProductID: number
    ProductName: string
    UnitPrice?: number
    UnitsInStock?: number
    Discontinued: boolean
    Category?: Category
    Supplier?: Supplier
  }
  ```

#response
  ```json [response.json]
  {
    "@odata.context": "$metadata#Products",
    "value": [
      {
        "ProductID": 38,
        "ProductName": "Cote de Blaye",
        "UnitPrice": 263.50,
        "Discontinued": false
      },
      {
        "ProductID": 29,
        "ProductName": "Thuringer Rostbratwurst",
        "UnitPrice": 123.79,
        "Discontinued": true
      }
    ]
  }
  ```
::

::landing-cta
---
docsLabel: Read the docs
docsTo: /en/ecosystem/introduction
githubLabel: Star on GitHub
githubTo: https://github.com/me-tools/odx
title: Start with the package you need
description: Install one package or compose the full ODX stack. Core, Proxy, Nuxt, and Explorer are designed to work independently and together.
---
::
