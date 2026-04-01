import type { ODataProxyConfig } from '@bc8-odx/core'
import type { ModuleOptions, ODataServiceConfig } from './module'
import process from 'node:process'
import { useLogger } from '@nuxt/kit'

const RE_UNDERSCORE = /_/g
const ENV_PREFIX = 'NUXT_ODATA_SERVICES_'

/**
 * Resolves and merges module options with environment variables.
 */
export function resolveModuleConfig(options: ModuleOptions, nuxtOptions: any): ODataProxyConfig {
  const logger = useLogger('@bc8-odx/nuxt')

  const parseEnvJson = (envValue: string | undefined): Record<string, string> => {
    if (!envValue)
      return {}
    try {
      return JSON.parse(envValue)
    }
    catch {
      logger.warn(`[@bc8-odx/nuxt] Failed to parse JSON from environment variable: ${envValue}`)
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

  // 1. Resolve Services (explicitly configured + discovered from env)
  const services: ODataServiceConfig[] = (options.services || []).map((s) => {
    const envKey = s.name.toUpperCase()
    const envHeadersJson = parseEnvJson(process.env[`${ENV_PREFIX}${envKey}_HEADERS`])
    const envHeadersIndividual: Record<string, string> = {}

    for (const key in process.env) {
      if (key.startsWith(`${ENV_PREFIX}${envKey}_HEADERS_`)) {
        const headerName = key.slice(`${ENV_PREFIX}${envKey}_HEADERS_`.length).replace(RE_UNDERSCORE, '-')
        envHeadersIndividual[headerName] = process.env[key]!
      }
    }

    return {
      ...s,
      url: process.env[`${ENV_PREFIX}${envKey}_URL`] || s.url,
      name: process.env[`${ENV_PREFIX}${envKey}_NAME`] || s.name,
      destination: process.env[`${ENV_PREFIX}${envKey}_DESTINATION`] || s.destination,
      icon: process.env[`${ENV_PREFIX}${envKey}_ICON`] || s.icon,
      strategy: (process.env[`${ENV_PREFIX}${envKey}_STRATEGY`] as any) || s.strategy || 'proxied',
      proxyMode: (process.env[`${ENV_PREFIX}${envKey}_PROXY_MODE`] as any) || s.proxyMode,
      auth: {
        username: process.env[`${ENV_PREFIX}${envKey}_AUTH_USERNAME`] || s.auth?.username,
        password: process.env[`${ENV_PREFIX}${envKey}_AUTH_PASSWORD`] || s.auth?.password,
        bearerToken: process.env[`${ENV_PREFIX}${envKey}_AUTH_BEARER_TOKEN`] || s.auth?.bearerToken,
      },
      headers: stringifyHeaders({
        ...s.headers,
        ...envHeadersJson,
        ...envHeadersIndividual,
      }),
    }
  })

  // 2. Discover additional services from env
  const envServiceKeys = new Set<string>()
  for (const key in process.env) {
    if (key.startsWith(ENV_PREFIX)) {
      const parts = key.slice(ENV_PREFIX.length).split('_')
      if (parts.length > 0)
        envServiceKeys.add(parts[0]!)
    }
  }

  for (const key of envServiceKeys) {
    if (services.some(s => s.name.toUpperCase() === key))
      continue

    const url = process.env[`${ENV_PREFIX}${key}_URL`]
    if (url) {
      services.push({
        name: process.env[`${ENV_PREFIX}${key}_NAME`] || key,
        url,
        strategy: (process.env[`${ENV_PREFIX}${key}_STRATEGY`] as any) || 'proxied',
        destination: process.env[`${ENV_PREFIX}${key}_DESTINATION`],
        auth: {
          username: process.env[`${ENV_PREFIX}${key}_AUTH_USERNAME`],
          password: process.env[`${ENV_PREFIX}${key}_AUTH_PASSWORD`],
          bearerToken: process.env[`${ENV_PREFIX}${key}_AUTH_BEARER_TOKEN`],
        },
        headers: stringifyHeaders(parseEnvJson(process.env[`${ENV_PREFIX}${key}_HEADERS`])),
      })
    }
  }

  // 3. Global Config
  const globalAuth = {
    username: process.env.NUXT_ODATA_AUTH_USERNAME || options.auth?.username,
    password: process.env.NUXT_ODATA_AUTH_PASSWORD || options.auth?.password,
    bearerToken: process.env.NUXT_ODATA_AUTH_BEARER_TOKEN || options.auth?.bearerToken,
    mockUserCompanies: process.env.NUXT_ODATA_AUTH_MOCK_COMPANIES ? JSON.parse(process.env.NUXT_ODATA_AUTH_MOCK_COMPANIES) : options.auth?.mockUserCompanies,
  }

  const globalHeaders = stringifyHeaders({
    ...options.headers,
    ...parseEnvJson(process.env.NUXT_ODATA_HEADERS),
  })

  return {
    basePath: options.basePath ?? '/api/odx',
    mode: options.mode ?? 'sdk',
    defaultProxyMode: options.defaultProxyMode ?? 'stream',
    destination: options.destination ?? '',
    auth: globalAuth,
    headers: globalHeaders,
    forwardAuthHeader: options.forwardAuthHeader !== false,
    rejectUnauthorized: options.rejectUnauthorized !== false && process.env.NUXT_ODATA_REJECT_UNAUTHORIZED !== 'false',
    services,
    buildDir: nuxtOptions.buildDir,
    rootDir: nuxtOptions.rootDir,
    devtools: {
      enabled: options.devtools?.enabled !== false,
      maxLogs: options.devtools?.maxLogs ?? 100,
    },
  }
}
