import type { ODataProxyConfig } from '@me-tools/odx-core'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPublicODataConfig, resolveModuleConfig } from '../src/config'

describe('private service authentication normalization', () => {
  beforeEach(() => {
    vi.stubEnv('VCAP_SERVICES', '')
    for (const suffix of ['URL', 'AUTH_USERNAME', 'AUTH_PASSWORD', 'AUTH_BEARER_TOKEN'])
      vi.stubEnv(`NUXT_ODATA_SERVICES_AUTHCATALOG_${suffix}`, undefined)
    for (const suffix of ['USERNAME', 'PASSWORD', 'BEARER_TOKEN'])
      vi.stubEnv(`NUXT_ODATA_AUTH_${suffix}`, undefined)
  })

  afterEach(() => vi.unstubAllEnvs())

  it('preserves absent service auth so metadata can use global credentials', () => {
    const config = resolveModuleConfig({
      auth: { bearerToken: 'global-fixture-token' },
      services: [{ name: 'AuthCatalog', url: 'https://example.test/odata' }],
    }, { rootDir: '.', buildDir: '.nuxt' })

    expect(config.services[0]?.auth).toBeUndefined()
    expect(config.auth?.bearerToken).toBe('global-fixture-token')
    expect(createPublicODataConfig(config)).not.toHaveProperty('auth')
    expect(createPublicODataConfig(config).services?.[0]).not.toHaveProperty('auth')
  })

  it('preserves absent auth on environment-discovered services', () => {
    vi.stubEnv('NUXT_ODATA_SERVICES_AUTHCATALOG_URL', 'https://example.test/odata')
    const config = resolveModuleConfig({}, { rootDir: '.', buildDir: '.nuxt' })
    expect(config.services.find(service => service.name === 'AUTHCATALOG')?.auth).toBeUndefined()
  })

  it('retains global environment auth without creating a service profile', () => {
    vi.stubEnv('NUXT_ODATA_AUTH_USERNAME', 'global-environment-user')
    vi.stubEnv('NUXT_ODATA_AUTH_PASSWORD', 'global-environment-password')
    const config = resolveModuleConfig({
      services: [{ name: 'AuthCatalog', url: 'https://example.test/odata' }],
    }, { rootDir: '.', buildDir: '.nuxt' })
    expect(config.services[0]?.auth).toBeUndefined()
    expect(config.auth).toMatchObject({ username: 'global-environment-user', password: 'global-environment-password' })
  })

  it.each([false, true])('ignores empty service environment credentials (discovered: %s)', (discovered) => {
    vi.stubEnv('NUXT_ODATA_SERVICES_AUTHCATALOG_URL', 'https://example.test/odata')
    for (const suffix of ['USERNAME', 'PASSWORD', 'BEARER_TOKEN'])
      vi.stubEnv(`NUXT_ODATA_SERVICES_AUTHCATALOG_AUTH_${suffix}`, '')
    const config = resolveModuleConfig({
      services: discovered ? [] : [{ name: 'AuthCatalog' }],
    }, { rootDir: '.', buildDir: '.nuxt' })
    expect(config.services[0]?.auth).toBeUndefined()
  })

  it.each([
    {},
    { username: 'service-user' },
    { username: 'service-user', password: 'service-password' },
    { bearerToken: 'service-token' },
  ])('retains an explicitly selected service auth profile: %j', (auth) => {
    const config = resolveModuleConfig({
      auth: { bearerToken: 'global-token', password: 'global-password' },
      services: [{ name: 'AuthCatalog', url: 'https://example.test/odata', auth }],
    }, { rootDir: '.', buildDir: '.nuxt' })

    expect(config.services[0]?.auth).toEqual({ username: undefined, password: undefined, bearerToken: undefined, ...auth })
  })

  it.each([false, true])('retains service environment credentials (discovered: %s)', (discovered) => {
    vi.stubEnv('NUXT_ODATA_SERVICES_AUTHCATALOG_URL', 'https://example.test/odata')
    vi.stubEnv('NUXT_ODATA_SERVICES_AUTHCATALOG_AUTH_BEARER_TOKEN', 'environment-token')
    const config = resolveModuleConfig({
      services: discovered ? [] : [{ name: 'AuthCatalog' }],
    }, { rootDir: '.', buildDir: '.nuxt' })
    expect(config.services[0]?.auth).toEqual({ username: undefined, password: undefined, bearerToken: 'environment-token' })
  })

  it.each([{}, { bearerToken: 'binding-token' }])('retains an explicit local binding override: %j', (auth) => {
    vi.stubEnv('VCAP_SERVICES', JSON.stringify({
      'user-provided': [{ name: 'odx-config', credentials: { services: { AuthCatalog: { auth } } } }],
    }))
    const config = resolveModuleConfig({
      services: [{ name: 'AuthCatalog', url: 'https://example.test/odata' }],
    }, { rootDir: '.', buildDir: '.nuxt' })
    expect(config.services[0]?.auth).toEqual({ username: undefined, password: undefined, bearerToken: undefined, ...auth })
  })
})

describe('public OData runtime configuration', () => {
  it('keeps proxied backend URLs private while preserving direct service URLs', () => {
    const config: ODataProxyConfig = {
      basePath: '/api/odx',
      buildDir: '.nuxt',
      mode: 'sdk',
      rootDir: '.',
      services: [
        {
          name: 'PrivateSap',
          route: 'sap',
          strategy: 'proxied',
          url: 'https://internal.example.test/sap',
        },
        {
          name: 'PublicNorthwind',
          strategy: 'direct',
          url: 'https://services.example.test/odata',
        },
      ],
    }

    expect(createPublicODataConfig(config)).toEqual({
      basePath: '/api/odx',
      mode: 'sdk',
      services: [
        {
          name: 'PrivateSap',
          route: 'sap',
          strategy: 'proxied',
        },
        {
          name: 'PublicNorthwind',
          strategy: 'direct',
          url: 'https://services.example.test/odata',
        },
      ],
    })
  })

  it('keeps operational telemetry opt-in', () => {
    const nuxtOptions = {
      buildDir: '.nuxt',
      rootDir: '.',
    }

    expect(resolveModuleConfig({}, nuxtOptions).telemetry).toEqual({ enabled: false })
    expect(resolveModuleConfig({ telemetry: { enabled: true } }, nuxtOptions).telemetry).toEqual({
      enabled: true,
    })
  })

  it('keeps the Node-only SAP XSUAA adapter opt-in', () => {
    const nuxtOptions = {
      buildDir: '.nuxt',
      rootDir: '.',
    }

    expect(resolveModuleConfig({}, nuxtOptions).security).toEqual({ sapXsuaa: false })
    expect(resolveModuleConfig({ security: { sapXsuaa: true } }, nuxtOptions).security).toEqual({
      sapXsuaa: true,
    })
  })

  it('retains destination-only services without inventing a backend URL', () => {
    const config = resolveModuleConfig({
      services: [{
        name: 'BusinessPartner',
        destination: 'S4_BUSINESS_PARTNER',
      }],
    }, {
      buildDir: '.nuxt',
      rootDir: '.',
    })

    expect(config.services[0]).toMatchObject({
      name: 'BusinessPartner',
      destination: 'S4_BUSINESS_PARTNER',
      strategy: 'proxied',
    })
    expect(config.services[0]?.url).toBeUndefined()
    expect(createPublicODataConfig(config).services?.[0]).not.toHaveProperty('url')
  })

  it('resolves private per-service SAP CSRF policy without exposing it publicly', () => {
    const nuxtOptions = {
      buildDir: '.nuxt',
      rootDir: '.',
    }
    const previousMode = process.env.NUXT_ODATA_SERVICES_PRIVATE_CSRF_MODE
    const previousMethod = process.env.NUXT_ODATA_SERVICES_PRIVATE_CSRF_FETCH_METHOD
    process.env.NUXT_ODATA_SERVICES_PRIVATE_CSRF_MODE = 'sap'
    process.env.NUXT_ODATA_SERVICES_PRIVATE_CSRF_FETCH_METHOD = 'GET'

    try {
      const config = resolveModuleConfig({
        services: [{
          name: 'Private',
          url: 'https://internal.example.test/sap',
          csrf: { mode: 'none', fetchMethod: 'HEAD' },
        }],
      }, nuxtOptions)

      expect(config.services[0]?.csrf).toEqual({
        mode: 'sap',
        fetchMethod: 'GET',
      })
      expect(createPublicODataConfig(config).services?.[0]).not.toHaveProperty('csrf')
    }
    finally {
      if (previousMode === undefined)
        delete process.env.NUXT_ODATA_SERVICES_PRIVATE_CSRF_MODE
      else
        process.env.NUXT_ODATA_SERVICES_PRIVATE_CSRF_MODE = previousMode
      if (previousMethod === undefined)
        delete process.env.NUXT_ODATA_SERVICES_PRIVATE_CSRF_FETCH_METHOD
      else
        process.env.NUXT_ODATA_SERVICES_PRIVATE_CSRF_FETCH_METHOD = previousMethod
    }
  })

  it('normalizes omitted CSRF policies to the private none default', () => {
    const config = resolveModuleConfig({
      services: [{
        name: 'Generic',
        url: 'https://services.example.test/odata',
      }],
    }, {
      buildDir: '.nuxt',
      rootDir: '.',
    })

    expect(config.services[0]?.csrf).toEqual({ mode: 'none' })
    expect(createPublicODataConfig(config).services?.[0]).not.toHaveProperty('csrf')
  })

  it.each([
    ['disabled', 'HEAD'],
    ['sap', 'POST'],
  ])('rejects invalid private CSRF configuration (%s, %s)', (mode, fetchMethod) => {
    expect(() => resolveModuleConfig({
      services: [{
        name: 'Private',
        url: 'https://internal.example.test/sap',
        csrf: { mode, fetchMethod } as any,
      }],
    }, {
      buildDir: '.nuxt',
      rootDir: '.',
    })).toThrow(/Invalid OData CSRF/)
  })
})
