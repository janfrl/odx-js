import { describe, expect, it } from 'vitest'
import odxNitroModule from '../src/nitro'

function createNitroOptions(sapXsuaa = false): any {
  return {
    options: {
      handlers: [],
      plugins: [],
      odata: {
        basePath: '/api/odx',
        buildDir: '.nuxt',
        mode: 'sdk',
        rootDir: '.',
        security: { sapXsuaa },
        services: [],
      },
    },
  }
}

describe('nitro runtime adapters', () => {
  it('keeps the base proxy free of the Node-only SAP security adapter', () => {
    const nitro = createNitroOptions()

    odxNitroModule.setup(nitro)

    expect(nitro.options.plugins).toHaveLength(1)
    expect(nitro.options.plugins[0]).toMatch(/plugins[\\/]btp-auth\.ts$/)
  })

  it('registers SAP XSUAA validation when the Node host opts in', () => {
    const nitro = createNitroOptions(true)

    odxNitroModule.setup(nitro)

    expect(nitro.options.plugins).toHaveLength(2)
    expect(nitro.options.plugins[1]).toMatch(/plugins[\\/]auth-btp\.ts$/)
  })
})
