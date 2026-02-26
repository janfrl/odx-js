import { resolve } from 'node:path'
import { startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtConfig({
  modules: [
    '@bc8-odx/nuxt',
    '@nuxt/ui',
    defineNuxtModule({
      setup(_, nuxt) {
        if (!nuxt.options.dev) {
          return
        }

        startSubprocess(
          {
            command: 'npx',
            args: ['nuxi', 'dev', '--port', '3300'],
            cwd: resolve(__dirname, '../packages/explorer'),
          },
          {
            id: 'sap-odata:client',
            name: 'SAP OData Client Dev',
          },
        )
      },
    }),
  ],

  devtools: { enabled: true },

  css: ['~/app.css'],

  odata: {
    services: [
      {
        name: 'V2Service',
        url: 'edmx/v2.edmx',
        route: 'v2',
      },
      {
        name: 'V4Service',
        url: 'edmx/v4.edmx',
        route: 'v4',
      },
    ],
  },
})
