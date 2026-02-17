import {
  defineNuxtModule,
  createResolver,
  addImportsDir,
  addServerHandler,
} from '@nuxt/kit'
import { join, resolve } from 'pathe'
import { generateODataClient } from './generate'

export interface SapODataService {
  name: string
  edmx: string
  route?: string
}

export interface ModuleOptions {
  mode?: 'sdk'
  basePath?: string
  destination?: string
  forwardAuthHeader?: boolean
  services?: SapODataService[]
  buildDir?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-sap-odata',
    configKey: 'odata',
  },
  defaults: {
    mode: 'sdk',
    basePath: '/api/sap-odata',
    forwardAuthHeader: true,
    services: [],
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const mode = options.mode ?? 'sdk'
    const basePath = options.basePath ?? '/api/sap-odata'
    const forwardAuthHeader = options.forwardAuthHeader ?? true
    const services = options.services ?? []

    nuxt.options.runtimeConfig.odata = {
      destination: options.destination ?? '',
      forwardAuthHeader,
      services,
      buildDir: nuxt.options.buildDir,
    }
    nuxt.options.runtimeConfig.public.odata = {
      mode,
      basePath,
    }

    addImportsDir(resolver.resolve('./runtime/composables'))

    addServerHandler({
      route: `${basePath}/**`,
      handler: resolver.resolve('./runtime/server/api/odata'),
    })

    // Register devtools handler
    addServerHandler({
      route: '/__sap_odata__/logs',
      handler: resolver.resolve('./runtime/server/api/logs'),
    })

    addServerHandler({
      route: '/__sap_odata__/config',
      handler: resolver.resolve('./runtime/server/api/config'),
    })

    // DevTools integration
    if (nuxt.options.dev) {
      // Serve client app during development
      nuxt.hook('vite:extendConfig', (config) => {
        config.server = config.server || {}
        config.server.fs = config.server.fs || {}
        config.server.fs.allow = config.server.fs.allow || []
        config.server.fs.allow.push(resolver.resolve('../client'))
      })

      // @ts-ignore
      nuxt.hook('devtools:customTabs', (tabs) => {
        tabs.push({
          name: 'sap-odata',
          title: 'SAP OData',
          icon: 'logos:sap',
          view: {
            type: 'iframe',
            src: '/__sap_odata__/client/index.html',
          },
        })
      })

      // Add a server middleware for the client files
      // In a real build, we would use sirv or serve-static, 
      // but for development, we can hook into nitro
      nuxt.hook('nitro:config', (nitroConfig) => {
        nitroConfig.publicAssets = nitroConfig.publicAssets || []
        nitroConfig.publicAssets.push({
          dir: resolver.resolve('../client'),
          baseURL: '/__sap_odata__/client',
        })
      })
    }

    nuxt.hook('nitro:build:before', async () => {
      if (!services.length) return
      const outRoot = join(nuxt.options.buildDir, 'sap-odata', 'generated')
      for (const svc of services) {
        const edmxAbs = resolve(nuxt.options.rootDir, svc.edmx)
        const outDir = join(outRoot, svc.name)
        console.log('[nuxt-sap-odata] generating', svc.name, 'from', edmxAbs)
        await generateODataClient({
          input: edmxAbs,
          outputDir: outDir,
        })
      }
    })

    if (mode !== 'sdk') {
      console.warn('[nuxt-sap-odata] Only "sdk" mode is implemented right now.')
    }
  },
})
