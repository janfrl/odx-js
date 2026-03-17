import type { EntityMapping, ODataProxyConfig, ODataPublicConfig } from '@bc8-odx/core'
import type { NitroConfig } from 'nitropack'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import https from 'node:https'
import process from 'node:process'
import { extractEntitiesFromEdmx } from '@bc8-odx/core/server'
import {
  addImportsDir,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  useLogger,
} from '@nuxt/kit'
import { join, resolve } from 'pathe'
import { setupDevToolsUI } from './devtools'
import { generateODataTypes } from './generate'

export interface ODataServiceConfig {
  name: string
  url: string
  route?: string
  icon?: string
  strategy?: 'proxied' | 'direct'
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
  }
  headers?: Record<string, string>
}

export interface ModuleOptions {
  mode?: 'sdk'
  basePath?: string
  destination?: string
  auth?: {
    username?: string
    password?: string
    bearerToken?: string
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
    const logger = useLogger('@bc8-odx/nuxt')

    const basePath = options.basePath ?? '/api/odx'
    const forwardAuthHeader = options.forwardAuthHeader ?? true

    const rejectUnauthorized = options.rejectUnauthorized !== false && process.env.NUXT_ODATA_REJECT_UNAUTHORIZED !== 'false'

    const prefix = 'NUXT_ODATA_SERVICES_'

    const parseEnvJson = (envValue: string | undefined): Record<string, string> => {
      if (!envValue) {
        return {}
      }
      try {
        return JSON.parse(envValue)
      }
      catch {
        logger.warn(`[@bc8-odx/nuxt] Failed to parse JSON from environment variable: ${envValue}. Ensure it is a valid JSON string.`)
        return {}
      }
    }

    const stringifyHeaders = (headers: Record<string, any> = {}): Record<string, string> => {
      const result: Record<string, string> = {}
      for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined && value !== null) {
          result[key] = String(value)
        }
      }
      return result
    }

    const services = (options.services || []).map((s: ODataServiceConfig) => {
      const envKey = s.name.toUpperCase()
      const envUrl = process.env[`${prefix}${envKey}_URL`]
      const envName = process.env[`${prefix}${envKey}_NAME`]
      const envDest = process.env[`${prefix}${envKey}_DESTINATION`]
      const envIcon = process.env[`${prefix}${envKey}_ICON`]
      const envStrategy = process.env[`${prefix}${envKey}_STRATEGY`] as 'proxied' | 'direct' | undefined
      const envUser = process.env[`${prefix}${envKey}_AUTH_USERNAME`]
      const envPass = process.env[`${prefix}${envKey}_AUTH_PASSWORD`]
      const envToken = process.env[`${prefix}${envKey}_AUTH_BEARER_TOKEN`]

      const envHeadersJson = parseEnvJson(process.env[`${prefix}${envKey}_HEADERS`])
      const envHeadersIndividual: Record<string, string> = {}
      const headerPrefix = `${prefix}${envKey}_HEADERS_`
      for (const key in process.env) {
        if (key.startsWith(headerPrefix)) {
          const headerName = key.slice(headerPrefix.length).replace(/_/g, '-')
          envHeadersIndividual[headerName] = process.env[key]!
        }
      }

      return {
        ...s,
        url: envUrl || s.url,
        name: envName || s.name,
        destination: envDest || s.destination,
        icon: envIcon || s.icon,
        strategy: envStrategy || s.strategy || 'proxied',
        auth: {
          username: envUser || s.auth?.username,
          password: envPass || s.auth?.password,
          bearerToken: envToken || s.auth?.bearerToken,
        },
        headers: stringifyHeaders({
          ...s.headers,
          ...envHeadersJson,
          ...envHeadersIndividual,
        }),
      }
    })

    const envServiceKeys = new Set<string>()
    for (const key in process.env) {
      if (key.startsWith(prefix)) {
        const parts = key.slice(prefix.length).split('_')
        if (parts.length > 0) {
          envServiceKeys.add(parts[0]!)
        }
      }
    }

    for (const key of envServiceKeys) {
      const alreadyHandled = (options.services || []).some(s => s.name.toUpperCase() === key)
      if (alreadyHandled) {
        continue
      }

      const url = process.env[`${prefix}${key}_URL`]
      if (url) {
        const name = process.env[`${prefix}${key}_NAME`] || key
        const destination = process.env[`${prefix}${key}_DESTINATION`]
        const icon = process.env[`${prefix}${key}_ICON`]
        const strategy = process.env[`${prefix}${key}_STRATEGY`] as 'proxied' | 'direct' | undefined
        const username = process.env[`${prefix}${key}_AUTH_USERNAME`]
        const password = process.env[`${prefix}${key}_AUTH_PASSWORD`]
        const bearerToken = process.env[`${prefix}${key}_AUTH_BEARER_TOKEN`]

        const envHeadersJson = parseEnvJson(process.env[`${prefix}${key}_HEADERS`])
        const envHeadersIndividual: Record<string, string> = {}
        const headerPrefix = `${prefix}${key}_HEADERS_`
        for (const k in process.env) {
          if (k.startsWith(headerPrefix)) {
            const headerName = k.slice(headerPrefix.length).replace(/_/g, '-')
            envHeadersIndividual[headerName] = process.env[k]!
          }
        }

        services.push({
          name,
          url,
          icon,
          strategy: strategy || 'proxied',
          destination,
          auth: { username, password, bearerToken },
          headers: stringifyHeaders({ ...envHeadersJson, ...envHeadersIndividual }),
        })
      }
    }

    const allServices = services

    const globalAuth = {
      username: process.env.NUXT_ODATA_AUTH_USERNAME || options.auth?.username,
      password: process.env.NUXT_ODATA_AUTH_PASSWORD || options.auth?.password,
      bearerToken: process.env.NUXT_ODATA_AUTH_BEARER_TOKEN || options.auth?.bearerToken,
      mockUserCompanies: process.env.NUXT_ODATA_AUTH_MOCK_COMPANIES ? JSON.parse(process.env.NUXT_ODATA_AUTH_MOCK_COMPANIES) : options.auth?.mockUserCompanies,
    }

    const globalHeaders: Record<string, string> = { ...options.headers }
    const envGlobalHeadersJson = parseEnvJson(process.env.NUXT_ODATA_HEADERS)
    const globalHeaderPrefixIndividual = 'NUXT_ODATA_HEADERS_'

    Object.assign(globalHeaders, envGlobalHeadersJson)

    for (const key in process.env) {
      if (key.startsWith(globalHeaderPrefixIndividual)) {
        const headerName = key.slice(globalHeaderPrefixIndividual.length).replace(/_/g, '-')
        globalHeaders[headerName] = process.env[key]!
      }
    }

    const odataConfig: ODataProxyConfig = {
      basePath,
      mode: options.mode ?? 'sdk',
      destination: options.destination ?? '',
      auth: globalAuth,
      headers: stringifyHeaders(globalHeaders),
      forwardAuthHeader,
      rejectUnauthorized,
      services: allServices,
      buildDir: nuxt.options.buildDir,
      rootDir: nuxt.options.rootDir,
      devtools: {
        maxLogs: options.devtools?.maxLogs ?? 100,
      },
    }

    nuxt.options.runtimeConfig.odata = odataConfig
    nuxt.options.runtimeConfig.public.odata = {
      mode: options.mode ?? 'sdk',
      basePath,
      services: allServices.map(s => ({
        name: s.name,
        strategy: s.strategy || 'proxied',
        url: s.url,
        route: s.route,
      })),
    }

    addImportsDir(resolver.resolve('./runtime/composables'))

    addServerHandler({
      handler: resolver.resolve('./runtime/server-middleware'),
    })

    // Integrate with Nitro via the new ODX Proxy Nitro module
    nuxt.options.nitro.odata = odataConfig
    nuxt.options.nitro.modules = nuxt.options.nitro.modules || []
    nuxt.options.nitro.modules.push('@bc8-odx/proxy/nitro')

    if (options.devtools && nuxt.options.dev) {
      setupDevToolsUI(nuxt, resolver)
    }

    const httpsGet = (url: string, headers: Record<string, string>): Promise<string> => {
      return new Promise((resolve, reject) => {
        const httpsOptions = {
          headers,
          rejectUnauthorized,
        }
        https.get(url, httpsOptions, (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            return reject(new Error(`Status: ${res.statusCode}`))
          }
          let data = ''
          res.on('data', chunk => data += chunk)
          res.on('end', () => resolve(data))
        }).on('error', reject)
      })
    }

    nuxt.hook('prepare:types', async ({ references }) => {
      if (!allServices.length) {
        return
      }

      const tempDir = join(nuxt.options.buildDir, 'odx', 'temp')
      const outRoot = join(nuxt.options.buildDir, 'odx-types')

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      if (!fs.existsSync(outRoot)) {
        fs.mkdirSync(outRoot, { recursive: true })
      }

      const serviceEntities: Record<string, EntityMapping[]> = {}
      const serviceModelFiles: Record<string, string> = {}

      for (const svc of allServices) {
        if (!svc.url) {
          continue
        }

        let inputPath = svc.url

        if (svc.url.startsWith('http')) {
          const metadataUrl = svc.url.endsWith('/') ? `${svc.url}$metadata` : `${svc.url}/$metadata`
          const tempFile = join(tempDir, `${svc.name}.edmx`)

          try {
            const headers: Record<string, string> = {}
            const auth = svc.auth || globalAuth
            if (auth.bearerToken) {
              headers.Authorization = `Bearer ${auth.bearerToken}`
            }
            else if (auth.username && auth.password) {
              headers.Authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
            }

            const xml = await httpsGet(metadataUrl, headers)
            fs.writeFileSync(tempFile, xml)
            inputPath = tempFile
          }
          catch (err: any) {
            if (fs.existsSync(tempFile)) {
              logger.warn(`[@bc8-odx/nuxt] Could not download metadata for ${svc.name}, using existing local cache: ${err.message}`)
              inputPath = tempFile
            } else {
              logger.error(`[@bc8-odx/nuxt] Could not download metadata for ${svc.name} and no local cache available:`, err.message)
              continue
            }
          }
        }
        else {
          inputPath = resolve(nuxt.options.rootDir, svc.url)
        }

        serviceEntities[svc.name] = extractEntitiesFromEdmx(inputPath)

        const outDir = join(outRoot, svc.name)

        // Skip generation if already exists to avoid double-work on startup
        // The dev:prepare script will handle the initial generation
        if (!fs.existsSync(outDir) || fs.readdirSync(outDir).length === 0) {
          await generateODataTypes(inputPath, outDir, svc.name)
        }
        else {
          logger.debug(`[@bc8-odx/nuxt] Skipping generation for ${svc.name}, already exists in ${outDir}`)
        }

        if (fs.existsSync(outDir)) {
          const files = fs.readdirSync(outDir)
          const modelFile = files.find(f => f.endsWith('Model.ts'))
          if (modelFile) {
            serviceModelFiles[svc.name] = modelFile.replace('.ts', '')
          }
        }
      }

      const indexDtsPath = join(outRoot, 'index.d.ts')
      const indexDtsLines = [
        'import type { ODataServiceRegistry, ODataService } from "@bc8-odx/core"',
      ]

      for (const [svcName, modelFile] of Object.entries(serviceModelFiles)) {
        indexDtsLines.push(`import * as ${svcName}Models from "./${svcName}/${modelFile}"`)
      }

      indexDtsLines.push('\ndeclare module "@bc8-odx/core" {')
      indexDtsLines.push('  interface ODataServiceRegistry {')
      for (const [svcName, entities] of Object.entries(serviceEntities)) {
        const entityNames = entities.map(e => e.name)
        const entityUnion = entityNames.length > 0
          ? entityNames.map(e => `"${e}"`).join(' | ')
          : 'string'

        const hasModels = !!serviceModelFiles[svcName]
        const modelMapping = hasModels
          ? `{ ${entities.map(e => `"${e.name}": ${svcName}Models.${e.type}`).join(', ')} }`
          : 'Record<string, any>'

        indexDtsLines.push(`    ${svcName}: ODataService<${entityUnion}, ${modelMapping}>`)
      }
      indexDtsLines.push('  }')
      indexDtsLines.push('}')

      fs.writeFileSync(indexDtsPath, indexDtsLines.join('\n'))

      references.push({ path: indexDtsPath })
    })

    if (options.mode !== 'sdk') {
      logger.warn('[@bc8-odx/nuxt] Only "sdk" mode is implemented right now.')
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
