import type { ODataProxyConfig, ODataPublicConfig } from '@bc8-odx/core'
import type { NitroConfig } from 'nitropack'
import {
  addImportsDir,
  addServerHandler,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import { resolveModuleConfig } from './config'
import { setupDevToolsUI } from './devtools'
import { setupTypeGeneration } from './generate'

export interface ODataServiceConfig {
  name: string
  url: string
  route?: string
  icon?: string
  strategy?: 'proxied' | 'direct'
  proxyMode?: 'stream' | 'buffer'
  destination?: string
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
    mockUserCompanies?: Array<{ company: string, source: string }>
  }
  headers?: Record<string, string>
}

export interface ModuleOptions {
  mode?: 'sdk'
  basePath?: string
  defaultProxyMode?: 'stream' | 'buffer'
  destination?: string
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
    mockUserCompanies?: Array<{ company: string, source: string }>
  }
  headers?: Record<string, string>
  rejectUnauthorized?: boolean
  forwardAuthHeader?: boolean
  services?: ODataServiceConfig[]
  buildDir?: string
  rootDir?: string
  devtools?: {
    enabled?: boolean
    maxLogs?: number
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@bc8-odx/nuxt',
    configKey: 'odata',
  },
  defaults: {
    mode: 'sdk',
    basePath: '/api/odx',
    forwardAuthHeader: true,
    rejectUnauthorized: false,
    services: [],
    devtools: {
      enabled: true,
      maxLogs: 100,
    },
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // 1. Resolve and Validate Configuration
    const odataConfig = resolveModuleConfig(options, nuxt.options)

    // 2. Register Runtime & Public Config
    nuxt.options.runtimeConfig.odata = odataConfig
    nuxt.options.runtimeConfig.public.odata = {
      mode: odataConfig.mode,
      basePath: odataConfig.basePath,
      services: odataConfig.services.map(s => ({
        name: s.name,
        strategy: s.strategy || 'proxied',
        url: s.url,
        route: s.route,
      })),
    }

    // 3. Register Composables & Middleware
    addImportsDir(resolver.resolve('./runtime/composables'))
    addServerHandler({
      handler: resolver.resolve('./runtime/server-middleware'),
    })

    // 4. Integrate with Nitro
    nuxt.options.nitro.odata = odataConfig
    nuxt.options.nitro.modules = nuxt.options.nitro.modules || []
    if (!nuxt.options.nitro.modules.includes('@bc8-odx/proxy/nitro')) {
      nuxt.options.nitro.modules.push('@bc8-odx/proxy/nitro')
    }

    // 5. Setup Type Generation
    setupTypeGeneration(nuxt, odataConfig)

    // 6. Setup DevTools
    if (odataConfig.devtools?.enabled && nuxt.options.dev) {
      setupDevToolsUI(nuxt, resolver)
    }
  },
})

declare module '@nuxt/schema' {
  interface NuxtConfig {
    odata?: ModuleOptions
  }
  interface NuxtOptions {
    odata?: ModuleOptions
    nitro: NitroConfig
  }
  interface RuntimeConfig {
    odata: ODataProxyConfig
  }
  interface PublicRuntimeConfig {
    odata: ODataPublicConfig
  }
}

declare module 'h3' {
  interface H3EventContext {
    odataConfig: ODataProxyConfig
    odataAuth?: string
  }
}

declare module 'nitropack' {
  interface NitroConfig {
    odata?: ODataProxyConfig
  }
}
