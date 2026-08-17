import { defineNuxtConfig } from 'nuxt/config'
import ODataModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    ODataModule,
  ],
  odata: {
    services: [
      {
        name: 'NorthwindV4Isolated',
        url: 'https://services.odata.org/V4/Northwind/Northwind.svc/',
        strategy: 'proxied',
      },
      {
        name: 'NorthwindV2Isolated',
        url: 'https://services.odata.org/V2/Northwind/Northwind.svc/',
        strategy: 'proxied',
      },
    ],
  },
})
