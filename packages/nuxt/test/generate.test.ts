import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { EventEmitter } from 'node:events'
import fs, { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadMetadata, generateODataTypes, generateRegistryDts, setupTypeGeneration } from '../src/generate'

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
  execSync: vi.fn(),
}))
vi.mock('node:http')
vi.mock('node:https')

const testDir = dirname(fileURLToPath(import.meta.url))
const minimalMetadataPath = join(testDir, '../playground/minimal/edmx/minimal.edmx')
const tempRoots: string[] = []

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'odx-generate-test-'))
  tempRoots.push(root)
  return root
}

function createMockRequest() {
  const request = new EventEmitter() as any
  request.setTimeout = vi.fn(() => request)
  request.destroy = vi.fn((error?: Error) => {
    if (error)
      request.emit('error', error)
  })
  return request
}

function createNuxtTypeGenerationHarness(serviceName: string, metadataPath = minimalMetadataPath) {
  const rootDir = createTempRoot()
  const buildDir = join(rootDir, '.nuxt')
  let prepareTypesHook: ((payload: { references: { path: string }[] }) => Promise<void>) | undefined

  const nuxt = {
    options: {
      rootDir,
      buildDir,
    },
    hook: vi.fn((name: string, callback: typeof prepareTypesHook) => {
      if (name === 'prepare:types')
        prepareTypesHook = callback
    }),
  } as any

  setupTypeGeneration(nuxt, {
    services: [
      {
        name: serviceName,
        url: metadataPath,
      },
    ],
  } as any)

  return {
    rootDir,
    buildDir,
    async runPrepareTypes() {
      if (!prepareTypesHook)
        throw new Error('prepare:types hook was not registered')

      const references: { path: string }[] = []
      await prepareTypesHook({ references })
      return references
    },
  }
}

describe('type Generation Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    while (tempRoots.length > 0) {
      const tempRoot = tempRoots.pop()!
      if (existsSync(tempRoot))
        rmSync(tempRoot, { recursive: true, force: true })
    }
  })

  describe('generateODataTypes', () => {
    it('invokes odata2ts with discrete process arguments', async () => {
      const sourcePath = 'C:/tmp/metadata file.edmx'
      const outputDir = 'C:/tmp/generated types'

      await generateODataTypes(sourcePath, outputDir, 'SpacedService')

      expect(execFileSync).toHaveBeenCalledWith(
        process.execPath,
        [
          expect.stringContaining('run-cli.js'),
          '--source',
          sourcePath,
          '--output',
          outputDir,
          '--mode',
          'models',
          '--emit-mode',
          'ts',
          '--prettier',
        ],
        { stdio: 'pipe' },
      )
    })
  })

  describe('setupTypeGeneration', () => {
    function respondWithMetadata(xml: string) {
      vi.mocked(https.get).mockImplementation((_url, _options, callback) => {
        const response = new EventEmitter() as any
        response.statusCode = 200
        callback!(response)
        queueMicrotask(() => {
          response.emit('data', xml)
          response.emit('end')
        })
        return createMockRequest()
      })
    }

    function rejectMetadataDownload() {
      const failure = new Error('read ECONNRESET')
      vi.mocked(https.get).mockImplementation(() => {
        const request = createMockRequest()
        queueMicrotask(() => request.emit('error', failure))
        return request
      })
      return failure
    }

    it('rejects unavailable remote metadata without a cache instead of emitting an incomplete registry', async () => {
      const failure = rejectMetadataDownload()
      const harness = createNuxtTypeGenerationHarness('DraftCatalog', 'https://example.com/odata')

      await expect(harness.runPrepareTypes()).rejects.toMatchObject({
        message: 'Could not download metadata for DraftCatalog and no cached metadata is available.',
        cause: failure,
      })
      expect(execFileSync).not.toHaveBeenCalled()
      expect(existsSync(join(harness.buildDir, 'odx-types', 'index.d.ts'))).toBe(false)
    })

    it('does not create metadata caches from a malformed successful response', async () => {
      respondWithMetadata('<edmx:Edmx>')
      const harness = createNuxtTypeGenerationHarness('DraftCatalog', 'https://example.com/odata')

      await expect(harness.runPrepareTypes()).rejects.toThrow('Could not parse OData metadata')
      expect(existsSync(join(harness.buildDir, 'odx', 'temp', 'DraftCatalog.edmx'))).toBe(false)
      expect(existsSync(join(harness.rootDir, '.odx', 'cache', 'DraftCatalog.edmx'))).toBe(false)
      expect(execFileSync).not.toHaveBeenCalled()
    })

    it('does not treat a cache-write failure as a transport outage with fallback', async () => {
      const xml = readFileSync(minimalMetadataPath, 'utf8')
      respondWithMetadata(xml)
      const harness = createNuxtTypeGenerationHarness('DraftCatalog', 'https://example.com/odata')
      const persistentDir = join(harness.rootDir, '.odx', 'cache')
      mkdirSync(persistentDir, { recursive: true })
      writeFileSync(join(persistentDir, 'DraftCatalog.edmx'), xml)
      const tempFile = join(harness.buildDir, 'odx', 'temp', 'DraftCatalog.edmx')
      const failure = new Error('Cache is read-only')
      const originalWrite = fs.writeFileSync
      vi.spyOn(fs, 'writeFileSync').mockImplementation((path, data, options) => {
        if (path === tempFile)
          throw failure
        originalWrite(path, data, options)
      })

      await expect(harness.runPrepareTypes()).rejects.toBe(failure)
      expect(readFileSync(join(persistentDir, 'DraftCatalog.edmx'), 'utf8')).toBe(xml)
      expect(existsSync(join(harness.buildDir, 'odx-types', 'index.d.ts'))).toBe(false)
      expect(execFileSync).not.toHaveBeenCalled()
    })

    it.each(['temporary', 'persistent'])('preserves the validated %s cache fallback when remote metadata is unavailable', async (cacheKind) => {
      rejectMetadataDownload()
      const harness = createNuxtTypeGenerationHarness('DraftCatalog', 'https://example.com/odata')
      const cacheDir = cacheKind === 'temporary'
        ? join(harness.buildDir, 'odx', 'temp')
        : join(harness.rootDir, '.odx', 'cache')
      mkdirSync(cacheDir, { recursive: true })
      const xml = readFileSync(minimalMetadataPath, 'utf8')
      writeFileSync(join(cacheDir, 'DraftCatalog.edmx'), xml)

      await expect(harness.runPrepareTypes()).resolves.toEqual([
        { path: join(harness.buildDir, 'odx-types', 'index.d.ts') },
      ])
      expect(execFileSync).toHaveBeenCalledOnce()
      expect(readFileSync(join(harness.buildDir, 'odx', 'temp', 'DraftCatalog.edmx'), 'utf8')).toBe(xml)
      expect(readFileSync(join(harness.buildDir, 'odx-types', 'index.d.ts'), 'utf8'))
        .toContain('DraftCatalog: ODataRuntimeService<"Products"')
    })

    it('rejects a malformed fallback cache before SDK generation', async () => {
      rejectMetadataDownload()
      const harness = createNuxtTypeGenerationHarness('DraftCatalog', 'https://example.com/odata')
      const cacheDir = join(harness.rootDir, '.odx', 'cache')
      mkdirSync(cacheDir, { recursive: true })
      writeFileSync(join(cacheDir, 'DraftCatalog.edmx'), '<edmx:Edmx>')

      await expect(harness.runPrepareTypes()).rejects.toThrow('Could not parse OData metadata')
      expect(execFileSync).not.toHaveBeenCalled()
      expect(existsSync(join(harness.buildDir, 'odx-types', 'index.d.ts'))).toBe(false)
    })

    it.each(['Sales/Order', 'Sales\\Order'])(
      'rejects service name %s before generating output from the service name',
      async (serviceName) => {
        const harness = createNuxtTypeGenerationHarness(serviceName)

        await expect(harness.runPrepareTypes()).rejects.toThrow(
          `Invalid OData service name "${serviceName}": path separators are not allowed`,
        )

        expect(execFileSync).not.toHaveBeenCalled()
      },
    )

    it('rejects malformed metadata before invoking the SDK generator', async () => {
      const root = createTempRoot()
      const metadataPath = join(root, 'invalid.edmx')
      writeFileSync(metadataPath, '<edmx:Edmx>')
      const harness = createNuxtTypeGenerationHarness('InvalidMetadata', metadataPath)

      await expect(harness.runPrepareTypes()).rejects.toThrow(
        `Could not parse OData metadata at ${metadataPath}`,
      )
      expect(execFileSync).not.toHaveBeenCalled()
    })
    it('preserves safe non-identifier service names for type generation', async () => {
      const harness = createNuxtTypeGenerationHarness('Sales-Order')

      await expect(harness.runPrepareTypes()).resolves.toEqual([
        { path: join(harness.buildDir, 'odx-types', 'index.d.ts') },
      ])

      expect(execFileSync).toHaveBeenCalledWith(
        process.execPath,
        expect.arrayContaining([
          '--output',
          join(harness.buildDir, 'odx-types', 'Sales-Order'),
        ]),
        { stdio: 'pipe' },
      )
    })
  })

  describe('downloadMetadata', () => {
    it('sets Bearer token header when provided', async () => {
      const svc = { name: 'Test', url: 'https://example.com/odata' }
      const config = { auth: { bearerToken: 'test-token' }, rejectUnauthorized: false } as any

      const mockRequest = createMockRequest()
      vi.mocked(https.get).mockImplementation((url, options, callback) => {
        const res = new EventEmitter() as any
        res.statusCode = 200
        callback!(res)
        res.emit('data', '<xml>metadata</xml>')
        res.emit('end')
        return mockRequest
      })

      const result = await downloadMetadata(svc, config)

      expect(result).toBe('<xml>metadata</xml>')
      expect(https.get).toHaveBeenCalledWith(
        'https://example.com/odata/$metadata',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
          rejectUnauthorized: false,
        }),
        expect.any(Function),
      )
      expect(http.get).not.toHaveBeenCalled()
    })

    it('uses the HTTP client for http metadata URLs and preserves headers', async () => {
      const svc = { name: 'Local', url: 'http://localhost:4000/odata' }
      const config = { auth: { bearerToken: 'local-token' }, rejectUnauthorized: false } as any

      const mockRequest = createMockRequest()
      vi.mocked(http.get).mockImplementation((url, options, callback) => {
        const res = new EventEmitter() as any
        res.statusCode = 200
        callback!(res)
        res.emit('data', '<xml>local</xml>')
        res.emit('end')
        return mockRequest
      })

      const result = await downloadMetadata(svc, config)

      expect(result).toBe('<xml>local</xml>')
      expect(http.get).toHaveBeenCalledWith(
        'http://localhost:4000/odata/$metadata',
        {
          headers: { Authorization: 'Bearer local-token' },
        },
        expect.any(Function),
      )
      expect(https.get).not.toHaveBeenCalled()
    })

    it('sets Basic auth header when username/password provided', async () => {
      const svc = {
        name: 'Test',
        url: 'https://example.com/odata/',
        auth: { username: 'user', password: 'pwd' },
      }
      const config = {} as any

      const mockRequest = createMockRequest()
      vi.mocked(https.get).mockImplementation((url, options, callback) => {
        const res = new EventEmitter() as any
        res.statusCode = 200
        callback!(res)
        res.emit('data', 'data')
        res.emit('end')
        return mockRequest
      })

      await downloadMetadata(svc, config)

      const expectedBasic = `Basic ${Buffer.from('user:pwd').toString('base64')}`
      expect(https.get).toHaveBeenCalledWith(
        'https://example.com/odata/$metadata',
        expect.objectContaining({
          headers: { Authorization: expectedBasic },
        }),
        expect.any(Function),
      )
    })

    it('throws error on non-200 status code', async () => {
      const svc = { name: 'Test', url: 'https://example.com' }
      const mockRequest = createMockRequest()
      const resume = vi.fn()

      vi.mocked(https.get).mockImplementation((url, options, callback) => {
        const res = new EventEmitter() as any
        res.statusCode = 404
        res.resume = resume
        callback!(res)
        return mockRequest
      })

      await expect(downloadMetadata(svc, {} as any)).rejects.toThrow('Status: 404')
      expect(resume).toHaveBeenCalledOnce()
    })

    it('times out hanging metadata requests', async () => {
      vi.useFakeTimers()

      const svc = { name: 'Slow', url: 'https://example.com/odata' }
      const mockRequest = createMockRequest()
      mockRequest.setTimeout = vi.fn((timeout: number, callback: () => void) => {
        setTimeout(callback, timeout)
        return mockRequest
      })

      vi.mocked(https.get).mockImplementation(() => mockRequest)

      const download = expect(downloadMetadata(svc, {} as any)).rejects.toThrow('Metadata request timed out after 30000ms')
      await vi.advanceTimersByTimeAsync(30_000)

      await download
      expect(mockRequest.destroy).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  describe('generateRegistryDts', () => {
    it('generates correct d.ts structure for multiple services', () => {
      const serviceEntities = {
        Svc1: [
          { name: 'Products', type: 'Product', properties: [], navigationProperties: [] },
          { name: 'Categories', type: 'Category', properties: [], navigationProperties: [] },
        ],
        Svc2: [
          { name: 'Orders', type: 'Order', properties: [], navigationProperties: [] },
        ],
      }
      const serviceModelFiles = {
        Svc1: 'Svc1Model',
        Svc2: 'Svc2Model',
      }

      const result = generateRegistryDts(serviceEntities, serviceModelFiles)

      expect(result).toContain('import * as Svc1Models from "./Svc1/Svc1Model"')
      expect(result).toContain('import * as Svc2Models from "./Svc2/Svc2Model"')
      expect(result).toContain('Svc1: ODataRuntimeService<"Products" | "Categories", { "Products": Svc1Models.Product, "Categories": Svc1Models.Category }>')
      expect(result).toContain('Svc2: ODataRuntimeService<"Orders", { "Orders": Svc2Models.Order }>')
    })

    it('handles services without model files', () => {
      const serviceEntities = {
        SvcEmpty: [{ name: 'Items', type: 'Item', properties: [], navigationProperties: [] }],
      }
      const serviceModelFiles = {}

      const result = generateRegistryDts(serviceEntities, serviceModelFiles)

      expect(result).toContain('SvcEmpty: ODataRuntimeService<"Items", Record<string, any>>')
    })

    it('handles services without entities', () => {
      const serviceEntities = {
        SvcNoEntities: [],
      }
      const serviceModelFiles = {
        SvcNoEntities: 'Model',
      }

      const result = generateRegistryDts(serviceEntities, serviceModelFiles)

      expect(result).toContain('SvcNoEntities: ODataRuntimeService<string, {  }>')
    })

    it('generates valid declarations for non-identifier service names', () => {
      const serviceEntities = {
        'Sales-Order': [
          { name: 'Order Items', type: 'SalesOrderItem', properties: [], navigationProperties: [] },
        ],
      }
      const serviceModelFiles = {
        'Sales-Order': 'SalesOrderModel',
      }

      const result = generateRegistryDts(serviceEntities, serviceModelFiles)

      expect(result).toContain('import * as Sales_OrderModels from "./Sales-Order/SalesOrderModel"')
      expect(result).toContain('"Sales-Order": ODataRuntimeService<"Order Items", { "Order Items": Sales_OrderModels.SalesOrderItem }>')
      expect(result).not.toContain('import * as Sales-OrderModels')
      expect(result).not.toContain('Sales-Order: ODataRuntimeService')
    })
  })
})
