import {
  addImportsDir,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  useLogger,
} from '@nuxt/kit'
import { join, resolve } from 'pathe'
import { setupDevToolsUI } from './devtools'
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
  devtools?: boolean
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
    devtools: true,
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const logger = useLogger('nuxt-sap-odata')

    const mode = options.mode ?? 'sdk'
    const basePath = options.basePath ?? '/api/sap-odata'
    const forwardAuthHeader = options.forwardAuthHeader ?? true
    const services = options.services ?? []

    nuxt.options.runtimeConfig.odata = {
      destination: options.destination ?? '',
      forwardAuthHeader,
      services,
      buildDir: nuxt.options.buildDir,
      rootDir: nuxt.options.rootDir,
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

    // Register devtools API handlers
    addServerHandler({
      route: '/__sap_odata__/logs',
      handler: resolver.resolve('./runtime/server/api/logs'),
    })

    addServerHandler({
      route: '/__sap_odata__/config',
      handler: resolver.resolve('./runtime/server/api/config'),
    })

    addServerHandler({
      route: '/__sap_odata__/generate',
      handler: resolver.resolve('./runtime/server/api/generate'),
    })

    addServerHandler({
      route: '/__sap_odata__/mockdata',
      handler: resolver.resolve('./runtime/server/api/mockdata'),
    })

    addServerHandler({
      route: '/__sap_odata__/schema',
      handler: resolver.resolve('./runtime/server/api/schema'),
    })

    // Register storage for mockdata
    nuxt.hook('nitro:config', (nitroConfig) => {
      const storageConfig = {
        driver: 'fs',
        base: resolve(nuxt.options.rootDir, '.data/mockdata'),
      }

      nitroConfig.storage = nitroConfig.storage || {}
      nitroConfig.storage['odata:mockdata'] = storageConfig

      nitroConfig.devStorage = nitroConfig.devStorage || {}
      nitroConfig.devStorage['odata:mockdata'] = storageConfig
    })

    // DevTools integration
    if (options.devtools && nuxt.options.dev) {
      setupDevToolsUI(nuxt, resolver)
    }

    nuxt.hook('nitro:build:before', async () => {
      if (!services.length)
        return
      const outRoot = join(nuxt.options.buildDir, 'sap-odata', 'generated')
      for (const svc of services) {
        const edmxAbs = resolve(nuxt.options.rootDir, svc.edmx)
        const outDir = join(outRoot, svc.name)
        logger.info('[nuxt-sap-odata] generating', svc.name, 'from', edmxAbs)
        await generateODataClient({
          input: edmxAbs,
          outputDir: outDir,
        })
      }
    })

    if (mode !== 'sdk') {
      logger.warn('[nuxt-sap-odata] Only "sdk" mode is implemented right now.')
    }
  },
})
