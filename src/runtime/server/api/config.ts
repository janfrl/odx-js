import { defineEventHandler, useRuntimeConfig } from '#imports'
import { join } from 'pathe'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const buildDir = config.odata?.buildDir as string
  const services = (config.odata?.services || []) as Array<{ name: string, route?: string }>

  const enhancedServices = await Promise.all(services.map(async (svc) => {
    const outDir = join(buildDir, 'sap-odata', 'generated', svc.name)
    
    const subDirName = svc.route || svc.name.toLowerCase()
    const indexFileJs = join(outDir, subDirName, 'index.js')
    const indexFileTs = join(outDir, subDirName, 'index.ts')

    let entities: string[] = ['ExampleEntities', 'Products', 'Suppliers', 'Categories']
    let isGenerated = false

    // Status logic
    if (fs.existsSync(outDir) && (fs.existsSync(indexFileJs) || fs.existsSync(indexFileTs))) {
      isGenerated = true
      
      // Try to parse real entities if possible
      if (fs.existsSync(indexFileJs)) {
        try {
          const sdk = await import(pathToFileURL(indexFileJs).href)
          const apiFactoryName = `${svc.name}Api`
          if (sdk[apiFactoryName]) {
            const api = sdk[apiFactoryName]()
            const realEntities = Object.keys(api).filter(k =>
              typeof api[k] === 'object' && k !== 'requestBuilder' && !k.startsWith('_')
            )
            if (realEntities.length > 0) entities = realEntities
          }
        } catch (e) {
          console.warn(`[nuxt-sap-odata] Could not parse SDK entities for ${svc.name}, using mocks.`)
        }
      }
    }

    return {
      ...svc,
      entities,
      isGenerated
    }
  }))

  return {
    basePath: config.public.odata?.basePath || '/api/sap-odata',
    mode: config.public.odata?.mode || 'sdk',
    services: enhancedServices,
    forwardAuthHeader: config.odata?.forwardAuthHeader,
    versions: {
      node: process.version,
      module: '1.0.0'
    }
  }
})
