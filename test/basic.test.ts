import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('Nuxt SAP OData Module Integration', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('proxies basic GET requests correctly to the destination', async () => {
    const response = (await $fetch('/api/sap-odata/TestService/TestItems')) as any

    expect(response).toBeDefined()
    expect(Array.isArray(response)).toBe(true)
    expect(response).toHaveLength(3)
    expect(response[0].Title).toBe('Test Item 1')
  })

  it('passes OData query parameters unaltered through the proxy', async () => {
    const response = (await $fetch('/api/sap-odata/TestService/TestItems', {
      query: {
        $top: 1,
        $skip: 1,
      },
    })) as any

    expect(Array.isArray(response)).toBe(true)
    expect(response).toHaveLength(1)
    expect(response[0].Title).toBe('Test Item 2')
  })

  it('handles target server errors gracefully', async () => {
    try {
      await $fetch('/api/sap-odata/TestService/EntityThatDoesNotExist')
      expect.unreachable('Should have thrown an error')
    }
    catch (error: any) {
      const status = error.status || error.response?.status
      expect(status).toBe(404)
    }
  })

  /**
   * Validates that authentication and custom headers from nuxt.config.ts
   * are correctly injected into the outgoing proxy request.
   */
  it('injects authentication and custom headers from configuration', async () => {
    const response = (await $fetch('/api/sap-odata/TestService/TestHeaders')) as any

    expect(response.authorization).toBe('Bearer test-token-123')
    expect(response.xCustomTest).toBe('it-works')
  })
})
