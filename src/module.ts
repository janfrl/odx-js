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
  setup(options, nuxt) {
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
      route: `${basePath}/:service`,
      handler: resolver.resolve('./runtime/server/api/odata'),
    })

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
