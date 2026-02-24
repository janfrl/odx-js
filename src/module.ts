import fs from 'node:fs'
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
  url: string
  route?: string
}

export interface ModuleOptions {
  mode?: 'sdk'
  basePath?: string
  destination?: string
  forwardAuthHeader?: boolean
  services?: SapODataService[]
  buildDir?: string
  devtools?: {
    enabled?: boolean
    maxLogs?: number
  }
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
    devtools: {
      enabled: true,
      maxLogs: 100,
    },
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const logger = useLogger('nuxt-sap-odata')

    const mode = options.mode ?? 'sdk'
    const basePath = options.basePath ?? '/api/sap-odata'
    const forwardAuthHeader = options.forwardAuthHeader ?? true

    // 1. Unified Service Discovery & Merging
    const prefix = 'NUXT_ODATA_SERVICES_'

    // Start with services from nuxt.config.ts and apply overrides from env
    const services = (options.services || []).map((s: any) => {
      const envKey = s.name.toUpperCase()
      const envUrl = process.env[`${prefix}${envKey}_URL`]
      const envName = process.env[`${prefix}${envKey}_NAME`]

      return {
        ...s,
        url: envUrl || s.url || s.edmx, // Env URL wins, then config url, then config edmx
        name: envName || s.name, // Env Name wins, then config name (preserves casing)
      }
    })

    // Find all unique service keys in process.env to discover new services
    const envServiceKeys = new Set<string>()
    for (const key in process.env) {
      if (key.startsWith(prefix)) {
        const parts = key.slice(prefix.length).split('_')
        if (parts.length > 0)
          envServiceKeys.add(parts[0]!)
      }
    }

    // Add services that ONLY exist in environment variables
    for (const key of envServiceKeys) {
      const alreadyHandled = (options.services || []).some(s => s.name.toUpperCase() === key)
      if (alreadyHandled)
        continue

      const url = process.env[`${prefix}${key}_URL`]
      if (url) {
        const name = process.env[`${prefix}${key}_NAME`] || key
        services.push({ name, url })
      }
    }

    const allServices = services

    nuxt.options.runtimeConfig.odata = {
      destination: options.destination ?? '',
      forwardAuthHeader,
      services: allServices,
      buildDir: nuxt.options.buildDir,
      rootDir: nuxt.options.rootDir,
      devtools: {
        maxLogs: options.devtools?.maxLogs ?? 100,
      },
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
      if (!allServices.length)
        return
      const outRoot = join(nuxt.options.buildDir, 'sap-odata', 'generated')
      for (const svc of allServices) {
        if (!svc.url) {
          logger.warn(`[nuxt-sap-odata] Service ${svc.name} has no URL or EDMX source defined. Skipping.`)
          continue
        }

        let inputPath = svc.url

        // If URL is remote, we need to download the metadata first
        if (svc.url.startsWith('http')) {
          const metadataUrl = svc.url.endsWith('/') ? `${svc.url}$metadata` : `${svc.url}/$metadata`
          const tempDir = join(nuxt.options.buildDir, 'sap-odata', 'temp')
          if (!fs.existsSync(tempDir))
            fs.mkdirSync(tempDir, { recursive: true })

          const tempFile = join(tempDir, `${svc.name}.edmx`)
          logger.info(`[nuxt-sap-odata] downloading metadata for ${svc.name} from ${metadataUrl}`)

          try {
            const response = await fetch(metadataUrl)
            if (!response.ok)
              throw new Error(`Failed to fetch metadata: ${response.statusText}`)
            const xml = await response.text()
            fs.writeFileSync(tempFile, xml)
            inputPath = tempFile
          }
          catch (err) {
            logger.error(`[nuxt-sap-odata] Could not download metadata for ${svc.name}:`, err)
            continue // Skip generation for this service
          }
        }
        else {
          // Local path
          inputPath = resolve(nuxt.options.rootDir, svc.url)
        }

        const outDir = join(outRoot, svc.name)
        logger.info('[nuxt-sap-odata] generating client for', svc.name)
        await generateODataClient({
          input: inputPath,
          outputDir: outDir,
        })
      }
    })

    if (mode !== 'sdk') {
      logger.warn('[nuxt-sap-odata] Only "sdk" mode is implemented right now.')
    }
  },
})
