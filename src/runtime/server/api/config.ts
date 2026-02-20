import { defineEventHandler, useRuntimeConfig } from '#imports'
import { join } from 'pathe'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const buildDir = config.odata?.buildDir as string
  const services = (config.odata?.services || []) as Array<{ name: string, route?: string }>

  const jiti = createJiti(import.meta.url)

  const enhancedServices = await Promise.all(services.map(async (svc) => {
    const outDir = join(buildDir, 'sap-odata', 'generated', svc.name)
    const subDirName = svc.route || svc.name.toLowerCase()

    const indexFileTs = join(outDir, subDirName, 'index.ts')
    const indexFileJs = join(outDir, subDirName, 'index.js')

    let entities: string[] = ['ExampleEntities', 'Products', 'Suppliers', 'Categories']
    let isGenerated = false

    const targetFile = fs.existsSync(indexFileTs) ? indexFileTs : (fs.existsSync(indexFileJs) ? indexFileJs : null)

    if (targetFile) {
      isGenerated = true
      try {
        const sdk = targetFile.endsWith('.ts')
          ? await jiti.import(targetFile)
          : await import(pathToFileURL(targetFile).href)

        const apiFactoryName = `${svc.name}Api`
        const apiFactory = sdk[apiFactoryName]

        if (apiFactory) {
          const api = apiFactory()
          const sdkEntities = Object.keys(api).filter(k =>
            typeof api[k] === 'object' && k !== 'requestBuilder' && !k.startsWith('_'),
          )
          if (sdkEntities.length > 0) {
            entities = sdkEntities
          }
        }
      }
      catch {
        console.warn(`[nuxt-sap-odata] Metadata parsing failed for ${svc.name}, using mock entities.`)
      }
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
