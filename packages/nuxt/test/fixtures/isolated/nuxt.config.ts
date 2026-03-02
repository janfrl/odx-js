import { defineNuxtConfig } from 'nuxt/config'
import ODataModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    ODataModule,
  ],
  odata: {
    services: [
      {
        name: 'NorthwindIsolated',
        url: 'https://services.odata.org/V4/Northwind/Northwind.svc/',
        strategy: 'direct',
      },
    ],
  },
})
