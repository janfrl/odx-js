import { resolve } from 'node:path'
import { startSubprocess } from '@nuxt/devtools-kit'
import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtConfig({
  modules: [
    '../src/module',
    // Subprocess to start the devtools client server
    defineNuxtModule({
      setup(_, nuxt) {
        if (!nuxt.options.dev)
          return

        startSubprocess(
          {
            command: 'npx',
            args: ['nuxi', 'dev', '--port', '3300'],
            cwd: resolve(__dirname, '../client'),
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

  odata: {
    services: [
      {
        name: 'DummyService',
        edmx: 'edmx/dummy.edmx',
        route: 'dummy',
      },
    ],
  },
})
