import { createEvent } from 'h3'
import { describe, expect, it } from 'vitest'
import {
  normalizeODataProxyBasePath,
  parseODataRequest,
  resolveTargetUrl,
} from '../src/utils/url'

describe('oDX proxy base paths', () => {
  it.each([
    ['/api/odx', '/api/odx'],
    ['/tenant-a/odata-proxy/', '/tenant-a/odata-proxy'],
    ['/%E2%82%AC-api', '/%E2%82%AC-api'],
  ])('normalizes a local proxy mount %s', (input, expected) => {
    expect(normalizeODataProxyBasePath(input)).toBe(expected)
  })

  it.each([
    '',
    '/',
    'api/odx',
    '//remote.example/odx',
    'https://remote.example/odx',
    '/api//odx',
    '/api/../odx',
    '/api/%2e%2e/odx',
    '/api/%2Fodx',
    '/api\\odx',
    '/api/odx?tenant=one',
    '/api/odx#fragment',
    '/api/odx ',
    '/api/%ZZ',
  ])('rejects an unsafe or ambiguous proxy mount %j', (input) => {
    expect(() => normalizeODataProxyBasePath(input)).toThrow('ODX proxy basePath')
  })
})

describe('oData URL Utilities', () => {
  describe('parseODataRequest', () => {
    it('correctly parses a simple OData request', () => {
      const event = { path: '/api/odx/TestService/Products' } as any
      const result = parseODataRequest(event, '/api/odx')

      expect(result.serviceName).toBe('TestService')
      expect(result.odataPath).toBe('Products')
      expect(result.query).toBe('')
    })

    it('handles query parameters correctly', () => {
      const event = { path: '/api/odx/TestService/Products?$filter=Name eq \'Test\'' } as any
      const result = parseODataRequest(event, '/api/odx')

      expect(result.serviceName).toBe('TestService')
      expect(result.odataPath).toBe('Products')
      expect(result.query).toBe('?$filter=Name eq \'Test\'')
    })

    it('preserves question marks that are part of the query string', () => {
      const event = { path: '/api/odx/TestService/Products?$filter=contains(Name,\'?\')&$top=1' } as any
      const result = parseODataRequest(event, '/api/odx')

      expect(result.serviceName).toBe('TestService')
      expect(result.odataPath).toBe('Products')
      expect(result.query).toBe('?$filter=contains(Name,\'?\')&$top=1')
    })

    it('normalizes base paths configured with trailing slashes', () => {
      const event = { path: '/api/odx/TestService/Products' } as any
      const result = parseODataRequest(event, '/api/odx//')

      expect(result.serviceName).toBe('TestService')
      expect(result.odataPath).toBe('Products')
      expect(result.query).toBe('')
    })

    it('normalizes an extra slash after the base path boundary', () => {
      const event = { path: '/api/odx//TestService/Products' } as any
      const result = parseODataRequest(event, '/api/odx')

      expect(result.serviceName).toBe('TestService')
      expect(result.odataPath).toBe('Products')
      expect(result.query).toBe('')
    })

    it('preserves query strings after normalizing path boundaries', () => {
      const event = { path: '/api/odx//TestService/Products?$filter=contains(Name,\'?\')&next=/foo?bar=baz' } as any
      const result = parseODataRequest(event, '/api/odx/')

      expect(result.serviceName).toBe('TestService')
      expect(result.odataPath).toBe('Products')
      expect(result.query).toBe('?$filter=contains(Name,\'?\')&next=/foo?bar=baz')
    })

    it('rejects requests outside the configured path boundary', () => {
      const event = { path: '/api/odx-other/TestService/Products' } as any
      expect(() => parseODataRequest(event, '/api/odx')).toThrow(
        'outside the configured ODX proxy basePath',
      )
    })

    it.each([
      '/api/odx/TestService/../Secret',
      '/api/odx/TestService/%2e%2e/Secret',
      '/api/odx/TestService/Products/%2F..%2F/Secret',
      '/api/odx/TestService/Products/%5c..%5c/Secret',
      '/api/odx/TestService/Products\\..\\Secret',
      '/api/odx/TestService/Products/%00/Secret',
      '/api/odx/TestService/Products/%ZZ',
      '/api/odx/TestService//Secret',
    ])('rejects a traversing or malformed H3 resource path %s', (path) => {
      const event = createEvent({
        headers: { host: 'localhost:3000' },
        method: 'GET',
        url: path,
      } as any, {} as any)

      expect(() => parseODataRequest(event, '/api/odx')).toThrow(
        'must remain service-relative',
      )
    })

    it('retains encoded separators inside an OData key literal', () => {
      const event = { path: '/api/odx/TestService/Products(\'A%2FB\')' } as any

      expect(parseODataRequest(event, '/api/odx')).toMatchObject({
        serviceName: 'TestService',
        odataPath: 'Products(\'A%2FB\')',
      })
    })

    it('retains encoded spaces inside an OData function string literal', () => {
      const event = createEvent({
        headers: { host: 'localhost:3000' },
        method: 'GET',
        url: '/api/odx/catalog/Products/Example.Catalog.GetProductDefaults(Name=\'Office%20Desk\',Price=125.50)',
      } as any, {} as any)

      expect(parseODataRequest(event, '/api/odx')).toMatchObject({
        serviceName: 'catalog',
        odataPath: 'Products/Example.Catalog.GetProductDefaults(Name=\'Office%20Desk\',Price=125.50)',
      })
    })

    it('accepts an OData string literal decoded by the host router', () => {
      const event = {
        path: '/api/odx/catalog/Products/Example.Catalog.GetProductDefaults(Name=\'Office Desk\',Price=125.50)',
      } as any

      expect(parseODataRequest(event, '/api/odx')).toMatchObject({
        serviceName: 'catalog',
        odataPath: 'Products/Example.Catalog.GetProductDefaults(Name=\'Office Desk\',Price=125.50)',
      })
    })

    it.each([
      '/api/odx/TestService/Products/Bad Segment',
      '/api/odx/TestService/Products/Bad%20Segment',
      '/api/odx/TestService/Products(Name=\'Unclosed)',
      '/api/odx/TestService/Products(Name=\'Bad%09Value\')',
    ])('rejects unquoted, unbalanced, or control resource whitespace %s', (path) => {
      const event = createEvent({
        headers: { host: 'localhost:3000' },
        method: 'GET',
        url: path,
      } as any, {} as any)

      expect(() => parseODataRequest(event, '/api/odx')).toThrow(
        'must remain service-relative',
      )
    })
  })

  describe('resolveTargetUrl', () => {
    const createMockEvent = () => {
      // h3 createEvent needs a node req/res
      const req = {
        headers: { host: 'localhost:3000' },
        url: '/',
        method: 'GET',
      } as any
      const res = {} as any
      return createEvent(req, res)
    }

    it('resolves absolute target URL correctly', () => {
      const event = createMockEvent()
      const requestInfo = {
        serviceName: 'TestService',
        odataPath: 'Products',
        query: '',
        segments: ['TestService', 'Products'],
      }
      const targetBase = 'https://sapes5.sapdevcenter.com/sap/opu/odata/sap/TEST_SERVICE'

      const result = resolveTargetUrl(event, targetBase, requestInfo, false)
      expect(result).toBe('https://sapes5.sapdevcenter.com/sap/opu/odata/sap/TEST_SERVICE/Products')
    })

    it('appends the OData path before a configured query and preserves both query components', () => {
      const event = createMockEvent()
      const requestInfo = {
        serviceName: 'TestService',
        odataPath: 'Products',
        query: '?%24filter=Name%20eq%20%27Desk%27&sap-client=200',
        segments: ['TestService', 'Products'],
      }
      const targetBase = 'HTTPS://backend.example/odata?sap-client=100&signature=a%2Bb%3D#inspection'

      const result = resolveTargetUrl(event, targetBase, requestInfo, false)

      expect(result).toBe(
        'HTTPS://backend.example/odata/Products?sap-client=100&signature=a%2Bb%3D&%24filter=Name%20eq%20%27Desk%27&sap-client=200',
      )
    })

    it('resolves spaces inside an OData string literal without weakening path boundaries', () => {
      const event = createMockEvent()
      const result = resolveTargetUrl(event, 'https://backend.example/odata', {
        serviceName: 'catalog',
        odataPath: 'Products/Example.Catalog.GetProductDefaults(Name=\'Office Desk\',Price=125.50)',
        query: '',
        segments: ['catalog'],
      })

      expect(new URL(result).pathname).toBe(
        '/odata/Products/Example.Catalog.GetProductDefaults(Name=\'Office%20Desk\',Price=125.50)',
      )
    })

    it('resolves relative target URL with technical service name (aliasing fix)', () => {
      const event = createMockEvent()
      // Scenario: Request uses route 'v2', but technical name is 'V2Service'
      const requestInfo = {
        serviceName: 'v2',
        odataPath: 'Suppliers',
        query: '',
        segments: ['v2', 'Suppliers'],
      }
      const targetBase = '/sap/opu/odata/sap'
      const technicalName = 'V2Service'

      const result = resolveTargetUrl(event, targetBase, requestInfo, true, technicalName)

      // Should contain the technical name, not the route alias
      expect(result).toContain('/sap/opu/odata/sap/V2Service/Suppliers')
      // Should be an absolute URL (resolved against mock host)
      expect(result).toBe('http://localhost:3000/sap/opu/odata/sap/V2Service/Suppliers')
    })

    it.each([
      '169.254.169.254',
      'backend.example',
      '10.0.0.8:3000',
    ])('rejects a non-loopback request host for relative targets: %s', (host) => {
      const event = createEvent({
        headers: {
          host,
          'x-forwarded-proto': 'https',
        },
        url: '/',
        method: 'GET',
      } as any, {} as any)
      const requestInfo = {
        serviceName: 'v2',
        odataPath: 'Suppliers',
        query: '',
        segments: ['v2', 'Suppliers'],
      }

      expect(() => resolveTargetUrl(
        event,
        '/sap/opu/odata/sap',
        requestInfo,
        true,
        'V2Service',
      )).toThrow('relative backend targets require a loopback request host')
    })

    it.each([
      '127.0.0.1:3000',
      '127.12.34.56:3000',
      '[::1]:3000',
      'mock.localhost:3000',
    ])('keeps an explicit loopback request host for relative targets: %s', (host) => {
      const event = createEvent({
        headers: { host },
        url: '/',
        method: 'GET',
      } as any, {} as any)

      expect(resolveTargetUrl(event, '/sap/opu/odata/sap', {
        serviceName: 'v2',
        odataPath: 'Suppliers',
        query: '',
        segments: ['v2', 'Suppliers'],
      }, true, 'V2Service')).toContain('/sap/opu/odata/sap/V2Service/Suppliers')
    })

    it('prevents double slashes in the resolved URL', () => {
      const event = createMockEvent()
      const requestInfo = {
        serviceName: 'V2Service',
        odataPath: 'Products',
        query: '',
        segments: ['V2Service', 'Products'],
      }
      const targetBase = '/sap/opu/odata/sap/' // Trailing slash

      const result = resolveTargetUrl(event, targetBase, requestInfo, true, 'V2Service')
      expect(result).toBe('http://localhost:3000/sap/opu/odata/sap/V2Service/Products')
    })

    it('rejects a manually constructed traversing resource path', () => {
      const event = createMockEvent()

      expect(() => resolveTargetUrl(event, 'https://backend.example/odata', {
        serviceName: 'catalog',
        odataPath: '../Secret',
        query: '',
        segments: ['catalog', '..', 'Secret'],
      })).toThrow('must remain service-relative')
    })

    it.each([
      '../OtherService',
      'Catalog/OtherService',
      'Catalog%2FOtherService',
      'Catalog?tenant=other',
      'Catalog#fragment',
      'Catalog Service',
      'Catalog\\OtherService',
    ])('rejects unsafe technical names for relative targets: %s', (technicalName) => {
      const event = createMockEvent()
      const requestInfo = {
        serviceName: 'catalog',
        odataPath: 'Products',
        query: '',
        segments: ['catalog', 'Products'],
      }

      expect(() => resolveTargetUrl(
        event,
        '/sap/opu/odata/sap',
        requestInfo,
        true,
        technicalName,
      )).toThrow('must be one exact local URL segment')
    })

    it('escapes single quotes in explorer-style string IDs as OData string literals', () => {
      const event = createMockEvent()
      const requestInfo = {
        serviceName: 'TestService',
        odataPath: 'Products',
        query: '?id=O%27Reilly',
        segments: ['TestService', 'Products'],
      }
      const targetBase = 'https://sapes5.sapdevcenter.com/sap/opu/odata/sap/TEST_SERVICE'

      const result = resolveTargetUrl(event, targetBase, requestInfo, false)
      expect(result).toBe('https://sapes5.sapdevcenter.com/sap/opu/odata/sap/TEST_SERVICE/Products(\'O\'\'Reilly\')')
    })
  })
})
