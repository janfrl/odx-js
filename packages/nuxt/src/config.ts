import type { ModuleOptions, ODataProxyConfig, ODataServiceConfig } from '@bc8-odx/core'
import process from 'node:process'
import { useLogger } from '@nuxt/kit'

const RE_UNDERSCORE = /_/g
const ENV_PREFIX = 'NUXT_ODATA_SERVICES_'

/**
 * Extracts OData configuration from SAP BTP User-Provided Services.
 */
function getBtpServiceConfig(serviceName?: string): Record<string, any> {
  if (!process.env.VCAP_SERVICES)
    return {}

  try {
    const vcap = JSON.parse(process.env.VCAP_SERVICES)
    const name = serviceName || 'odx-config'
    const service = vcap['user-provided']?.find((s: any) => s.name === name)
    return service?.credentials?.services || {}
  }
  catch {
    return {}
  }
}

/**
 * Resolves and merges module options with environment variables.
 */
export function resolveModuleConfig(options: ModuleOptions, nuxtOptions: any): ODataProxyConfig {
  const logger = useLogger('@bc8-odx/nuxt')

  const btpOverrides = getBtpServiceConfig(options.btpConfigService)

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

  // 1. Resolve Services (explicitly configured + discovered from env + BTP Overrides)
  const services: ODataServiceConfig[] = (options.services || []).map((s: ODataServiceConfig) => {
    const btpOverride = btpOverrides[s.name] || {}
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
      ...btpOverride,
      url: process.env[`${ENV_PREFIX}${envKey}_URL`] || btpOverride.url || s.url,
      name: process.env[`${ENV_PREFIX}${envKey}_NAME`] || btpOverride.name || s.name,
      destination: process.env[`${ENV_PREFIX}${envKey}_DESTINATION`] || btpOverride.destination || s.destination,
      icon: process.env[`${ENV_PREFIX}${envKey}_ICON`] || btpOverride.icon || s.icon,
      strategy: (process.env[`${ENV_PREFIX}${envKey}_STRATEGY`] as any) || btpOverride.strategy || s.strategy || 'proxied',
      proxyMode: (process.env[`${ENV_PREFIX}${envKey}_PROXY_MODE`] as any) || btpOverride.proxyMode || s.proxyMode,
      auth: {
        username: process.env[`${ENV_PREFIX}${envKey}_AUTH_USERNAME`] || btpOverride.auth?.username || s.auth?.username,
        password: process.env[`${ENV_PREFIX}${envKey}_AUTH_PASSWORD`] || btpOverride.auth?.password || s.auth?.password,
        bearerToken: process.env[`${ENV_PREFIX}${envKey}_AUTH_BEARER_TOKEN`] || btpOverride.auth?.bearerToken || s.auth?.bearerToken,
      },
      headers: stringifyHeaders({
        ...s.headers,
        ...btpOverride.headers,
        ...envHeadersJson,
        ...envHeadersIndividual,
      }),
      rules: btpOverride.rules || s.rules,
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
