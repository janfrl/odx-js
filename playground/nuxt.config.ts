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
            id: 'odx:client',
            name: 'ODX Client Dev',
          },
        )

        startSubprocess(
          {
            command: 'pnpm',
            args: ['start'],
            cwd: resolve(__dirname, '../local-approuter'),
            env: {
              PORT: '5000',
              destinations: JSON.stringify([
                {
                  name: 'genericodataproxy-destination',
                  url: 'http://localhost:3000',
                  forwardAuthToken: true,
                },
              ]),
            },
          },
          {
            id: 'odx:approuter',
            name: 'SAP Approuter',
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
        icon: 'i-lucide-box',
      },
      {
        name: 'V4Service',
        url: 'edmx/v4.edmx',
        route: 'v4',
        icon: 'i-lucide-package',
      },
      {
        name: 'Northwind',
        url: 'https://services.odata.org/V2/Northwind/Northwind.svc',
        route: 'northwind',
        icon: 'i-lucide-globe',
      },
      {
        name: 'NorthwindDirect',
        url: 'https://services.odata.org/V2/Northwind/Northwind.svc',
        strategy: 'direct',
        icon: 'i-lucide-zap',
      },
    ],
  },
})
