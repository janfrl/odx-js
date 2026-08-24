import { access } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import { describe, expect, it } from 'vitest'
import config from '../nuxt.config'

describe('Explorer Nuxt layer', () => {
  it('resolves its stylesheet from the package instead of the consumer root', async () => {
    const stylesheet = config.css?.[0]

    expect(typeof stylesheet).toBe('string')
    expect(isAbsolute(String(stylesheet))).toBe(true)
    await expect(access(String(stylesheet))).resolves.toBeUndefined()
    expect(config.vite).toBeUndefined()
  })
})
