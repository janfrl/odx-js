import { createEvent } from 'h3'
import { describe, expect, it } from 'vitest'
import { parseODataRequest, resolveTargetUrl } from '../src/utils/url'

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
  })
})
