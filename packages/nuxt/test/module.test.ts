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
    const response = await fetch('/')
    const html = await response.text()
    expect(response.status, html).toBe(200)

    expect(html).toContain('Northwind Category: Beverages')
    expect(html).toContain('Northwind Category Count: 49')
    expect(html).toContain('Northwind Page Category: Beverages')
    expect(html).toContain('Northwind Continuation Category: Condiments')
    expect(html).toContain('Northwind Continuation Safe: true')
    expect(html).toContain('Northwind Category Detail: 1 / Beverages')
    expect(html).toContain('Northwind Related Product: Chai')
    expect(html).toContain('Northwind Related Product Response: Chai / W/&quot;northwind-product-1&quot;')
    expect(html).toContain('Northwind Related Product Continuation: Chang')
    expect(html).not.toContain('Northwind Category: missing')
    expect(html).not.toContain('Northwind Category Count: missing')
    expect(html).not.toContain('Northwind Page Category: missing')
    expect(html).not.toContain('private.northwind.example')
    expect(html).not.toContain('Northwind Category Detail: missing')
    expect(html).not.toContain('Northwind Related Product: missing')
    expect(html).not.toContain('Northwind Related Product Response: Chai / missing')
    expect(html).not.toContain('Northwind Related Product Continuation: missing')
  })

  it('proxies deterministic Northwind V2 continuation pages without rewriting their query', async () => {
    const first = await $fetch<any>('/api/odx/northwind/Categories', {
      headers: { accept: 'application/json' },
      query: {
        $orderby: 'CategoryID',
        $select: 'CategoryID,CategoryName',
        $top: 1,
      },
    })
    expect(first.d.results[0].CategoryName).toBe('Beverages')
    expect(first.d.__next).toContain('private.northwind.example')

    const second = await $fetch<any>('/api/odx/northwind/Categories?%24orderby=CategoryID&%24select=CategoryID%2CCategoryName&%24top=1&%24skiptoken=CategoryID-1', {
      headers: { accept: 'application/json' },
    })
    expect(second).toMatchObject({
      d: { results: [{ CategoryID: 2, CategoryName: 'Condiments' }] },
    })
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

  it('enforces a deterministic Northwind optimistic-concurrency round trip', async () => {
    await $fetch('/__test__/northwind', { method: 'DELETE' })
    try {
      const currentEtag = 'W/"northwind-category-1"'
      const updatedEtag = 'W/"northwind-category-2"'
      const path = '/api/odx/northwind/Categories(1)?%24select=CategoryID%2CCategoryName'

      const updated = await fetch(path, {
        body: JSON.stringify({ CategoryName: 'Hot Beverages' }),
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'if-match': currentEtag,
        },
        method: 'PATCH',
      })

      expect(updated.status).toBe(200)
      expect(updated.headers.get('etag')).toBe(updatedEtag)
      await expect(updated.json()).resolves.toMatchObject({
        d: { CategoryID: 1, CategoryName: 'Hot Beverages' },
      })

      const stale = await fetch(path, {
        body: JSON.stringify({ CategoryName: 'Stale Update' }),
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'if-match': currentEtag,
        },
        method: 'PATCH',
      })
      expect(stale.status).toBe(412)

      const persisted = await fetch(path, {
        headers: { accept: 'application/json' },
      })
      expect(persisted.headers.get('etag')).toBe(updatedEtag)
      await expect(persisted.json()).resolves.toMatchObject({
        d: { CategoryName: 'Hot Beverages' },
      })
    }
    finally {
      await $fetch('/__test__/northwind', { method: 'DELETE' })
    }
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
