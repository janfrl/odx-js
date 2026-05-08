import type { ODataProxyConfig } from '@bc8-odx/core'
import { Buffer } from 'node:buffer'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { addODataLog, clearODataLogs, getODataLogs } from '@bc8-odx/core'
import { getPort } from 'get-port-please'
import { createApp, createRouter, defineEventHandler, toNodeListener } from 'h3'
import { ofetch } from 'ofetch'
import { join } from 'pathe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import configHandler from '../src/api/config'
import generateHandler from '../src/api/generate'
import logsHandler from '../src/api/logs'
import meHandler from '../src/api/me'
import schemaHandler from '../src/api/schema'
import typesHandler from '../src/api/types'
import { getRuntimeMetadataCachePaths } from '../src/utils/metadata-refresh'

const originalNodeEnv = process.env.NODE_ENV
const tempRoots: string[] = []

const metadataXml = `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="Runtime" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="Product">
        <Key><PropertyRef Name="ID" /></Key>
        <Property Name="ID" Type="Edm.String" Nullable="false" />
      </EntityType>
      <EntityContainer Name="Container">
        <EntitySet Name="Products" EntityType="Runtime.Product" />
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`

const staleMetadataXml = metadataXml.replace('Runtime', 'RuntimeCache').replace('Products', 'CachedProducts')

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

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'odx-runtime-metadata-test-'))
  tempRoots.push(root)
  return root
}

function createRuntimeMetadataConfig(rootDir: string, url: string): ODataProxyConfig {
  return {
    basePath: '/api/odx',
    buildDir: join(rootDir, '.nuxt'),
    rootDir,
    mode: 'sdk',
    rejectUnauthorized: false,
    auth: {
      username: 'global-user',
      password: 'global-password',
    },
    headers: {
      'x-global-header': 'global',
    },
    services: [
      {
        name: 'RemoteService',
        route: 'remote',
        url,
        strategy: 'proxied',
        headers: {
          'x-service-header': 'service',
        },
        auth: {
          username: 'service-user',
          password: 'service-password',
        },
      },
    ],
  }
}

function writeRuntimeMetadataCache(config: ODataProxyConfig, serviceName: string, xml: string, options: { stale?: boolean, staleReason?: string | null, source?: 'remote' | 'cache' } = {}) {
  const timestamp = Date.now()
  const paths = getRuntimeMetadataCachePaths(config, serviceName)
  mkdirSync(join(config.rootDir, '.odx', 'cache'), { recursive: true })
  writeFileSync(paths.persistentCacheFile, xml, { encoding: 'utf-8', flag: 'w' })
  writeFileSync(paths.stateFile, `${JSON.stringify({
    service: serviceName,
    inputPath: paths.persistentCacheFile,
    stale: options.stale === true,
    staleReason: options.staleReason ?? null,
    source: options.source ?? 'remote',
    timestamp,
    refreshedAt: new Date(timestamp).toISOString(),
    hash: 'a'.repeat(64),
    bytes: Buffer.byteLength(xml),
  }, null, 2)}\n`)
  return paths
}

async function listenMetadataBackend(options: { xml?: string, status?: number } = {}) {
  const requests: Array<{ url?: string, headers: Record<string, string | string[] | undefined> }> = []
  const port = await getPort()
  const server = createServer((req, res) => {
    requests.push({ url: req.url, headers: req.headers })
    res.statusCode = options.status ?? 200
    res.setHeader('content-type', 'application/xml')
    res.end(options.xml ?? metadataXml)
  })
  await new Promise(resolve => server.listen(port, () => resolve(true)))

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => {
      server.close(() => resolve())
    }),
  }
}

async function listenExplorerApi(config: ODataProxyConfig, options: { authenticated?: boolean, generator?: any } = {}) {
  const app = createApp()
  const router = createRouter()
  const withContext = (handler: any) => defineEventHandler((event) => {
    event.context.odataConfig = config
    if (options.authenticated) {
      event.context.securityContext = securityContext
    }
    if (options.generator) {
      event.context.odataGenerator = options.generator
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
    while (tempRoots.length > 0) {
      const tempRoot = tempRoots.pop()!
      if (existsSync(tempRoot))
        rmSync(tempRoot, { recursive: true, force: true })
    }
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

  it('blocks development-only type artifact endpoints in production', async () => {
    process.env.NODE_ENV = 'production'
    const server = await listenExplorerApi(createConfig(), { authenticated: true })

    try {
      await expect(ofetch(`${server.url}/__odx__/types?service=SensitiveService`)).rejects.toMatchObject({
        status: 403,
      })
    }
    finally {
      await server.close()
    }
  })

  it('refreshes production runtime metadata without invoking SDK generation', async () => {
    process.env.NODE_ENV = 'production'
    const rootDir = createTempRoot()
    const backend = await listenMetadataBackend()
    const generator = vi.fn()
    const config = createRuntimeMetadataConfig(rootDir, `${backend.url}/odata`)
    const server = await listenExplorerApi(config, { authenticated: true, generator })

    try {
      const response: any = await ofetch(`${server.url}/__odx__/generate?service=RemoteService`)
      const tempFile = join(rootDir, '.nuxt', 'odx', 'temp', 'RemoteService.edmx')
      const persistentCacheFile = join(rootDir, '.odx', 'cache', 'RemoteService.edmx')

      expect(response).toMatchObject({
        success: true,
        operation: 'metadata-refresh',
        generated: false,
        stale: false,
        staleReason: null,
        service: 'RemoteService',
        source: 'remote',
        bytes: Buffer.byteLength(metadataXml),
      })
      expect(response.hash).toMatch(/^[a-f0-9]{64}$/)
      expect(typeof response.timestamp).toBe('number')
      expect(new Date(response.refreshedAt).toString()).not.toBe('Invalid Date')
      expect(generator).not.toHaveBeenCalled()
      expect(existsSync(tempFile)).toBe(true)
      expect(existsSync(persistentCacheFile)).toBe(true)
      expect(readFileSync(tempFile, 'utf-8')).toBe(metadataXml)
      expect(readFileSync(persistentCacheFile, 'utf-8')).toBe(metadataXml)
      expect(existsSync(join(rootDir, '.nuxt', 'odx', 'generated'))).toBe(false)
      expect(backend.requests[0]?.url).toBe('/odata/$metadata')
      expect(backend.requests[0]?.headers['x-service-header']).toBe('service')
      expect(backend.requests[0]?.headers['x-global-header']).toBe('global')
      expect(backend.requests[0]?.headers.authorization).toBe(`Basic ${Buffer.from('service-user:service-password').toString('base64')}`)
    }
    finally {
      await server.close()
      await backend.close()
    }
  })

  it('does not send configured Authorization when refreshing direct production metadata', async () => {
    process.env.NODE_ENV = 'production'
    const rootDir = createTempRoot()
    const backend = await listenMetadataBackend()
    const config = createRuntimeMetadataConfig(rootDir, `${backend.url}/odata`)
    config.auth = {
      username: 'configured-global-user',
      password: 'configured-global-password',
      bearerToken: 'configured-global-token',
    }
    config.services![0] = {
      ...config.services![0],
      strategy: 'direct',
      auth: {
        username: 'configured-service-user',
        password: 'configured-service-password',
        bearerToken: 'configured-service-token',
      },
    }
    const server = await listenExplorerApi(config, { authenticated: true })

    try {
      const response: any = await ofetch(`${server.url}/__odx__/generate?service=RemoteService`)

      expect(response).toMatchObject({
        success: true,
        operation: 'metadata-refresh',
        generated: false,
        stale: false,
        service: 'RemoteService',
        source: 'remote',
      })
      expect(backend.requests[0]?.url).toBe('/odata/$metadata')
      expect(backend.requests[0]?.headers.authorization).toBeUndefined()
    }
    finally {
      await server.close()
      await backend.close()
    }
  })

  it('preserves stale-cache fallback when production metadata refresh fails', async () => {
    process.env.NODE_ENV = 'production'
    const rootDir = createTempRoot()
    const backend = await listenMetadataBackend({ status: 503, xml: 'unavailable' })
    const config = createRuntimeMetadataConfig(rootDir, `${backend.url}/odata`)
    const persistentCacheFile = join(rootDir, '.odx', 'cache', 'RemoteService.edmx')
    mkdirSync(join(rootDir, '.odx', 'cache'), { recursive: true })
    writeFileSync(persistentCacheFile, staleMetadataXml, { encoding: 'utf-8', flag: 'w' })
    const server = await listenExplorerApi(config, { authenticated: true })

    try {
      const response: any = await ofetch(`${server.url}/__odx__/generate?service=RemoteService`)
      const tempFile = join(rootDir, '.nuxt', 'odx', 'temp', 'RemoteService.edmx')

      expect(response).toMatchObject({
        success: true,
        operation: 'metadata-refresh',
        generated: false,
        stale: true,
        source: 'cache',
        service: 'RemoteService',
        bytes: Buffer.byteLength(staleMetadataXml),
      })
      expect(response.staleReason).toContain('Status: 503')
      expect(response.hash).toMatch(/^[a-f0-9]{64}$/)
      expect(readFileSync(tempFile, 'utf-8')).toBe(staleMetadataXml)
    }
    finally {
      await server.close()
      await backend.close()
    }
  })

  it('does not expose internal metadata URLs after stale fallback from invalid metadata', async () => {
    process.env.NODE_ENV = 'production'
    const rootDir = createTempRoot()
    const backend = await listenMetadataBackend({ xml: 'not-edmx' })
    const internalMetadataUrl = 'https://internal.sap.example.local/sap/opu/odata/sap/SENSITIVE'
    const config = createRuntimeMetadataConfig(rootDir, `${backend.url}/odata?upstream=${encodeURIComponent(internalMetadataUrl)}`)
    const persistentCacheFile = join(rootDir, '.odx', 'cache', 'RemoteService.edmx')
    mkdirSync(join(rootDir, '.odx', 'cache'), { recursive: true })
    writeFileSync(persistentCacheFile, staleMetadataXml, { encoding: 'utf-8', flag: 'w' })
    const server = await listenExplorerApi(config, { authenticated: true })

    try {
      const refresh: any = await ofetch(`${server.url}/__odx__/generate?service=RemoteService`)
      const schema: any = await ofetch(`${server.url}/__odx__/schema?service=RemoteService`)
      const explorerConfig: any = await ofetch(`${server.url}/__odx__/config`)
      const serializedRuntimeResponses = JSON.stringify({ refresh, schema, explorerConfig })

      expect(refresh).toMatchObject({
        success: true,
        operation: 'metadata-refresh',
        stale: true,
        staleReason: 'Received invalid or empty metadata',
        source: 'cache',
      })
      expect(schema).toMatchObject({
        metadata: {
          status: 'stale',
          stale: true,
          staleReason: 'Received invalid or empty metadata',
        },
      })
      expect(explorerConfig.services[0]).toMatchObject({
        metadata: {
          status: 'stale',
          stale: true,
          staleReason: 'Received invalid or empty metadata',
        },
      })
      expect(serializedRuntimeResponses).not.toContain(internalMetadataUrl)
      expect(serializedRuntimeResponses).not.toContain('internal.sap.example.local')
    }
    finally {
      await server.close()
      await backend.close()
    }
  })

  it('reads production schema from the runtime metadata cache without .nuxt temp files', async () => {
    process.env.NODE_ENV = 'production'
    const rootDir = createTempRoot()
    const config = createRuntimeMetadataConfig(rootDir, 'https://backend.example.test/odata')
    const paths = writeRuntimeMetadataCache(config, 'RemoteService', metadataXml)
    const server = await listenExplorerApi(config, { authenticated: true })

    try {
      const response: any = await ofetch(`${server.url}/__odx__/schema?service=RemoteService`)

      expect(response).toMatchObject({
        name: 'RemoteService',
        version: 'v4',
        namespace: 'Runtime',
        entities: [{ name: 'Products', type: 'Product' }],
        metadata: {
          status: 'available',
          source: 'remote',
          stale: false,
          staleReason: null,
          hash: 'a'.repeat(64),
          bytes: Buffer.byteLength(metadataXml),
        },
      })
      expect(existsSync(paths.tempFile)).toBe(false)
    }
    finally {
      await server.close()
    }
  })

  it('reports stale runtime metadata in production schema and config responses', async () => {
    process.env.NODE_ENV = 'production'
    const rootDir = createTempRoot()
    const config = createRuntimeMetadataConfig(rootDir, 'https://backend.example.test/odata')
    writeRuntimeMetadataCache(config, 'RemoteService', staleMetadataXml, {
      stale: true,
      staleReason: 'Status: 503',
      source: 'cache',
    })
    const server = await listenExplorerApi(config, { authenticated: true })

    try {
      const schema: any = await ofetch(`${server.url}/__odx__/schema?service=RemoteService`)
      const explorerConfig: any = await ofetch(`${server.url}/__odx__/config`)

      expect(schema).toMatchObject({
        namespace: 'RuntimeCache',
        entities: [{ name: 'CachedProducts' }],
        metadata: {
          status: 'stale',
          source: 'cache',
          stale: true,
          staleReason: 'Status: 503',
        },
      })
      expect(explorerConfig.services[0]).toMatchObject({
        name: 'RemoteService',
        entities: [{ name: 'CachedProducts' }],
        isGenerated: false,
        version: 'v4',
        metadata: {
          status: 'stale',
          source: 'cache',
          stale: true,
          staleReason: 'Status: 503',
        },
      })
      expect(JSON.stringify(explorerConfig)).not.toContain('backend.example.test')
    }
    finally {
      await server.close()
    }
  })

  it('reports missing runtime metadata without creating production cache files', async () => {
    process.env.NODE_ENV = 'production'
    const rootDir = createTempRoot()
    const config = createRuntimeMetadataConfig(rootDir, 'https://backend.example.test/odata')
    const paths = getRuntimeMetadataCachePaths(config, 'RemoteService')
    const server = await listenExplorerApi(config, { authenticated: true })

    try {
      const explorerConfig: any = await ofetch(`${server.url}/__odx__/config`)

      expect(explorerConfig.services[0]).toMatchObject({
        name: 'RemoteService',
        entities: [],
        version: null,
        metadata: {
          status: 'missing',
          source: null,
          stale: false,
        },
      })
      expect(explorerConfig.services[0].metadata.message).toContain('Refresh metadata first')
      await expect(ofetch(`${server.url}/__odx__/schema?service=RemoteService`)).rejects.toMatchObject({
        status: 404,
        data: {
          data: {
            service: 'RemoteService',
            metadata: {
              status: 'missing',
            },
          },
        },
      })
      expect(existsSync(paths.tempFile)).toBe(false)
      expect(existsSync(paths.persistentCacheFile)).toBe(false)
    }
    finally {
      await server.close()
    }
  })

  it('keeps local EDMX file schema support for development fixtures', async () => {
    process.env.NODE_ENV = 'development'
    const rootDir = createTempRoot()
    mkdirSync(join(rootDir, 'fixtures'), { recursive: true })
    writeFileSync(join(rootDir, 'fixtures', 'local.edmx'), metadataXml)
    const config = createRuntimeMetadataConfig(rootDir, 'fixtures/local.edmx')
    config.services[0] = {
      name: 'LocalService',
      route: 'local',
      url: 'fixtures/local.edmx',
      strategy: 'proxied',
    }
    const server = await listenExplorerApi(config)

    try {
      const schema: any = await ofetch(`${server.url}/__odx__/schema?service=LocalService`)
      const raw: string = await ofetch(`${server.url}/__odx__/schema?service=LocalService&raw=true`)

      expect(schema).toMatchObject({
        name: 'LocalService',
        entities: [{ name: 'Products', type: 'Product' }],
        metadata: {
          status: 'available',
          source: 'local',
          stale: false,
        },
      })
      expect(raw).toBe(metadataXml)
    }
    finally {
      await server.close()
    }
  })

  it('keeps development SDK regeneration working when a Nuxt generator is present', async () => {
    process.env.NODE_ENV = 'development'
    const rootDir = createTempRoot()
    const backend = await listenMetadataBackend()
    const generator = vi.fn()
    const config = createRuntimeMetadataConfig(rootDir, `${backend.url}/odata`)
    const server = await listenExplorerApi(config, { generator })

    try {
      const response: any = await ofetch(`${server.url}/__odx__/generate?service=RemoteService`)
      const tempFile = join(rootDir, '.nuxt', 'odx', 'temp', 'RemoteService.edmx')
      const outDir = join(rootDir, '.nuxt', 'odx', 'generated', 'RemoteService')

      expect(response).toMatchObject({
        success: true,
        operation: 'sdk-generation',
        generated: true,
        stale: false,
        service: 'RemoteService',
        source: 'remote',
      })
      expect(generator).toHaveBeenCalledWith(tempFile, outDir, 'RemoteService')
    }
    finally {
      await server.close()
      await backend.close()
    }
  })

  it('reports unsupported SDK generation when a non-production host has no generator', async () => {
    process.env.NODE_ENV = 'development'
    const rootDir = createTempRoot()
    const backend = await listenMetadataBackend()
    const config = createRuntimeMetadataConfig(rootDir, `${backend.url}/odata`)
    const server = await listenExplorerApi(config)

    try {
      await expect(ofetch(`${server.url}/__odx__/generate?service=RemoteService`)).rejects.toMatchObject({
        status: 501,
      })
      expect(existsSync(join(rootDir, '.nuxt', 'odx', 'generated'))).toBe(false)
    }
    finally {
      await server.close()
      await backend.close()
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
            metadata: {
              status: 'missing',
              source: null,
              stale: false,
            },
            version: null,
          },
        ],
      })
      expect(Object.keys(response).sort()).toEqual(['basePath', 'mode', 'services'])
      expect(Object.keys(service).sort()).toEqual([
        'entities',
        'icon',
        'isGenerated',
        'metadata',
        'name',
        'proxyMode',
        'route',
        'strategy',
        'version',
      ])
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
    await clearODataLogs()
    await addODataLog({
      id: 'production-hidden',
      timestamp: Date.now(),
      method: 'POST',
      url: '/api/odx/SensitiveService/Products',
      service: 'SensitiveService',
      requestBody: { secret: 'payload' },
      responseBody: { secret: 'payload' },
    })
    const server = await listenExplorerApi(createConfig(), { authenticated: true })

    try {
      await expect(ofetch(`${server.url}/__odx__/logs`)).resolves.toEqual([])
      await expect(ofetch(`${server.url}/__odx__/logs`, { method: 'DELETE' })).rejects.toMatchObject({
        status: 403,
      })
      expect(await getODataLogs()).toHaveLength(1)
    }
    finally {
      await clearODataLogs()
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
