import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import https from 'node:https'
import process from 'node:process'
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

export interface SapODataService {
  name: string
  url: string
  route?: string
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
    rejectUnauthorized: false,
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

    const rejectUnauthorized = options.rejectUnauthorized !== false && process.env.NUXT_ODATA_REJECT_UNAUTHORIZED !== 'false'

    const prefix = 'NUXT_ODATA_SERVICES_'

    const parseEnvJson = (envValue: string | undefined): Record<string, string> => {
      if (!envValue)
        return {}
      try {
        return JSON.parse(envValue)
      }
      catch {
        logger.warn(`[nuxt-sap-odata] Failed to parse JSON from environment variable: ${envValue}. Ensure it is a valid JSON string.`)
        return {}
      }
    }

    const services = (options.services || []).map((s: SapODataService) => {
      const envKey = s.name.toUpperCase()
      const envUrl = process.env[`${prefix}${envKey}_URL`]
      const envName = process.env[`${prefix}${envKey}_NAME`]
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
        auth: {
          username: envUser || s.auth?.username,
          password: envPass || s.auth?.password,
          bearerToken: envToken || s.auth?.bearerToken,
        },
        headers: {
          ...s.headers,
          ...envHeadersJson,
          ...envHeadersIndividual,
        },
      }
    })

    const envServiceKeys = new Set<string>()
    for (const key in process.env) {
      if (key.startsWith(prefix)) {
        const parts = key.slice(prefix.length).split('_')
        if (parts.length > 0)
          envServiceKeys.add(parts[0]!)
      }
    }

    for (const key of envServiceKeys) {
      const alreadyHandled = (options.services || []).some(s => s.name.toUpperCase() === key)
      if (alreadyHandled)
        continue

      const url = process.env[`${prefix}${key}_URL`]
      if (url) {
        const name = process.env[`${prefix}${key}_NAME`] || key
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
          auth: { username, password, bearerToken },
          headers: { ...envHeadersJson, ...envHeadersIndividual },
        })
      }
    }

    const allServices = services

    const globalAuth = {
      username: process.env.NUXT_ODATA_AUTH_USERNAME || options.auth?.username,
      password: process.env.NUXT_ODATA_AUTH_PASSWORD || options.auth?.password,
      bearerToken: process.env.NUXT_ODATA_AUTH_BEARER_TOKEN || options.auth?.bearerToken,
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

    nuxt.options.runtimeConfig.odata = {
      destination: options.destination ?? '',
      auth: globalAuth,
      headers: globalHeaders,
      forwardAuthHeader,
      rejectUnauthorized,
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
      handler: resolver.resolve('../../proxy/src/api/odata'),
    })

    addServerHandler({
      route: '/__sap_odata__/logs',
      handler: resolver.resolve('../../proxy/src/api/logs'),
    })

    addServerHandler({
      route: '/__sap_odata__/config',
      handler: resolver.resolve('../../proxy/src/api/config'),
    })

    addServerHandler({
      route: '/__sap_odata__/generate',
      handler: resolver.resolve('../../proxy/src/api/generate'),
    })

    addServerHandler({
      route: '/__sap_odata__/schema',
      handler: resolver.resolve('../../proxy/src/api/schema'),
    })

    if (options.devtools && nuxt.options.dev) {
      setupDevToolsUI(nuxt, resolver)
    }

    const httpsGet = (url: string, headers: Record<string, string>): Promise<string> => {
      return new Promise((resolve, reject) => {
        const options = {
          headers,
          rejectUnauthorized,
        }
        https.get(url, options, (res) => {
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
      if (!nuxt.options.dev || !allServices.length) {
        return
      }

      const tempDir = join(nuxt.options.buildDir, 'sap-odata', 'temp')
      const outRoot = join(nuxt.options.buildDir, 'odx-types')

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      if (!fs.existsSync(outRoot)) {
        fs.mkdirSync(outRoot, { recursive: true })
      }

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
          catch (err) {
            logger.error(`[nuxt-sap-odata] Could not download metadata for ${svc.name}:`, err)
            continue
          }
        }
        else {
          inputPath = resolve(nuxt.options.rootDir, svc.url)
        }

        const outDir = join(outRoot, svc.name)
        await generateODataTypes(inputPath, outDir, svc.name)
      }

      const indexDtsPath = join(outRoot, 'index.d.ts')
      const indexDtsLines = [
        'import type { ODataServiceRegistry, ODataService, ODataEntitySet } from "@bc8-odx/core"',
      ]

      for (const svc of allServices) {
        if (svc.url) {
          indexDtsLines.push(`import * as ${svc.name}Namespace from "./${svc.name}"`)
        }
      }

      indexDtsLines.push('\ndeclare module "@bc8-odx/core" {')
      indexDtsLines.push('  interface ODataServiceRegistry {')
      for (const svc of allServices) {
        if (svc.url) {
          indexDtsLines.push(`    ${svc.name}: ODataService & {`)
          indexDtsLines.push(`      entities: (name: string) => ODataEntitySet`)
          // We could try to map entity sets here if we knew them, but for now we at least register the service name
          indexDtsLines.push(`    }`)
        }
      }
      indexDtsLines.push('  }')
      indexDtsLines.push('}')

      fs.writeFileSync(indexDtsPath, indexDtsLines.join('\n'))

      references.push({ path: resolve(nuxt.options.buildDir, 'odx-types/index.d.ts') })
    })

    if (mode !== 'sdk') {
      logger.warn('[nuxt-sap-odata] Only "sdk" mode is implemented right now.')
    }
  },
})
