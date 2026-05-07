import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { createNitroE2ETestConfig } from './nitro-test-config'

describe('isolated production e2e', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/isolated', import.meta.url)),
    build: true,
    server: true,
    nuxtConfig: createNitroE2ETestConfig() as any,
  })

  it('renders data from direct odata fetch in production build', async () => {
    const html = await $fetch('/')

    // Assert that the data fetched via useOData is present in the SSR output
    expect(html).toContain('First Category: Beverages')
    expect(html).not.toContain('No data found')
  }, 30000)
})
