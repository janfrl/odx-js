import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('nuxt ODX Module Integration', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../../../test/fixtures/basic', import.meta.url)),
    nuxtConfig: {
      // Node 24 rejects Nitro's file:///_entry.js placeholder in split chunks.
      nitro: {
        inlineDynamicImports: true,
        preset: 'node-server',
      },
    } as any,
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
})
