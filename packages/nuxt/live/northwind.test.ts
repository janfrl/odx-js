import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { createNitroE2ETestConfig } from '../test/nitro-test-config'

describe('northwind live smoke', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../test/fixtures/isolated', import.meta.url)),
    build: true,
    server: true,
    nuxtConfig: createNitroE2ETestConfig() as any,
  })

  it('renders a non-empty Categories read through the server proxy', async () => {
    const html = await $fetch('/')

    expect(html).toMatch(/First Category:\s*[^<\s][^<]*/u)
    expect(html).not.toContain('No data found')
    expect(html).not.toContain('Data is empty array')
  }, 30000)
})
