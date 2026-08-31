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
  vi.mocked(execFileSync).mockImplementation((_command, args) => {
    if (!Array.isArray(args))
      throw new Error('Expected SDK generator arguments')
    const output = args[args.indexOf('--output') + 1]
    if (typeof output !== 'string' || !output.startsWith(join(buildDir, 'odx', 'temp')))
      throw new Error('Expected an owned SDK staging directory')
    mkdirSync(output, { recursive: true })
    writeFileSync(join(output, 'MinimalLocalModel.ts'), 'export interface Product { ID: string }')
    return ''
  })
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
    vi.mocked(execFileSync).mockReset()
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

    it('reuses unchanged verified SDK output and preserves unrelated files', async () => {
      const harness = createNuxtTypeGenerationHarness('Catalog')
      await harness.runPrepareTypes()
      const outDir = join(harness.buildDir, 'odx-types', 'Catalog')
      writeFileSync(join(outDir, 'consumer-note.txt'), 'keep this unrelated artifact')
      await harness.runPrepareTypes()

      expect(execFileSync).toHaveBeenCalledOnce()
      expect(readFileSync(join(outDir, 'consumer-note.txt'), 'utf8')).toBe('keep this unrelated artifact')
      expect(fs.readdirSync(join(harness.buildDir, 'odx', 'temp'))).toEqual([])
    })

    it.each(['missing-model', 'changed-model', 'invalid-manifest', 'old-version', 'unsafe-model-path'])(
      'regenerates an unverifiable SDK cache: %s',
      async (condition) => {
        const harness = createNuxtTypeGenerationHarness('Catalog')
        await harness.runPrepareTypes()
        const outDir = join(harness.buildDir, 'odx-types', 'Catalog')
        const modelPath = join(outDir, 'MinimalLocalModel.ts')
        const cachePath = join(outDir, '.odx-generation.json')
        const cache = JSON.parse(readFileSync(cachePath, 'utf8'))
        if (condition === 'missing-model')
          fs.unlinkSync(modelPath)
        else if (condition === 'changed-model')
          writeFileSync(modelPath, 'incomplete generation')
        else if (condition === 'invalid-manifest')
          writeFileSync(cachePath, '{')
        else
          writeFileSync(cachePath, JSON.stringify({ ...cache, ...(condition === 'old-version' ? { version: 0 } : { modelFile: '../OtherModel.ts' }) }))

        await harness.runPrepareTypes()
        expect(execFileSync).toHaveBeenCalledTimes(2)
        expect(readFileSync(modelPath, 'utf8')).toContain('export interface Product')
        expect(fs.readdirSync(join(harness.buildDir, 'odx', 'temp'))).toEqual([])
      },
    )

    it('preserves the previous SDK and registry after failed regeneration and retries changed metadata', async () => {
      const root = createTempRoot()
      const metadataPath = join(root, 'catalog.edmx')
      const xml = readFileSync(minimalMetadataPath, 'utf8')
      writeFileSync(metadataPath, xml)
      const harness = createNuxtTypeGenerationHarness('Catalog', metadataPath)
      await harness.runPrepareTypes()
      const outDir = join(harness.buildDir, 'odx-types', 'Catalog')
      const cachePath = join(outDir, '.odx-generation.json')
      const previousCache = readFileSync(cachePath, 'utf8')
      const registryPath = join(harness.buildDir, 'odx-types', 'index.d.ts')
      const previousRegistry = readFileSync(registryPath, 'utf8')
      writeFileSync(metadataPath, xml.replace('Name="Name"', 'Name="Label"'))
      vi.mocked(execFileSync).mockImplementationOnce((_command, args) => {
        if (!Array.isArray(args))
          throw new Error('Expected SDK generator arguments')
        const output = args[args.indexOf('--output') + 1]
        if (typeof output !== 'string' || !output.startsWith(join(harness.buildDir, 'odx', 'temp')))
          throw new Error('Expected an owned SDK staging directory')
        writeFileSync(join(output, 'MinimalLocalModel.ts'), 'partial failed model')
        throw new Error('Generator failed')
      })

      await expect(harness.runPrepareTypes()).rejects.toThrow('Generator failed')
      expect(readFileSync(cachePath, 'utf8')).toBe(previousCache)
      expect(readFileSync(registryPath, 'utf8')).toBe(previousRegistry)
      expect(readFileSync(join(outDir, 'MinimalLocalModel.ts'), 'utf8')).toContain('export interface Product')
      expect(fs.readdirSync(join(harness.buildDir, 'odx', 'temp'))).toEqual([])

      await harness.runPrepareTypes()
      expect(execFileSync).toHaveBeenCalledTimes(3)
      expect(readFileSync(cachePath, 'utf8')).not.toBe(previousCache)
      await harness.runPrepareTypes()
      expect(execFileSync).toHaveBeenCalledTimes(3)
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
          expect.stringContaining(join(harness.buildDir, 'odx', 'temp', 'Sales-Order-sdk-')),
        ]),
        { stdio: 'pipe' },
      )
    })
  })

  describe('downloadMetadata', () => {
    it.each(['aborted', 'close'])('rejects a partial metadata response on %s without waiting for end', async (event) => {
      const response = new EventEmitter() as any
      response.statusCode = 200
      response.complete = false
      vi.mocked(https.get).mockImplementation((_url, _options, callback) => {
        callback!(response)
        return createMockRequest()
      })
      const result = downloadMetadata({ name: 'Catalog', url: 'https://example.com/odata' }, {} as any)
        .then(value => ({ state: 'resolved', value }), error => ({ state: 'rejected', message: error.message }))
      response.emit('data', '<edmx:Edmx>')
      response.emit(event)

      expect(await Promise.race([
        result,
        new Promise(resolve => setImmediate(() => resolve({ state: 'pending' }))),
      ])).toEqual({ state: 'rejected', message: 'Metadata response ended before completion' })
    })

    it('handles response errors without an unhandled stream exception', async () => {
      const response = new EventEmitter() as any
      response.statusCode = 200
      response.complete = false
      vi.mocked(https.get).mockImplementation((_url, _options, callback) => {
        callback!(response)
        return createMockRequest()
      })
      const result = downloadMetadata({ name: 'Catalog', url: 'https://example.com/odata' }, {} as any)
        .then(value => ({ state: 'resolved', value }), error => ({ state: 'rejected', error }))
      const failure = new Error('Response stream failed')
      expect(() => response.emit('error', failure)).not.toThrow()
      expect(await Promise.race([
        result,
        new Promise(resolve => setImmediate(() => resolve({ state: 'pending' }))),
      ])).toEqual({ state: 'rejected', error: failure })
    })

    it('consumes a later response error after rejecting an HTTP status', async () => {
      const response = new EventEmitter() as any
      response.statusCode = 503
      response.complete = false
      response.resume = vi.fn()
      vi.mocked(https.get).mockImplementation((_url, _options, callback) => {
        callback!(response)
        return createMockRequest()
      })
      const result = downloadMetadata({ name: 'Catalog', url: 'https://example.com/odata' }, {} as any)
        .catch(error => error)
      expect(() => response.emit('error', new Error('Response failed during drain'))).not.toThrow()
      expect(await result).toMatchObject({ message: 'Status: 503' })
      expect(response.resume).toHaveBeenCalledOnce()
    })

    it('keeps a fully received metadata response successful when it closes', async () => {
      const response = new EventEmitter() as any
      response.statusCode = 200
      response.complete = true
      vi.mocked(https.get).mockImplementation((_url, _options, callback) => {
        callback!(response)
        return createMockRequest()
      })
      const result = downloadMetadata({ name: 'Catalog', url: 'https://example.com/odata' }, {} as any)
      response.emit('data', '<metadata/>')
      response.emit('end')
      response.emit('close')
      await expect(result).resolves.toBe('<metadata/>')
    })

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
