---
title: ODX - Modern OData Developer Experience
description: ODX is a modular, framework-agnostic toolkit that bridges modern TypeScript web apps and OData V2 / V4 services with first-class support for SAP.
navigation: false
aside: false
---

::landing-hero
::

::landing-live-demo
#code
  ```ts [composables/products.ts] {4-10}
  import { odata } from '@bc8-odx/nuxt'

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
    modules: ['@bc8-odx/nuxt'],

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

::landing-bento
::

::landing-cta
::
