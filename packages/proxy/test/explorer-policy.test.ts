import type { ODataProxyConfig } from '@bc8-odx/core'
import { createServer } from 'node:http'
import { getPort } from 'get-port-please'
import { createApp, createRouter, defineEventHandler, toNodeListener } from 'h3'
import { ofetch } from 'ofetch'
import { afterEach, describe, expect, it } from 'vitest'
import configHandler from '../src/api/config'
import generateHandler from '../src/api/generate'
import logsHandler from '../src/api/logs'
import meHandler from '../src/api/me'
import schemaHandler from '../src/api/schema'
import typesHandler from '../src/api/types'

const originalNodeEnv = process.env.NODE_ENV

const securityContext = {
  getAttribute: (name: string) => {
    if (name === 'employee_id')
      return ['JDOE']
    if (name === 'company_id')
      return ['BECHTLE']
    if (name === 'auth')
      return ['[{"id":"1000","name":"Bechtle AG"}]']
    return []
  },
  getEmail: () => 'john.doe@example.test',
  getLogonName: () => 'JDOE',
  getTokenInfo: () => ({ access_token: 'raw-token-payload' }),
}

function createConfig(): ODataProxyConfig {
  return {
    basePath: '/api/odx',
    buildDir: '',
    rootDir: '',
    mode: 'sdk',
    forwardAuthHeader: true,
    auth: {
      username: 'global-user',
      password: 'global-password',
      bearerToken: 'global-token',
    },
    headers: {
      'x-global-api-key': 'global-secret',
    },
    services: [
      {
        name: 'SensitiveService',
        url: 'https://internal.example.test/sap/opu/odata/sap/SENSITIVE',
        route: 'sensitive',
        icon: 'i-lucide-lock',
        strategy: 'proxied',
        proxyMode: 'buffer',
        destination: 'SensitiveDestination',
        auth: {
          username: 'service-user',
          password: 'service-password',
          bearerToken: 'service-token',
          mockUserCompanies: [{ company: '1000', source: 'secret-fixture' }],
        },
        headers: {
          'authorization': 'Bearer service-header-token',
          'x-api-key': 'service-header-secret',
          'cookie': 'sap-session=secret',
        },
        internalOnly: 'unknown-secret-field',
        rules: [
          { type: 'injectHeader', value: { name: 'x-injected-secret', value: 'rule-secret' } },
          { type: 'requireScope', value: 'Admin' },
        ],
      } as any,
    ],
    devtools: {
      enabled: true,
      maxLogs: 10,
    },
  }
}

async function listenExplorerApi(config: ODataProxyConfig, options: { authenticated?: boolean } = {}) {
  const app = createApp()
  const router = createRouter()
  const withContext = (handler: any) => defineEventHandler((event) => {
    event.context.odataConfig = config
    if (options.authenticated) {
      event.context.securityContext = securityContext
    }
    return handler(event)
  })

  router.use('/__odx__/config', withContext(configHandler))
  router.use('/__odx__/logs', withContext(logsHandler))
  router.use('/__odx__/generate', withContext(generateHandler))
  router.use('/__odx__/me', withContext(meHandler))
  router.use('/__odx__/schema', withContext(schemaHandler))
  router.use('/__odx__/types', withContext(typesHandler))
  app.use(router)

  const port = await getPort()
  const server = createServer(toNodeListener(app))
  await new Promise(resolve => server.listen(port, () => resolve(true)))

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => {
      server.close(() => resolve())
    }),
  }
}

describe('production Explorer endpoint policy', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  it('requires an authenticated security context for production runtime endpoints', async () => {
    process.env.NODE_ENV = 'production'
    const server = await listenExplorerApi(createConfig())

    try {
      for (const endpoint of ['/__odx__/config', '/__odx__/logs']) {
        await expect(ofetch(`${server.url}${endpoint}`)).rejects.toMatchObject({
          status: 401,
        })
      }
    }
    finally {
      await server.close()
    }
  })

  it('blocks development-only generation and type artifact endpoints in production', async () => {
    process.env.NODE_ENV = 'production'
    const server = await listenExplorerApi(createConfig(), { authenticated: true })

    try {
      for (const endpoint of [
        '/__odx__/generate?service=SensitiveService',
        '/__odx__/types?service=SensitiveService',
      ]) {
        await expect(ofetch(`${server.url}${endpoint}`)).rejects.toMatchObject({
          status: 403,
        })
      }
    }
    finally {
      await server.close()
    }
  })

  it('redacts sensitive service configuration from production config responses', async () => {
    process.env.NODE_ENV = 'production'
    const server = await listenExplorerApi(createConfig(), { authenticated: true })

    try {
      const response: any = await ofetch(`${server.url}/__odx__/config`)
      const [service] = response.services
      const serialized = JSON.stringify(response)

      expect(response).toMatchObject({
        basePath: '/api/odx',
        mode: 'sdk',
        services: [
          {
            name: 'SensitiveService',
            route: 'sensitive',
            icon: 'i-lucide-lock',
            strategy: 'proxied',
            proxyMode: 'buffer',
            entities: [],
            isGenerated: false,
            version: null,
          },
        ],
      })
      expect(response.forwardAuthHeader).toBeUndefined()
      expect(response.versions).toBeUndefined()
      expect(service.url).toBeUndefined()
      expect(service.destination).toBeUndefined()
      expect(service.auth).toBeUndefined()
      expect(service.headers).toBeUndefined()
      expect(service.rules).toBeUndefined()
      expect(serialized).not.toContain('internal.example.test')
      expect(serialized).not.toContain('SensitiveDestination')
      expect(serialized).not.toContain('service-password')
      expect(serialized).not.toContain('service-token')
      expect(serialized).not.toContain('service-header-secret')
      expect(serialized).not.toContain('rule-secret')
      expect(serialized).not.toContain('global-secret')
      expect(serialized).not.toContain('unknown-secret-field')
    }
    finally {
      await server.close()
    }
  })

  it('preserves local development config ergonomics for Explorer', async () => {
    process.env.NODE_ENV = 'development'
    const server = await listenExplorerApi(createConfig())

    try {
      const response: any = await ofetch(`${server.url}/__odx__/config`)
      const [service] = response.services

      expect(response.forwardAuthHeader).toBe(true)
      expect(response.versions.node).toBe(process.version)
      expect(service.url).toBe('https://internal.example.test/sap/opu/odata/sap/SENSITIVE')
      expect(service.destination).toBe('SensitiveDestination')
      expect(service.auth.password).toBe('service-password')
      expect(service.headers['x-api-key']).toBe('service-header-secret')
      expect(service.rules[0].value.value).toBe('rule-secret')
      expect(service.internalOnly).toBe('unknown-secret-field')
    }
    finally {
      await server.close()
    }
  })

  it('returns sanitized current-user details in production', async () => {
    process.env.NODE_ENV = 'production'
    const server = await listenExplorerApi(createConfig(), { authenticated: true })

    try {
      const response: any = await ofetch(`${server.url}/__odx__/me`)

      expect(response).toEqual({
        Usermail: 'john.doe@example.test',
        Userid: 'JDOE',
        Usercompany: 'BECHTLE',
        Usercompanies: [{ id: '1000', name: 'Bechtle AG' }],
      })
      expect(JSON.stringify(response)).not.toContain('raw-token-payload')
    }
    finally {
      await server.close()
    }
  })

  it('keeps production logs disabled until persistent log policy is configured', async () => {
    process.env.NODE_ENV = 'production'
    const server = await listenExplorerApi(createConfig(), { authenticated: true })

    try {
      await expect(ofetch(`${server.url}/__odx__/logs`)).resolves.toEqual([])
      await expect(ofetch(`${server.url}/__odx__/logs`, { method: 'DELETE' })).rejects.toMatchObject({
        status: 403,
      })
    }
    finally {
      await server.close()
    }
  })

  it('blocks raw production schema XML responses', async () => {
    process.env.NODE_ENV = 'production'
    const server = await listenExplorerApi(createConfig(), { authenticated: true })

    try {
      await expect(ofetch(`${server.url}/__odx__/schema?service=SensitiveService&raw=true`)).rejects.toMatchObject({
        status: 403,
      })
    }
    finally {
      await server.close()
    }
  })
})
