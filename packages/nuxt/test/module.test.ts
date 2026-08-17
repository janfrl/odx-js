import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { createNitroE2ETestConfig } from './nitro-test-config'

describe('nuxt ODX Module Integration', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../../test/fixtures/basic', import.meta.url)),
    nuxtConfig: createNitroE2ETestConfig() as any,
  })

  it('proxies basic GET requests correctly to the destination', async () => {
    const response = (await $fetch('/api/odx/TestService/TestItems')) as any
    expect(response).toBeDefined()
    expect(response.d.results).toBeDefined()
    expect(Array.isArray(response.d.results)).toBe(true)
    expect(response.d.results[0].Title).toBe('Test Item 1')
  })

  it('passes OData query parameters unaltered through the proxy', async () => {
    const response = (await $fetch('/api/odx/TestService/TestItems', {
      query: { $top: 1, $skip: 1 },
    })) as any
    expect(response.d.results).toHaveLength(1)
    expect(response.d.results[0].Title).toBe('Test Item 2')
  })

  it('handles target server errors gracefully', async () => {
    try {
      await $fetch('/api/odx/TestService/EntityThatDoesNotExist')
      expect.unreachable('Should have thrown an error')
    }
    catch (error: any) {
      const status = error.status || error.response?.status
      expect(status).toBe(404)
    }
  })

  it('injects authentication and custom headers from configuration', async () => {
    const response = (await $fetch('/api/odx/TestService/TestHeaders')) as any
    expect(response.authorization).toBe('Bearer test-token-123')
    expect(response.xCustomTest).toBe('it-works')
  })

  it('projects privacy-safe ODX telemetry into one evlog wide event', async () => {
    const privateFilterValue = 'private-test-value'
    await $fetch('/__test__/evlog', {
      method: 'DELETE',
    })
    await $fetch('/api/odx/TestService/TestItems', {
      query: {
        $filter: `Title eq '${privateFilterValue}'`,
      },
    })

    await expect.poll(async () => await $fetch<any[]>('/__test__/evlog')).toHaveLength(1)
    const events = await $fetch<any[]>('/__test__/evlog')
    const event = events.find(candidate =>
      candidate.operation === 'odx.proxy'
      && candidate.odx?.serviceId === 'TestService',
    )

    expect(event).toBeDefined()
    expect(event).toMatchObject({
      operation: 'odx.proxy',
      path: '/api/odx/:service/:entitySet',
      requestId: event.odx.requestId,
      host: { integrationLayer: 'service-hook' },
      odx: {
        schemaVersion: 1,
        operationId: 'catalog.list:test-items',
        serviceId: 'TestService',
        entitySetId: 'TestItems',
        method: 'GET',
        outcome: 'success',
        targetKind: 'mock',
        status: 200,
      },
    })

    const serialized = JSON.stringify(event)
    expect(serialized).not.toContain(privateFilterValue)
    expect(serialized).not.toContain('$filter')
    expect(serialized).not.toContain('test-token-123')
    expect(serialized).not.toContain('it-works')
  })

  it('renders a canonical Northwind V2 query through the generated composable and local proxy', async () => {
    const html = await $fetch<string>('/')

    expect(html).toContain('Northwind Category: Beverages')
    expect(html).toContain('Northwind Category Count: 49')
    expect(html).toContain('Northwind Page Category: Beverages')
    expect(html).toContain('Northwind Category Detail: 1 / Beverages')
    expect(html).toContain('Northwind Related Product: Chai')
    expect(html).not.toContain('Northwind Category: missing')
    expect(html).not.toContain('Northwind Category Count: missing')
    expect(html).not.toContain('Northwind Page Category: missing')
    expect(html).not.toContain('Northwind Category Detail: missing')
    expect(html).not.toContain('Northwind Related Product: missing')
  })

  it('forwards a canonical Northwind entity ETag through the proxy', async () => {
    const response = await fetch('/api/odx/northwind/Categories(1)?%24select=CategoryID%2CCategoryName', {
      headers: { accept: 'application/json' },
    })

    expect(response.headers.get('etag')).toBe('W/"northwind-category-1"')
    await expect(response.json()).resolves.toMatchObject({
      d: { CategoryID: 1, CategoryName: 'Beverages' },
    })
  })

  it('emits one correlated failure event without backend details', async () => {
    await $fetch('/__test__/evlog', {
      method: 'DELETE',
    })

    await expect($fetch('/api/odx/TestService/EntityThatDoesNotExist')).rejects.toMatchObject({
      status: 404,
    })

    await expect.poll(async () => await $fetch<any[]>('/__test__/evlog')).toHaveLength(1)
    const [event] = await $fetch<any[]>('/__test__/evlog')

    expect(event).toMatchObject({
      operation: 'odx.proxy',
      path: '/api/odx/:service/:entitySet',
      requestId: event.odx.requestId,
      status: 404,
      host: { integrationLayer: 'service-hook' },
      odx: {
        schemaVersion: 1,
        serviceId: 'TestService',
        entitySetId: 'EntityThatDoesNotExist',
        outcome: 'failure',
        status: 404,
      },
    })

    const serialized = JSON.stringify(event)
    expect(serialized).not.toContain('Not Found')
    expect(serialized).not.toContain('EntityThatDoesNotExist?')
  })
})
