import type { ODataServiceConfig } from '@me-tools/odx-core'
import { describe, expect, it } from 'vitest'
import {
  assertSafeODataServiceName,
  assertUnambiguousODataServiceRoutes,
  findODataServiceByRoute,
  normalizeODataServiceRoute,
  normalizeODataServiceRoutes,
} from '../src/utils/service-route'

describe('oData service routes', () => {
  it.each(['Catalog', 'R&D Catalog', 'catalog.v2'])('accepts a path-safe service name %j', (name) => {
    expect(() => assertSafeODataServiceName(name)).not.toThrow()
  })

  it.each([
    '',
    '.',
    '..',
    '../Catalog',
    'Catalog/Other',
    'Catalog\\Other',
    'catalog:tenant',
    'catalog*',
    'catalog?',
    'catalog\u0000',
    'CON',
    'nul.json',
    'COM1',
    'LPT9.logs',
    'Catalog.',
    'Catalog ',
  ])('rejects a non-portable generated-file service name %j', (name) => {
    expect(() => assertSafeODataServiceName(name)).toThrow('must be a portable generated-file segment')
    expect(() => normalizeODataServiceRoutes([{ name, route: 'catalog' }])).toThrow(
      'must be a portable generated-file segment',
    )
  })

  it.each([
    ['catalog', 'catalog'],
    ['/business-partner/', 'business-partner'],
    ['catalog%2Dv2', 'catalog%2Dv2'],
  ])('normalizes one local service segment %s', (input, expected) => {
    expect(normalizeODataServiceRoute(input)).toBe(expected)
  })

  it.each([
    '',
    '/',
    'catalog/products',
    '../catalog',
    '%2e%2e',
    'catalog%2Fproducts',
    'catalog\\products',
    'catalog?tenant=one',
    'catalog#fragment',
    'catalog api',
    'catalog%20api',
    '%ZZ',
  ])('rejects an unsafe or ambiguous service segment %j', (input) => {
    expect(() => normalizeODataServiceRoute(input)).toThrow('OData service route')
  })

  it('resolves normalized aliases and preserves a valid name fallback', () => {
    const service = { name: 'Catalog', route: '/catalog-api/' } as ODataServiceConfig
    const services = [service]

    expect(findODataServiceByRoute(services, 'catalog-api')).toBe(service)
    expect(findODataServiceByRoute(services, 'CATALOG')).toBe(service)
  })

  it('returns normalized copies without mutating caller-owned service config', () => {
    const service = { name: 'Catalog', route: '/catalog-api/' } as ODataServiceConfig
    const normalized = normalizeODataServiceRoutes([service])

    expect(normalized).toEqual([{ name: 'Catalog', route: 'catalog-api' }])
    expect(service.route).toBe('/catalog-api/')
  })

  it('allows a route alias to own the path when the display name is not URL-safe', () => {
    const service = { name: 'R&D Catalog', route: 'catalog' } as ODataServiceConfig
    expect(findODataServiceByRoute([service], 'catalog')).toBe(service)
  })

  it('rejects case-insensitive collisions across aliases and fallback names', () => {
    const services = [
      { name: 'Catalog', route: 'products' },
      { name: 'Products', route: 'other' },
    ] as ODataServiceConfig[]

    expect(() => assertUnambiguousODataServiceRoutes(services)).toThrow(
      'ambiguous between services',
    )
    expect(() => findODataServiceByRoute(services, 'PRODUCTS')).toThrow(
      'multiple configured services',
    )
  })
})
