import { describe, expect, it } from 'vitest'
import odxNitroModule from '../src/nitro'

function createNitroOptions(sapXsuaa = false): any {
  return {
    options: {
      handlers: [],
      plugins: [],
      externals: { inline: [] },
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
    expect(nitro.options.externals.inline).toHaveLength(1)
    expect(nitro.options.externals.inline[0]).toMatch(/packages[\\/]proxy[\\/]src$/)
  })

  it('registers SAP XSUAA validation when the Node host opts in', () => {
    const nitro = createNitroOptions(true)

    odxNitroModule.setup(nitro)

    expect(nitro.options.plugins).toHaveLength(2)
    expect(nitro.options.plugins[1]).toMatch(/plugins[\\/]auth-btp\.ts$/)
    expect(nitro.options.externals.inline).toHaveLength(1)
    expect(nitro.options.externals.inline[0]).toMatch(/packages[\\/]proxy[\\/]src$/)
  })

  it('normalizes the configured proxy handler mount', () => {
    const nitro = createNitroOptions()
    nitro.options.odata.basePath = '/api/odx///'
    nitro.options.odata.services = [{ name: 'Catalog', route: '/catalog-api/' }]

    odxNitroModule.setup(nitro)

    expect(nitro.options.handlers[0]?.route).toBe('/api/odx/**')
    expect(nitro.options.odata).toMatchObject({
      basePath: '/api/odx',
      services: [{ name: 'Catalog', route: 'catalog-api' }],
    })
  })

  it('rejects an unsafe proxy handler mount before registering routes', () => {
    const nitro = createNitroOptions()
    nitro.options.odata.basePath = '//remote.example/odx'

    expect(() => odxNitroModule.setup(nitro)).toThrow('ODX proxy basePath')
    expect(nitro.options.handlers).toEqual([])
  })

  it('rejects ambiguous service ownership before registering routes', () => {
    const nitro = createNitroOptions()
    nitro.options.odata.services = [
      { name: 'Catalog', route: 'products' },
      { name: 'Products', route: 'other' },
    ]

    expect(() => odxNitroModule.setup(nitro)).toThrow('ambiguous between services')
    expect(nitro.options.handlers).toEqual([])
  })
})
