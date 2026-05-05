import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { EventEmitter } from 'node:events'
import http from 'node:http'
import https from 'node:https'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadMetadata, generateODataTypes, generateRegistryDts } from '../src/generate'

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
  execSync: vi.fn(),
}))
vi.mock('node:http')
vi.mock('node:https')

describe('type Generation Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  describe('downloadMetadata', () => {
    it('sets Bearer token header when provided', async () => {
      const svc = { name: 'Test', url: 'https://example.com/odata' }
      const config = { auth: { bearerToken: 'test-token' }, rejectUnauthorized: false } as any

      const mockRequest = new EventEmitter() as any
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

      const mockRequest = new EventEmitter() as any
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

      const mockRequest = new EventEmitter() as any
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
      vi.mocked(https.get).mockImplementation((url, options, callback) => {
        const res = new EventEmitter() as any
        res.statusCode = 404
        callback!(res)
        return new EventEmitter() as any
      })

      await expect(downloadMetadata(svc, {} as any)).rejects.toThrow('Status: 404')
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
      expect(result).toContain('Svc1: ODataService<"Products" | "Categories", { "Products": Svc1Models.Product, "Categories": Svc1Models.Category }>')
      expect(result).toContain('Svc2: ODataService<"Orders", { "Orders": Svc2Models.Order }>')
    })

    it('handles services without model files', () => {
      const serviceEntities = {
        SvcEmpty: [{ name: 'Items', type: 'Item', properties: [], navigationProperties: [] }],
      }
      const serviceModelFiles = {}

      const result = generateRegistryDts(serviceEntities, serviceModelFiles)

      expect(result).toContain('SvcEmpty: ODataService<"Items", Record<string, any>>')
    })

    it('handles services without entities', () => {
      const serviceEntities = {
        SvcNoEntities: [],
      }
      const serviceModelFiles = {
        SvcNoEntities: 'Model',
      }

      const result = generateRegistryDts(serviceEntities, serviceModelFiles)

      expect(result).toContain('SvcNoEntities: ODataService<string, {  }>')
    })
  })
})
