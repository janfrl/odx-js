import type { ODataProxyConfig } from '@me-tools/odx-core'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { createPublicODataConfig, resolveModuleConfig } from '../src/config'

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
