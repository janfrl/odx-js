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
    const indexFile = join(outDir, 'index.js')

    let entities: string[] = []
    let isGenerated = false

    if (fs.existsSync(indexFile)) {
      isGenerated = true
      try {
        const sdk = await import(pathToFileURL(indexFile).href)
        const apiFactoryName = `${svc.name}Api`
        if (sdk[apiFactoryName]) {
          const api = sdk[apiFactoryName]()
          // Extrahiere alle Keys, die wie Entity-APIs aussehen (enden oft auf 'Api' oder sind CamelCase)
          entities = Object.keys(api).filter(k =>
            typeof api[k] === 'object'
            && k !== 'requestBuilder'
            && !k.startsWith('_'),
          )
        }
      }
      catch (e) {
        console.error(`Failed to parse SDK for ${svc.name}`, e)
      }
    }
    else {
      // Mock-Entities für den Playground, wenn noch kein SDK da ist
      entities = ['Products', 'Suppliers', 'Categories']
    }

    return {
      ...svc,
      entities,
      isGenerated,
    }
  }))

  return {
    basePath: config.public.odata?.basePath || '/api/sap-odata',
    mode: config.public.odata?.mode || 'sdk',
    services: enhancedServices,
    forwardAuthHeader: config.odata?.forwardAuthHeader,
    versions: {
      node: process.version,
      module: '1.0.0',
    },
  }
})
