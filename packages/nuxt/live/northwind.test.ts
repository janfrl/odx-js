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

  it('normalizes equivalent V2 and V4 Categories reads through the server proxy', async () => {
    const html = await $fetch('/')

    expect(html).toContain('First V4 Category: Beverages')
    expect(html).toContain('First V2 Category: Beverages')
    expect(html).not.toContain('No V4 data found')
    expect(html).not.toContain('No V2 data found')
  }, 30000)
})
