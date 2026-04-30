---
title: ODX - Modernes OData-Entwicklererlebnis
description: ODX ist ein modulares, framework-agnostisches Toolkit, das moderne TypeScript-Webanwendungen mit OData V2/V4-Diensten verbindet.
navigation: false
aside: false
---

::landing-hero
---
headline: OData-Entwicklererlebnis
title: Modernes OData-Entwicklererlebnis
description: ODX macht aus Service-Metadaten typisierte Clients, sicheren Backend-Zugriff und einen klareren Entwicklungsablauf.
explorer: "Explorer 0.4: Schema-Graph und Live-Proxy-Tap"
getStarted: Loslegen
getStartedTo: /de/ecosystem/introduction
githubLabel: GitHub
cardTitle: Typisierte OData-Abfrage
cardSubtitlePrefix: Generiert aus
metadata: Metadaten
fields: Felder
relations: Beziehungen
dataTab: Daten
---
::

::landing-bento
---
headline: Warum ODX
title: Der kürzere Weg von Service-Metadaten zur fertigen UI
description: Das Toolkit hält wiederkehrende OData-Arbeit nah am Framework und sichtbar während der Entwicklung.
features:
  - title: Typisiert aus Metadaten
    description: Generiere Modelle, Entity Sets und Query-Helper direkt aus EDMX, statt Client-Typen manuell zu pflegen.
    icon: i-lucide-braces
  - title: SAP-kompatibler Zugriff
    description: Leite über einen Nitro-Proxy zu Destinations, Auth-lastigen Services, CSRF-Handling und Backend-Isolation.
    icon: i-simple-icons-sap
  - title: Sichtbar beim Entwickeln
    description: Prüfe Schemas, Beziehungen, Requests, Responses und Proxy-Verhalten, ohne den Nuxt-Workflow zu verlassen.
    icon: i-lucide-activity
---
::

::landing-live-demo
---
headline: Live-Demo
title: OData-Services wie lokale Objekte abfragen
description: Zeige ODX eine Metadaten-URL und das SDK generiert typisierte Collections, Entities und Navigation Properties für deine Nuxt-App.
---
#code
  ```ts [composables/products.ts] {4-10}
  import { odata } from '@bc8-odx/nuxt'

  // Vollständig aus deinem EDMX-Schema typisiert
  const products = await odata.northwind
    .Products
    .select('ProductID', 'ProductName', 'UnitPrice')
    .filter({ Discontinued: false })
    .orderBy('UnitPrice', 'desc')
    .top(5)
    .get()

  // products: Product[] aus EDMX abgeleitet
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
  // Automatisch aus EDMX generiert - nicht bearbeiten
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
docsLabel: Dokumentation lesen
docsTo: /de/ecosystem/introduction
githubLabel: Auf GitHub ansehen
githubTo: https://github.com/janfrl/odx-js
title: Starte mit dem Paket, das du brauchst
description: Installiere ein einzelnes Paket oder kombiniere den kompletten ODX-Stack. Core, Proxy, Nuxt und Explorer funktionieren unabhängig voneinander und zusammen.
---
::
